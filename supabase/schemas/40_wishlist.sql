-- Wishlist di Rysonance: iscritti alla lista d'attesa della landing.

create table wishlist_subscribers (
  id uuid primary key default gen_random_uuid(),

  -- Normalizzato in minuscolo dall'applicazione (normalizeEmail in
  -- app/wishlist/email.ts) prima di arrivare qui: l'unicità è su text, quindi
  -- 'Mario@x.it' e 'mario@x.it' passerebbero come due righe distinte.
  email text not null unique,

  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),

  -- Il token nel link di disiscrizione. Non è l'id: se un link trapela, si
  -- revoca rigenerando il token invece di toccare l'iscritto.
  unsubscribe_token uuid not null unique default gen_random_uuid(),

  -- Prova del consenso (GDPR art. 7.1): da dove, quando, chi.
  source text not null default 'landing',
  consent_at timestamptz not null default now(),
  consent_ip inet,
  consent_user_agent text,

  -- Da dove è arrivato l'iscritto. `referrer` è il sito che l'ha mandato,
  -- letto al render della pagina: dentro la Server Action l'header `referer`
  -- punterebbe sempre a /wishlist, perché il POST parte da lì. Gli utm_* sono
  -- il post o la campagna. Entrambi arrivano da campi hidden del form, quindi
  -- sono falsificabili: valgono come attribuzione, non come prova.
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,

  -- Tag della lingua preferita (es. 'it-IT'), dal primo valore di
  -- accept-language: dice in che lingua scrivere a chi non è italiano.
  locale text,

  -- Stato della mail di benvenuto, separato dall'iscrizione: se il webhook
  -- n8n fallisce l'indirizzo resta in lista e qui si vede cosa riprovare.
  welcome_status text not null default 'pending'
    check (welcome_status in ('pending', 'sent', 'failed')),
  welcome_sent_at timestamptz,
  welcome_error text,

  unsubscribed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Uno stato senza la sua data non è verificabile: chi disiscrive (n8n)
  -- scrive status e unsubscribed_at nello stesso UPDATE.
  check ((status = 'unsubscribed') = (unsubscribed_at is not null)),
  check ((welcome_status = 'sent') = (welcome_sent_at is not null))
);

-- Richiede public.touch_updated_at(), definita in schemas/01_functions.sql: il
-- prefisso numerico di questo file lo fa eseguire dopo, quindi la funzione c'è.
create trigger wishlist_subscribers_touch_updated_at
  before update on wishlist_subscribers
  for each row execute function public.touch_updated_at();

-- La riga sopra dice solo com'è adesso: un'iscrizione, una cancellazione e un
-- rientro si sovrascrivono. Qui resta cosa è successo e quando.
create table wishlist_events (
  id bigint generated always as identity primary key,

  -- Cancellare un iscritto (richiesta GDPR) porta via anche la sua storia.
  subscriber_id uuid not null
    references wishlist_subscribers(id) on delete cascade,

  type text not null check (type in (
    'signup',         -- prima iscrizione
    'resubscribe',    -- rientro dopo una cancellazione
    'welcome_sent',   -- n8n ha accettato la richiesta di invio
    'welcome_failed', -- il webhook ha rifiutato o non ha risposto
    'unsubscribe'     -- disiscrizione (la scrive n8n)
  )),

  -- Il contorno: status HTTP di n8n, errore, sorgente. Varia per tipo, quindi
  -- jsonb invece di una colonna per ogni caso.
  detail jsonb,

  created_at timestamptz not null default now()
);

create index if not exists wishlist_events_subscriber_idx
  on wishlist_events (subscriber_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Accesso
-- ---------------------------------------------------------------------------

-- Chi scrive qui non è un utente loggato: è la Server Action della landing e
-- n8n. Invece della service_role key — che apre l'intero database, e starebbe
-- nella config di n8n — un ruolo dedicato con i soli privilegi che servono,
-- come già fa wallet_service (vedi supabase/roles.sql per il ruolo).
--
-- Il ruolo va anche concesso all'authenticator, altrimenti PostgREST non può
-- assumerlo e ogni richiesta muore con «permission denied to set role»:
--
--   grant wishlist_service to authenticator;

grant usage on schema public to wishlist_service;

-- Niente DELETE: la cancellazione per richiesta GDPR è un'operazione manuale
-- e irreversibile, non qualcosa che un webhook deve poter fare da solo.
-- Nessun grant sulle sequenze: wishlist_events.id è `generated always as
-- identity`, e per le identity basta il privilegio insert sulla tabella.
grant select, insert, update on wishlist_subscribers to wishlist_service;

-- Il log è append-only: si aggiunge cosa è successo, non si riscrive.
grant select, insert on wishlist_events to wishlist_service;

-- RLS attiva su entrambe: con la anon key queste tabelle non esistono. Senza,
-- la lista di indirizzi la legge chiunque apra il sito — la publishable key
-- sta nel browser.
alter table wishlist_subscribers enable row level security;
alter table wishlist_events      enable row level security;

-- wishlist_service NON ha bypassrls: senza queste policy i grant qui sopra non
-- servirebbero a niente. `using (true)`: non c'è un owner per riga da
-- verificare, la riga è dell'iscritto e il ruolo le vede tutte per mestiere.
create policy wishlist_subscribers_read_service on wishlist_subscribers
  for select to wishlist_service using (true);

create policy wishlist_subscribers_insert_service on wishlist_subscribers
  for insert to wishlist_service with check (true);

create policy wishlist_subscribers_update_service on wishlist_subscribers
  for update to wishlist_service using (true) with check (true);

create policy wishlist_events_read_service on wishlist_events
  for select to wishlist_service using (true);

create policy wishlist_events_insert_service on wishlist_events
  for insert to wishlist_service with check (true);

-- Supabase concede per default i privilegi su ogni tabella di `public` ad anon
-- e authenticated. Toglierli è la seconda serratura: se un domani qualcuno
-- aggiunge una policy troppo larga per sbaglio, non basta ad aprire.
revoke all on wishlist_subscribers from anon, authenticated;
revoke all on wishlist_events      from anon, authenticated;
