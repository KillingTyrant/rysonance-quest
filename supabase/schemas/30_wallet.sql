-- Schema del web service Apple Wallet su Supabase.
-- NON aggiungere `wallet` agli Exposed schemas (Settings → API): le tabelle
-- contengono push token APNs, non devono essere raggiungibili con la anon key.
--
-- Fuori scope di questa migration (arriva dopo, vedi docs/push-and-persistence.md):
-- il trigger su public.personaggi che marca i pass "da aggiornare" quando cambia
-- la scheda (va scritto elencando le sole colonne che finiscono nel pass, più i
-- trigger sulla tabella dei talenti).

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

create table wallet.passes (
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

create index passes_personaggio_idx on wallet.passes (personaggio_id);

comment on column wallet.passes.payload_json is
    'solo invariante/override del pass: il contenuto del personaggio si rilegge a runtime';

-- ---------------------------------------------------------------------------
-- wallet.registrations — device ↔ pass (+ push token e diagnostica APNs)
-- ---------------------------------------------------------------------------
-- Il push token è per (device, passTypeIdentifier) — il topic APNs è il pass
-- type — quindi qui è denormalizzato: la registrazione fa upsert sulla PK
-- aggiornando push_token e updated_at su TUTTE le righe dello stesso
-- (device, type) quando il token ruota.

create table wallet.registrations (
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

    -- la PK dà gratis il 201-vs-200 della registrazione:
    -- insert ... on conflict do nothing returning 1 → riga = 201, niente = 200
    primary key (device_library_identifier, pass_type_identifier, serial_number),
    foreign key (pass_type_identifier, serial_number)
        references wallet.passes (pass_type_identifier, serial_number)
        on delete cascade on update cascade
);

create index registrations_pass_idx on wallet.registrations (pass_type_identifier, serial_number);
-- per il 410 Unregistered / 400 BadDeviceToken: lì si cancella per token, non per PK
create index registrations_push_idx on wallet.registrations (push_token);

-- ---------------------------------------------------------------------------
-- wallet.push_outbox — coda del fan-out APNs (coda + storico nella stessa tabella)
-- ---------------------------------------------------------------------------
-- push_token è uno snapshot: la registrazione può sparire fra enqueue e drain.
-- Il drain: select ... where delivered_at is null and scheduled_at <= now()
--           for update skip locked limit N
-- Righe consegnate: potare dal cron dopo ~30 giorni.

create table wallet.push_outbox (
    id                        bigint generated always as identity primary key,
    device_library_identifier text        not null,
    pass_type_identifier      text        not null,
    serial_number             text        not null,
    push_token                text        not null,
    created_at                timestamptz not null default now(),
    scheduled_at              timestamptz not null default now(),  -- backoff dei retry
    attempts                  smallint    not null default 0,
    delivered_at              timestamptz,
    last_status               smallint,
    last_error                text
);

-- una sola notifica pendente per (device, pass): APNs coalescia comunque
create unique index push_outbox_pending_uniq on wallet.push_outbox
    (device_library_identifier, pass_type_identifier, serial_number)
    where delivered_at is null;

create index push_outbox_due_idx on wallet.push_outbox (scheduled_at)
    where delivered_at is null;

-- ---------------------------------------------------------------------------
-- Trigger interni allo schema (nessun code path può dimenticarsene)
-- ---------------------------------------------------------------------------
--
-- Entrambe con search_path = '' (advisor function_search_path_mutable): i corpi
-- riferiscono solo oggetti già schema-qualificati.

-- il tag avanza da solo quando cambia qualcosa che il device deve rivedere
create or replace function wallet.bump_update_tag() returns trigger
language plpgsql set search_path = '' as $$
begin
    if new.payload_json    is distinct from old.payload_json
    or new.voided          is distinct from old.voided
    or new.expiration_date is distinct from old.expiration_date then
        new.update_tag := nextval('wallet.pass_update_seq');
        new.updated_at := now();
    end if;
    return new;
end $$;

create trigger passes_bump before update on wallet.passes
    for each row execute function wallet.bump_update_tag();

-- ogni avanzamento del tag accoda un push per ogni device registrato
-- (passes_bump è BEFORE, quindi qui new.update_tag è già quello nuovo)
create or replace function wallet.passes_enqueue_push() returns trigger
language plpgsql set search_path = '' as $$
begin
    if new.update_tag is distinct from old.update_tag then
        insert into wallet.push_outbox
               (device_library_identifier, pass_type_identifier, serial_number, push_token)
        select r.device_library_identifier, r.pass_type_identifier, r.serial_number, r.push_token
          from wallet.registrations r
         where (r.pass_type_identifier, r.serial_number)
             = (new.pass_type_identifier, new.serial_number)
        on conflict do nothing;
    end if;
    return null;
end $$;

create trigger passes_enqueue_push after update on wallet.passes
    for each row execute function wallet.passes_enqueue_push();

-- ---------------------------------------------------------------------------
-- Permessi
-- ---------------------------------------------------------------------------
-- I ruoli del Data API non devono nemmeno vedere lo schema.
revoke all on schema wallet from anon, authenticated;

-- Il web service si connette come wallet_service, ruolo Postgres dedicato
-- creato UNA VOLTA a mano PRIMA di questa migration (non in migration: contiene
-- la password, e un ruolo è un oggetto di cluster, non di schema):
--   create role wallet_service login password '<password nel password manager>';
grant usage on schema wallet to wallet_service;
grant select, insert, update, delete on all tables in schema wallet to wallet_service;
-- serve davvero: touchPass chiama nextval('wallet.pass_update_seq') direttamente
grant usage, select on all sequences in schema wallet to wallet_service;
alter default privileges in schema wallet
    grant select, insert, update, delete on tables to wallet_service;

-- il render del pass legge scheda + catalogo + talenti scelti (src/db/personaggi.ts);
-- i grant del catalogo ad anon/authenticated NON coprono wallet_service.
-- Se il render acquisisce nuove tabelle, va aggiunto il grant: il sintomo della
-- dimenticanza è un 500 "permission denied" sulla GET del pass.
grant usage on schema public to wallet_service;
grant select on public.personaggi, public.personaggio_talenti,
                public.razze, public.tribu, public.vie, public.sottovie,
                public.talenti
  to wallet_service;
