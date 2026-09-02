-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

ALTER TABLE public.wishlist_subscribers
  ADD COLUMN referrer text;

ALTER TABLE public.wishlist_subscribers
  ADD COLUMN utm_source text;

ALTER TABLE public.wishlist_subscribers
  ADD COLUMN utm_medium text;

ALTER TABLE public.wishlist_subscribers
  ADD COLUMN utm_campaign text;

ALTER TABLE public.wishlist_subscribers
  ADD COLUMN locale text;