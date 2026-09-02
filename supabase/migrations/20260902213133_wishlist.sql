-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

GRANT USAGE ON SCHEMA public TO wishlist_service;

CREATE TABLE public.wishlist_events (
  id            bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  subscriber_id uuid                     NOT NULL,
  type          text                     NOT NULL,
  detail        jsonb,
  created_at    timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.wishlist_events
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.wishlist_events
  ADD CONSTRAINT wishlist_events_pkey PRIMARY KEY (id);

ALTER TABLE public.wishlist_events
  ADD CONSTRAINT wishlist_events_type_check CHECK (type = ANY (ARRAY['signup'::text, 'resubscribe'::text, 'welcome_sent'::text, 'welcome_failed'::text, 'unsubscribe'::text]));

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.wishlist_events TO service_role;

GRANT INSERT, SELECT ON public.wishlist_events TO wishlist_service;

CREATE INDEX wishlist_events_subscriber_idx ON public.wishlist_events (subscriber_id, created_at DESC);

CREATE POLICY wishlist_events_insert_service ON public.wishlist_events
  FOR INSERT
  TO wishlist_service
  WITH CHECK (true);

CREATE POLICY wishlist_events_read_service ON public.wishlist_events
  FOR SELECT
  TO wishlist_service
  USING (true);

CREATE TABLE public.wishlist_subscribers (
  id                 uuid                     DEFAULT gen_random_uuid() NOT NULL,
  email              text                     NOT NULL,
  status             text                     DEFAULT 'subscribed'::text NOT NULL,
  unsubscribe_token  uuid                     DEFAULT gen_random_uuid() NOT NULL,
  source             text                     DEFAULT 'landing'::text NOT NULL,
  consent_at         timestamp with time zone DEFAULT now() NOT NULL,
  consent_ip         inet,
  consent_user_agent text,
  welcome_status     text                     DEFAULT 'pending'::text NOT NULL,
  welcome_sent_at    timestamp with time zone,
  welcome_error      text,
  unsubscribed_at    timestamp with time zone,
  created_at         timestamp with time zone DEFAULT now() NOT NULL,
  updated_at         timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.wishlist_subscribers
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.wishlist_subscribers
  ADD CONSTRAINT wishlist_subscribers_check CHECK ((status = 'unsubscribed'::text) = (unsubscribed_at IS NOT NULL));

ALTER TABLE public.wishlist_subscribers
  ADD CONSTRAINT wishlist_subscribers_check1 CHECK ((welcome_status = 'sent'::text) = (welcome_sent_at IS NOT NULL));

ALTER TABLE public.wishlist_subscribers
  ADD CONSTRAINT wishlist_subscribers_email_key UNIQUE (email);

ALTER TABLE public.wishlist_subscribers
  ADD CONSTRAINT wishlist_subscribers_pkey PRIMARY KEY (id);

ALTER TABLE public.wishlist_events
  ADD CONSTRAINT wishlist_events_subscriber_id_fkey FOREIGN KEY (subscriber_id) REFERENCES public.wishlist_subscribers(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist_subscribers
  ADD CONSTRAINT wishlist_subscribers_status_check CHECK (status = ANY (ARRAY['subscribed'::text, 'unsubscribed'::text]));

ALTER TABLE public.wishlist_subscribers
  ADD CONSTRAINT wishlist_subscribers_unsubscribe_token_key UNIQUE (unsubscribe_token);

ALTER TABLE public.wishlist_subscribers
  ADD CONSTRAINT wishlist_subscribers_welcome_status_check CHECK (welcome_status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text]));

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.wishlist_subscribers TO service_role;

GRANT INSERT, SELECT, UPDATE ON public.wishlist_subscribers TO wishlist_service;

CREATE TRIGGER wishlist_subscribers_touch_updated_at
  BEFORE UPDATE ON public.wishlist_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY wishlist_subscribers_insert_service ON public.wishlist_subscribers
  FOR INSERT
  TO wishlist_service
  WITH CHECK (true);

CREATE POLICY wishlist_subscribers_read_service ON public.wishlist_subscribers
  FOR SELECT
  TO wishlist_service
  USING (true);

CREATE POLICY wishlist_subscribers_update_service ON public.wishlist_subscribers
  FOR UPDATE
  TO wishlist_service
  USING (true)
  WITH CHECK (true);