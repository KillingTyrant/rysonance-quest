-- ===========================================================================
-- Schema del web service Apple Wallet su Supabase — file unico, stato corrente.
-- ===========================================================================
-- Idempotente: si può lanciare su un database vuoto (costruisce tutto) e su uno
-- che ha già una versione precedente di questo schema (aggiorna in place — vedi
-- la sezione "Aggiornamento da uno schema precedente" in fondo, che rimuove la
-- vecchia outbox del push automatico).
--
-- NON aggiungere `wallet` agli Exposed schemas (Settings → API): le tabelle
-- contengono push token APNs, non devono essere raggiungibili con la anon key.
--
-- Fuori scope (vedi docs/push-and-persistence.md): il trigger su
-- public.personaggi che marca i pass "da aggiornare" quando cambia la scheda —
-- va scritto elencando le sole colonne che finiscono nel pass, più i trigger
-- sulla tabella dei talenti. Finché non c'è, un pass installato si aggiorna a
-- comando: POST /admin/passes/{serial}/touch + POST /admin/passes/{serial}/push.

create schema if not exists wallet;

-- Il "last update tag" è una sequenza globale, non un timestamp: Apple richiede
-- che due tag siano confrontabili e che ogni tag nuovo sia successivo a tutti i
-- precedenti; now() non lo garantisce fra transazioni concorrenti.
create sequence if not exists wallet.pass_update_seq as bigint;

-- ---------------------------------------------------------------------------
-- wallet.passes — un record per pass emesso
-- ---------------------------------------------------------------------------
-- L'authenticationToken NON è persistito: si deriva via HMAC da type:serial
-- (src/services/auth.ts), il server verifica riderivando.

create table if not exists wallet.passes (
    id                   bigint generated always as identity primary key,

    -- restrict, non cascade: un pass installato su iPhone continua a chiamare
    -- GET /v1/passes/... anche dopo la cancellazione del personaggio. Il
    -- percorso corretto è voided = true + ultimo push, poi rimuovere la riga.
    personaggio_id       uuid        not null references public.personaggi (id) on delete restrict,

    -- la coppia è la chiave che Apple usa in tutti gli endpoint
    pass_type_identifier text        not null,
    serial_number        text        not null,

    -- SOLO l'invariante del pass (barcode message, relevantDate, override
    -- manuali): il contenuto variabile si rilegge da public.personaggi al
    -- momento della GET, altrimenti il bump del tag servirebbe un .pkpass
    -- identico al precedente.
    payload_json         jsonb       not null default '{}'::jsonb,

    -- voided finisce in pass.json: è l'unico modo Apple-compatibile di
    -- "annullare" un pass già distribuito
    voided               boolean     not null default false,
    expiration_date      timestamptz,

    -- update_tag = lastUpdated opaco di GET /v1/devices/.../registrations/{type};
    -- updated_at = Last-Modified / If-Modified-Since di GET /v1/passes/... (data HTTP vera).
    -- Servono entrambi.
    update_tag           bigint      not null default nextval('wallet.pass_update_seq'),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now(),

    unique (pass_type_identifier, serial_number),
    -- finisce in un path URL: charset unreserved e lunghezza limitata
    constraint passes_serial_urlsafe check (serial_number ~ '^[A-Za-z0-9._~-]{6,64}$')
);

create index if not exists passes_personaggio_idx on wallet.passes (personaggio_id);

comment on column wallet.passes.payload_json is
    'solo invariante/override del pass: il contenuto del personaggio si rilegge a runtime';

-- ---------------------------------------------------------------------------
-- wallet.registrations — device ↔ pass (+ push token e diagnostica APNs)
-- ---------------------------------------------------------------------------
-- Il push token è per (device, passTypeIdentifier) — il topic APNs è il pass
-- type — quindi qui è denormalizzato: la registrazione fa upsert sulla PK
-- aggiornando push_token e updated_at su TUTTE le righe dello stesso
-- (device, type) quando il token ruota.

create table if not exists wallet.registrations (
    device_library_identifier text        not null,
    pass_type_identifier      text        not null,
    serial_number             text        not null,
    push_token                text        not null,
    created_at                timestamptz not null default now(),
    updated_at                timestamptz not null default now(),

    -- diagnostica APNs: senza queste colonne un token morto è invisibile
    last_push_at              timestamptz,
    last_push_status          smallint,
    last_push_reason          text,
    -- a QUALE versione del pass si riferisce l'ultimo push consegnato: senza,
    -- dopo un touch non si distingue un device avvisato da uno rimasto indietro
    last_push_tag             bigint,

    -- la PK dà gratis il 201-vs-200 della registrazione:
    -- insert ... on conflict do nothing returning 1 → riga = 201, niente = 200
    primary key (device_library_identifier, pass_type_identifier, serial_number),
    foreign key (pass_type_identifier, serial_number)
        references wallet.passes (pass_type_identifier, serial_number)
        on delete cascade on update cascade
);

create index if not exists registrations_pass_idx
    on wallet.registrations (pass_type_identifier, serial_number);
-- per il 410 Unregistered / 400 BadDeviceToken: lì si cancella per token, non per PK
create index if not exists registrations_push_idx on wallet.registrations (push_token);

comment on column wallet.registrations.last_push_tag is
    'update_tag del pass all''ultimo push CONSEGNATO (200); null = mai consegnato';

-- ---------------------------------------------------------------------------
-- Trigger: il tag avanza da solo
-- ---------------------------------------------------------------------------
-- search_path = '' (advisor function_search_path_mutable): il corpo riferisce
-- solo oggetti già schema-qualificati.
--
-- Le quattro colonne sono quelle che cambiano ciò che il device vede:
-- personaggio_id inclusa, perché ripuntare un pass a un altro personaggio ne
-- cambia INTERAMENTE il contenuto (il .pkpass si rirenderizza da
-- public.personaggi a ogni GET). Senza, il tag resterebbe fermo e anche
-- l'If-Modified-Since risponderebbe 304: pass sbagliato per sempre.

create or replace function wallet.bump_update_tag() returns trigger
language plpgsql set search_path = '' as $$
begin
    if new.payload_json    is distinct from old.payload_json
    or new.voided          is distinct from old.voided
    or new.expiration_date is distinct from old.expiration_date
    or new.personaggio_id  is distinct from old.personaggio_id then
        new.update_tag := nextval('wallet.pass_update_seq');
        new.updated_at := now();
    end if;
    return new;
end $$;

drop trigger if exists passes_bump on wallet.passes;
create trigger passes_bump before update on wallet.passes
    for each row execute function wallet.bump_update_tag();

-- ---------------------------------------------------------------------------
-- wallet.push_pending — i device che devono ancora ricevere l'ultima versione
-- ---------------------------------------------------------------------------
-- I push sono manuali (POST /admin/passes/{serial}/push) e senza coda: questa
-- vista è quello che resta della domanda "chi manca?". last_push_tag viene
-- scritto SOLO sul 200, quindi un 5xx lascia il device qui dentro.
--
-- security_invoker: la vista non dà a nessuno più di quello che ha già sulle
-- tabelle sotto (ed è quello che si aspetta l'advisor Supabase).

create or replace view wallet.push_pending
    with (security_invoker = true) as
select r.pass_type_identifier,
       r.serial_number,
       r.device_library_identifier,
       p.update_tag,
       r.last_push_tag,
       r.last_push_at,
       r.last_push_status,
       r.last_push_reason
  from wallet.registrations r
  join wallet.passes p using (pass_type_identifier, serial_number)
 where r.last_push_tag is null or r.last_push_tag < p.update_tag;

-- ---------------------------------------------------------------------------
-- Aggiornamento da uno schema precedente (no-op su un database nuovo)
-- ---------------------------------------------------------------------------
-- 1. La outbox e il suo trigger: servivano al fan-out automatico drenato dal
--    Cron Trigger del Worker. Ora il push lo lancia una persona e ne legge
--    l'esito device per device, quindi coda, backoff e cron sono infrastruttura
--    per un problema che non si ha.
drop trigger if exists passes_enqueue_push on wallet.passes;
drop function if exists wallet.passes_enqueue_push();
drop table if exists wallet.push_outbox;

-- 2. La colonna aggiunta dopo il primo deploy (nel create table qui sopra è già
--    presente, ma su una tabella esistente il create è un no-op).
alter table wallet.registrations add column if not exists last_push_tag bigint;

-- ---------------------------------------------------------------------------
-- Permessi
-- ---------------------------------------------------------------------------
-- I ruoli del Data API non devono nemmeno vedere lo schema. Il revoke su
-- `usage` da solo basterebbe, ma è l'unica cosa che li ferma: basta un `grant
-- usage on schema wallet` di troppo, o `wallet` aggiunto per sbaglio agli
-- Exposed schemas, perché i push token diventino leggibili con la anon key.
revoke all on schema wallet from anon, authenticated;
revoke all on all tables in schema wallet from anon, authenticated;
revoke all on all sequences in schema wallet from anon, authenticated;
alter default privileges in schema wallet revoke all on tables from anon, authenticated;
alter default privileges in schema wallet revoke all on sequences from anon, authenticated;

-- Il web service si connette come wallet_service, ruolo Postgres dedicato
-- creato UNA VOLTA a mano PRIMA di questo script (non qui dentro: contiene la
-- password, e un ruolo è un oggetto di cluster, non di schema):
--   create role wallet_service login password '<password nel password manager>';
grant usage on schema wallet to wallet_service;
-- `all tables` copre anche le viste, quindi wallet.push_pending è inclusa
grant select, insert, update, delete on all tables in schema wallet to wallet_service;
-- serve davvero: touchPass chiama nextval('wallet.pass_update_seq') direttamente
grant usage, select on all sequences in schema wallet to wallet_service;
alter default privileges in schema wallet
    grant select, insert, update, delete on tables to wallet_service;
-- anche sulle sequenze: una tabella futura con `bigserial` (non `identity`)
-- avrebbe bisogno della usage sulla sequenza implicita
alter default privileges in schema wallet
    grant usage, select on sequences to wallet_service;

-- il render del pass legge scheda + catalogo + talenti scelti (src/db/personaggi.ts);
-- i grant del catalogo ad anon/authenticated NON coprono wallet_service.
-- Se il render acquisisce nuove tabelle, va aggiunto il grant: il sintomo della
-- dimenticanza è un 500 "permission denied" sulla GET del pass.
grant usage on schema public to wallet_service;
grant select on public.personaggi, public.personaggio_talenti,
                public.razze, public.tribu, public.vie, public.sottovie,
                public.talenti
  to wallet_service;
