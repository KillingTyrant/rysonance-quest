/* Server Component async */
import "server-only";

import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { Catalog, Talento, Tribu, Via } from "./types";

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
 * Legge il catalogo di gioco e lo ricompone secondo le relazioni del DB:
 * razza → tribù, e le vie, ciascuna con il proprio talento.
 *
 * `"use cache"` + `cacheLife("max")`: viene risolto a build time e congelato
 * nelle pagine, quindi a runtime non parte nessuna query. La chiave di cache
 * include il build id, perciò ogni deploy rilegge il catalogo — il contenuto
 * cambia solo con un `db push --include-seed` seguito da un deploy.
 *
 * Quattro query piatte e una ricomposizione in memoria, invece di un embed
 * PostgREST sui talenti: i talenti si leggono una volta sola e si agganciano
 * per chiave. Il numero di round-trip è comunque irrilevante, gira a build time.
 *
 * Le colonne sono elencate una per una: quello che finisce qui dentro viene
 * serializzato nel payload del client.
 */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("max");

  const supabase = catalogClient();

  const [talenti, razze, tribu, vie] = await Promise.all([
    read(
      "talenti",
      supabase
        .from("talenti")
        .select("key, name, description, kind, scuola, disciplina, ramo")
        .order("sort_order"),
    ),
    read(
      "razze",
      supabase
        .from("razze")
        .select("key, name, description, sort_order, talent_key")
        .order("sort_order"),
    ),
    read(
      "tribu",
      supabase
        .from("tribu")
        .select("key, razza_key, name, description, base_hp, base_mana, base_speed, sort_order, talent_key")
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

  const talentoByKey = new Map<string, Talento>();
  for (const talento of talenti) {
    talentoByKey.set(talento.key, talento);
  }

  const talentoOf = (key: string | null) => (key ? talentoByKey.get(key) ?? null : null);

  // Una passata per raggruppare, invece di rifiltrare l'array dentro ogni map.
  const tribuByRazza = groupBy(
    tribu.map(({ talent_key, ...row }): Tribu => ({
      ...row,
      talento: talentoOf(talent_key),
    })),
    (t) => t.razza_key,
  );

  return {
    // `talent_key` apre la via; `talenti_scelta` dice quanti talenti a scelta
    // dà (il Viandante tre, le altre due) ed è la stessa regola che
    // `crea_personaggio` applica al salvataggio.
    vie: vie.map(({ talent_key, ...row }): Via => ({
      ...row,
      talento: talentoOf(talent_key),
    })),
    razze: razze.map(({ talent_key, ...row }) => ({
      ...row,
      talento: talentoOf(talent_key),
      tribu: tribuByRazza.get(row.key) ?? [],
    })),
    // Nell'ordine di `sort_order`, che raggruppa per scuola e disciplina: è
    // l'ordine in cui lo step li mostra.
    talentiScelta: [...talentoByKey.values()].filter((t) => t.kind === "scelta"),
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

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const group = groups.get(key(row));
    if (group) group.push(row);
    else groups.set(key(row), [row]);
  }
  return groups;
}
