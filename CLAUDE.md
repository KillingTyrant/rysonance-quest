# CLAUDE.md

## Regola: il database vive in `rysonance-db`, non qui

Lo schema Postgres, le migrazioni, i seed del catalogo e i tipi generati stanno nel repo
**`rysonance-db`** (in locale `../rysonance-db`, accanto a questo). È l'unica fonte di verità
del database. Questo repo contiene **solo l'app Next.js** e non ha una cartella `supabase/`.

### Obbligatorio

1. **Nessun file di schema in questo repo.** Niente `supabase/schemas/`, `supabase/migrations/`,
   `supabase/seeds/`, niente `npx supabase migration new`, niente `db diff`. Se un'attività
   richiede una modifica al DB (colonna, tabella, RPC, policy, seed del catalogo), si fa in
   `rysonance-db` seguendo il suo `CLAUDE.md`, e qui si adegua solo il codice.
2. **Non modificare lo schema sul database**, né sul locale (Studio, `psql`, `execute_sql`,
   MCP `apply_migration`) né sul cloud. Ogni cambio fatto solo sul DB va perso al primo
   `db reset` e non finisce mai nei file dichiarativi di `rysonance-db`.
3. **I tipi si generano in `rysonance-db` e si copiano qui.** `lib/supabase/database.types.ts`
   è una copia di `rysonance-db/types/database.types.ts` (pacchetto `@rysonance/db-types`).
   Dopo ogni cambio di schema:
   ```bash
   (cd ../rysonance-db && npm run db:types)
   cp ../rysonance-db/types/database.types.ts lib/supabase/database.types.ts
   npx tsc --noEmit
   ```
   Non editare a mano il file dei tipi. Lo importano `lib/supabase/{client,server}.ts`,
   `lib/onboarding/catalog.ts` e `lib/onboarding/types.ts`: il resto dell'app usa i tipi
   di dominio di `lib/onboarding/types.ts`, non `Database` direttamente.
4. **Le scritture su `personaggi` e `personaggio_talenti` passano solo dalla RPC
   `crea_personaggio`.** Le tabelle non hanno policy di insert/update/delete per
   `authenticated`: un `insert` diretto fallisce con permission denied.
5. **Il catalogo di gioco è congelato a build time** (`getCatalog` in
   `lib/onboarding/catalog.ts`, `"use cache"` + `cacheLife("max")`). Un cambio di catalogo o
   di schema in cloud richiede un deploy dell'app subito dopo il `db push` di `rysonance-db`:
   fra i due la creazione del personaggio fallisce con `PGRST202`/`PGRST204`.

### Sviluppo locale: l'app punta allo stack Supabase locale

In sviluppo l'app usa lo **stack Supabase locale in Docker avviato da `rysonance-db`**, mai
il progetto cloud. Il ciclo di lavoro è:

```bash
(cd ../rysonance-db && npm run db:start)   # stack locale: API 127.0.0.1:54321, Studio :54323
npm run dev                                # l'app legge .env.development.local e punta al locale
```

Regole per l'ambiente locale:

- **`.env.development.local` punta al locale** e in Next.js vince su `.env.local` quando
  `NODE_ENV=development`. Valori: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = publishable key stampata da
  `npm run db:status` in `rysonance-db`. Sono credenziali demo fisse, non segreti.
- **Anche `.env.local` punta al locale**, con gli stessi valori: così anche `next build`
  e `next start` in locale (dove `.env.development.local` non si carica) leggono lo stack
  Docker e non il cloud. Nessun file `.env*` letto automaticamente da Next.js deve puntare
  al progetto cloud.
- **Le credenziali del progetto cloud stanno solo in `.env.prod.local`**, che Next.js non
  carica da solo (il nome non è fra quelli standard): serve come riferimento e per
  interrogare il cloud a mano, non per far girare l'app. In produzione le variabili
  arrivano dall'ambiente del deploy. Non va copiato in `.env.local` per lavorare.
- **Lo stack locale si avvia e si resetta da `rysonance-db`** (`npm run db:start`,
  `db:stop`, `db:reset`, `db:status`): questo repo non ha script `db:*` e non deve averli.
  Se il DB locale sembra fuori allineamento con il codice, è `rysonance-db` a doverlo
  resettare (`npm run db:reset` riapplica migrazioni e seed da zero), non l'app ad adattarsi.
- **Studio locale (`:54323`) serve a ispezionare, non a modificare.** Vale la regola 2.
- **Le email di auth in locale non escono**: si leggono su Mailpit, http://127.0.0.1:54324.
- Le credenziali OAuth Google per lo stack locale vanno nel `.env` di `rysonance-db`
  (lette dal suo `supabase/config.toml`), non in questo repo.

### Prima di toccare qualcosa che dipende dal DB

- Carica la skill `supabase` quando lavori sui client Supabase, sull'auth o sulle query.
- Verifica che lo stack locale sia acceso e allineato (`npm run db:status` in
  `rysonance-db`) prima di attribuire un errore `PGRST205`/`42703`/`PGRST202` al codice: di
  solito significa che i tipi o le query dell'app sono indietro rispetto allo schema.
- Dopo aver aggiornato `database.types.ts`, `npx tsc --noEmit` e `npx eslint lib app components`
  devono essere puliti; gli errori riportati da `eslint .` sotto `.next/` sono artefatti di
  build, non sorgenti.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
