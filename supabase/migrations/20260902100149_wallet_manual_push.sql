-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP TABLE wallet.push_outbox;

DROP TRIGGER passes_enqueue_push ON wallet.passes;

DROP FUNCTION wallet.passes_enqueue_push();

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA wallet GRANT SELECT, USAGE ON SEQUENCES TO wallet_service;

CREATE OR REPLACE FUNCTION wallet.bump_update_tag()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
    if new.payload_json    is distinct from old.payload_json
    or new.voided          is distinct from old.voided
    or new.expiration_date is distinct from old.expiration_date
    or new.personaggio_id  is distinct from old.personaggio_id then
        new.update_tag := nextval('wallet.pass_update_seq');
        new.updated_at := now();
    end if;
    return new;
end $function$;

ALTER TABLE wallet.registrations
  ADD COLUMN last_push_tag bigint;

COMMENT ON COLUMN wallet.registrations.last_push_tag IS 'update_tag del pass all''ultimo push CONSEGNATO (200); null = mai consegnato';

CREATE VIEW wallet.push_pending WITH (security_invoker=true) AS SELECT r.pass_type_identifier,
    r.serial_number,
    r.device_library_identifier,
    p.update_tag,
    r.last_push_tag,
    r.last_push_at,
    r.last_push_status,
    r.last_push_reason
   FROM (wallet.registrations r
     JOIN wallet.passes p USING (pass_type_identifier, serial_number))
  WHERE ((r.last_push_tag IS NULL) OR (r.last_push_tag < p.update_tag));

GRANT DELETE, INSERT, SELECT, UPDATE ON wallet.push_pending TO wallet_service;