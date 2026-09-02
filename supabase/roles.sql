-- Ruoli di cluster: NON sono oggetti di schema, quindi non vivono in schemas/ e
-- non finiscono nel diff dichiarativo. La CLI applica questo file allo shadow
-- database del `db diff` e al `db reset` locale ("Seeding globals from roles.sql").
--
-- Su cloud il ruolo si crea UNA VOLTA a mano con la password vera (password
-- manager); `supabase db push` non applica questo file. La password qui sotto è
-- una credenziale usa e getta del solo stack locale.
--
-- Idempotente: il ruolo può già esistere nel cluster locale (il `db reset` ricrea
-- il database, non i ruoli).

do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'wallet_service') then
        create role wallet_service login password 'wallet_service_local';
    end if;
end $$;

do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'wishlist_service') then
        create role wishlist_service login password 'wishlist_service_local';
    end if;
end $$;
