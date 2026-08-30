-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

GRANT USAGE ON SCHEMA public TO wallet_service;

GRANT SELECT ON public.personaggi TO wallet_service;

GRANT SELECT ON public.personaggio_talenti TO wallet_service;

GRANT SELECT ON public.razze TO wallet_service;

GRANT SELECT ON public.sottovie TO wallet_service;

GRANT SELECT ON public.talenti TO wallet_service;

GRANT SELECT ON public.tribu TO wallet_service;

GRANT SELECT ON public.vie TO wallet_service;

CREATE SCHEMA wallet AUTHORIZATION postgres;

GRANT USAGE ON SCHEMA wallet TO wallet_service;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA wallet GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO wallet_service;

CREATE SEQUENCE wallet.pass_update_seq;

GRANT SELECT, USAGE ON SEQUENCE wallet.pass_update_seq TO wallet_service;

CREATE FUNCTION wallet.bump_update_tag()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
    if new.payload_json    is distinct from old.payload_json
    or new.voided          is distinct from old.voided
    or new.expiration_date is distinct from old.expiration_date then
        new.update_tag := nextval('wallet.pass_update_seq');
        new.updated_at := now();
    end if;
    return new;
end $function$;

CREATE FUNCTION wallet.passes_enqueue_push()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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
end $function$;

CREATE TABLE wallet.passes (
  id                   bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  personaggio_id       uuid                     NOT NULL,
  pass_type_identifier text                     NOT NULL,
  serial_number        text                     NOT NULL,
  payload_json         jsonb                    DEFAULT '{}'::jsonb NOT NULL,
  voided               boolean                  DEFAULT false NOT NULL,
  expiration_date      timestamp with time zone,
  update_tag           bigint                   DEFAULT nextval('wallet.pass_update_seq'::regclass) NOT NULL,
  created_at           timestamp with time zone DEFAULT now() NOT NULL,
  updated_at           timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON COLUMN wallet.passes.payload_json IS 'solo invariante/override del pass: il contenuto del personaggio si rilegge a runtime';

ALTER TABLE wallet.passes
  ADD CONSTRAINT passes_pass_type_identifier_serial_number_key UNIQUE (pass_type_identifier, serial_number);

ALTER TABLE wallet.passes
  ADD CONSTRAINT passes_personaggio_id_fkey FOREIGN KEY (personaggio_id) REFERENCES public.personaggi(id) ON DELETE RESTRICT;

ALTER TABLE wallet.passes
  ADD CONSTRAINT passes_pkey PRIMARY KEY (id);

ALTER TABLE wallet.passes
  ADD CONSTRAINT passes_serial_urlsafe CHECK (serial_number ~ '^[A-Za-z0-9._~-]{6,64}$'::text);

GRANT DELETE, INSERT, SELECT, UPDATE ON wallet.passes TO wallet_service;

CREATE INDEX passes_personaggio_idx ON wallet.passes (personaggio_id);

CREATE TRIGGER passes_bump
  BEFORE UPDATE ON wallet.passes
  FOR EACH ROW
  EXECUTE FUNCTION wallet.bump_update_tag();

CREATE TRIGGER passes_enqueue_push
  AFTER UPDATE ON wallet.passes
  FOR EACH ROW
  EXECUTE FUNCTION wallet.passes_enqueue_push();

CREATE TABLE wallet.push_outbox (
  id                        bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  device_library_identifier text                     NOT NULL,
  pass_type_identifier      text                     NOT NULL,
  serial_number             text                     NOT NULL,
  push_token                text                     NOT NULL,
  created_at                timestamp with time zone DEFAULT now() NOT NULL,
  scheduled_at              timestamp with time zone DEFAULT now() NOT NULL,
  attempts                  smallint                 DEFAULT 0 NOT NULL,
  delivered_at              timestamp with time zone,
  last_status               smallint,
  last_error                text
);

ALTER TABLE wallet.push_outbox
  ADD CONSTRAINT push_outbox_pkey PRIMARY KEY (id);

GRANT DELETE, INSERT, SELECT, UPDATE ON wallet.push_outbox TO wallet_service;

CREATE INDEX push_outbox_due_idx ON wallet.push_outbox (scheduled_at)
  WHERE delivered_at IS NULL;

CREATE UNIQUE INDEX push_outbox_pending_uniq ON wallet.push_outbox (device_library_identifier, pass_type_identifier, serial_number)
  WHERE delivered_at IS NULL;

CREATE TABLE wallet.registrations (
  device_library_identifier text                     NOT NULL,
  pass_type_identifier      text                     NOT NULL,
  serial_number             text                     NOT NULL,
  push_token                text                     NOT NULL,
  created_at                timestamp with time zone DEFAULT now() NOT NULL,
  updated_at                timestamp with time zone DEFAULT now() NOT NULL,
  last_push_at              timestamp with time zone,
  last_push_status          smallint,
  last_push_reason          text
);

ALTER TABLE wallet.registrations
  ADD CONSTRAINT registrations_pass_type_identifier_serial_number_fkey FOREIGN KEY (pass_type_identifier, serial_number)
    REFERENCES wallet.passes(pass_type_identifier, serial_number) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE wallet.registrations
  ADD CONSTRAINT registrations_pkey PRIMARY KEY (device_library_identifier, pass_type_identifier, serial_number);

GRANT DELETE, INSERT, SELECT, UPDATE ON wallet.registrations TO wallet_service;

CREATE INDEX registrations_pass_idx ON wallet.registrations (pass_type_identifier, serial_number);

CREATE INDEX registrations_push_idx ON wallet.registrations (push_token);