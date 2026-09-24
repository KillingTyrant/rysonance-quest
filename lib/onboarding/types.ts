import type { Database } from "@/lib/supabase/database.types";

/**
 * Riga di una tabella, dai tipi generati da Supabase. Definito qui e solo qui:
 * è l'unico punto in cui il resto dell'app tocca `database.types.ts`.
 */
type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

// ──────────────────────────────── Catalogo ──────────────────────────────────

/** Ogni talento è a scelta: né la razza né la via ne portano più uno. */
export type Talento = Pick<Row<"talenti">, "key" | "name" | "description">;

export type Razza = Pick<
  Row<"razze">,
  "key" | "name" | "description" | "sort_order"
>;

export type Via = Pick<
  Row<"vie">,
  "key" | "name" | "description" | "sort_order"
>;

/**
 * Il catalogo di gioco, già ricomposto secondo le relazioni del DB. Non
 * descrive la UI: il wizard lo interroga, non è definito da esso.
 */
export type Catalog = {
  vie: Via[];
  razze: Razza[];
  /** Tutti i talenti, in un elenco piatto: sono tutti a scelta. */
  talentiScelta: Talento[];
};

// ─────────────────────────────── Personaggio ────────────────────────────────

/**
 * Un personaggio salvato, con i talenti scelti già uniti. La colonna
 * `tribu_key` esiste ancora nel DB ma l'app non la sceglie né la legge più.
 */
export type Personaggio = Pick<
  Row<"personaggi">,
  "id" | "name" | "via_key" | "razza_key" | "created_at"
> & {
  /** Chiavi dei talenti scelti dall'utente. */
  talenti: string[];
};

/**
 * Le scelte in corso nel wizard, e il payload che il client manda alla server
 * action: è lo stesso oggetto, quindi esiste una sola definizione di "valido"
 * (vedi `validateDraft`). I campi non ancora compilati sono `null`.
 */
export type PersonaggioDraft = {
  name: string;
  via_key: string | null;
  razza_key: string | null;
  /** Chiavi dei talenti scelti: quanti ne servono lo dice `TALENTI_DA_SCEGLIERE`. */
  talenti: string[];
};

/**
 * Esito del salvataggio, restituito dalla server action al wizard. Al successo
 * basta l'id: è ciò che serve per aprire la quest del personaggio appena nato.
 */
export type SavePersonaggioResult =
  | { ok: true; id: string }
  | { ok: false; message: string; problems?: string[] };
