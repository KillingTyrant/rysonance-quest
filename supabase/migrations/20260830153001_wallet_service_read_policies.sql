-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

CREATE POLICY personaggi_read_service ON public.personaggi
  FOR SELECT
  TO wallet_service
  USING (true);

CREATE POLICY personaggio_talenti_read_service ON public.personaggio_talenti
  FOR SELECT
  TO wallet_service
  USING (true);

CREATE POLICY razze_read_service ON public.razze
  FOR SELECT
  TO wallet_service
  USING (true);

CREATE POLICY sottovie_read_service ON public.sottovie
  FOR SELECT
  TO wallet_service
  USING (true);

CREATE POLICY talenti_read_service ON public.talenti
  FOR SELECT
  TO wallet_service
  USING (true);

CREATE POLICY tribu_read_service ON public.tribu
  FOR SELECT
  TO wallet_service
  USING (true);

CREATE POLICY vie_read_service ON public.vie
  FOR SELECT
  TO wallet_service
  USING (true);