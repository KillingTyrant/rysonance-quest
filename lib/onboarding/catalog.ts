/* Server Component async */
import "server-only";

import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { Catalog } from "./types";

/**
 * Client "anonimo" senza cookie: il catalogo è pubblico in lettura (RLS
 * `for select to anon`) e non deve dipendere dalla request, altrimenti non
 * sarebbe prerenderizzabile.
 */
function catalogClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Legge il catalogo di gioco: razze, vie e talenti in elenchi piatti. La
 * tabella `tribu` non si legge: nell'app la tribù non si sceglie più.
 *
 * `"use cache"` + `cacheLife("max")`: viene risolto a build time e congelato
 * nelle pagine, quindi a runtime non parte nessuna query. La chiave di cache
 * include il build id, perciò ogni deploy rilegge il catalogo — il contenuto
 * cambia solo con un `db push --include-seed` seguito da un deploy.
 *
 * Tre query piatte in parallelo. Il numero di round-trip è comunque
 * irrilevante, gira a build time.
 *
 * Le colonne sono elencate una per una: quello che finisce qui dentro viene
 * serializzato nel payload del client.
 */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("max");

  const supabase = catalogClient();

  const [talenti, razze, vie] = await Promise.all([
    read(
      "talenti",
      supabase
        .from("talenti")
        .select("key, name, description")
        .order("sort_order"),
    ),
    read(
      "razze",
      supabase
        .from("razze")
        .select("key, name, description, sort_order")
        .order("sort_order"),
    ),
    read(
      "vie",
      supabase
        .from("vie")
        .select("key, name, description, sort_order")
        .order("sort_order"),
    ),
  ]);

  return {
    // Le vie non dicono più quanti talenti si scelgono: quel numero è una
    // regola di prodotto del client (`TALENTI_DA_SCEGLIERE`, in
    // `lib/onboarding/validate.ts`), non una colonna del catalogo.
    vie,
    razze,
    // Tutti i talenti sono a scelta. Nell'ordine di `sort_order`: è l'ordine
    // in cui lo step li mostra.
    talentiScelta: talenti,
  };
}

/**
 * Un catalogo incompleto renderebbe un wizard rotto e, girando a build time,
 * un deploy silenziosamente sbagliato: meglio far fallire la build.
 */
async function read<T>(
  table: string,
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(`Catalogo: lettura di "${table}" fallita: ${error.message}`);
  return data ?? [];
}
