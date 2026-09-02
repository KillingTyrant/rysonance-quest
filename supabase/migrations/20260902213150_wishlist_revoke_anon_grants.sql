-- Migrazione scritta a mano: `supabase db diff` non genera i REVOKE dei
-- privilegi che arrivano dai default privileges di Supabase (eccezione
-- documentata in CLAUDE.md). Le due righe stanno comunque in
-- supabase/schemas/40_wishlist.sql, che resta la fonte di verità.
--
-- Perché servono: Supabase concede per default i privilegi su ogni tabella di
-- `public` ad anon e authenticated. RLS senza policy per quei ruoli già blocca
-- tutto, ma questa è la seconda serratura: una policy troppo larga aggiunta per
-- sbaglio non basterebbe ad aprire la lista di indirizzi alla chiave che sta
-- nel browser di chiunque apra il sito.

revoke all on public.wishlist_subscribers from anon, authenticated;
revoke all on public.wishlist_events      from anon, authenticated;
