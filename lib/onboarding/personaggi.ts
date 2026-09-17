import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";

import { getCatalog } from "./catalog";
import type { Personaggio, SavePersonaggioResult } from "./types";
import { parseDraft, validateDraft } from "./validate";

/**
 * Colonne del personaggio più i talenti scelti, in una sola query. Deve restare
 * un unico literal su una riga: supabase-js deriva il tipo del risultato dal
 * testo del select, e una concatenazione lo degrada a `string`.
 */
const PERSONAGGIO_SELECT =
  "id, name, sesso, via_key, razza_key, tribu_key, created_at, personaggio_talenti(talent_key)";

type PersonaggioRow = Omit<Personaggio, "talenti"> & {
  personaggio_talenti: { talent_key: string }[];
};

/**
 * Personaggi dell'utente corrente, dal più recente. Il filtro per proprietario
 * lo fa RLS: senza sessione la query non restituisce righe.
 */
export async function listPersonaggi(): Promise<Personaggio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personaggi")
    .select(PERSONAGGIO_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as PersonaggioRow[]).map(toPersonaggio);
}

/**
 * Un personaggio dell'utente corrente, o `null` se non esiste o non è suo: per
 * RLS le due cose sono la stessa, e va bene così — chi apre l'URL di un altro
 * non deve nemmeno sapere se quel personaggio c'è.
 */
export async function getPersonaggio(id: string): Promise<Personaggio | null> {
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personaggi")
    .select(PERSONAGGIO_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toPersonaggio(data as PersonaggioRow) : null;
}

/** L'id del personaggio creato per ultimo dall'utente corrente, se ne ha uno. */
export async function getUltimoPersonaggioId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personaggi")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

/**
 * Crea il personaggio del wizard.
 *
 * L'argomento è `unknown` di proposito: una server action è un endpoint
 * pubblico e la forma del payload va verificata a runtime, non con i tipi. La
 * validazione usa la stessa `validateDraft` del client, così le due non possono
 * divergere; la scrittura vera passa dalla RPC `crea_personaggio`, che è il
 * confine transazionale fra le tabelle, decide da sé `user_id` e riapplica le
 * regole (numero di talenti, talenti a scelta).
 *
 * Al successo restituisce solo l'id, senza rileggere la riga: se la rilettura
 * fallisse il personaggio esisterebbe comunque, ma il client vedrebbe un
 * errore e riprovando ne creerebbe un secondo.
 */
export async function creaPersonaggio(
  input: unknown,
): Promise<SavePersonaggioResult> {
  const supabase = await createClient();

  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims?.sub) {
    return {
      ok: false,
      message: "Sessione scaduta: accedi di nuovo per salvare il personaggio.",
    };
  }

  const draft = parseDraft(input);
  if (!draft) {
    return {
      ok: false,
      message: "Dati del personaggio non validi. Ricarica la pagina e riprova.",
    };
  }

  const catalog = await getCatalog();
  const problems = validateDraft(catalog, draft);
  if (problems.length > 0) {
    return {
      ok: false,
      message: "Alcune scelte non sono valide.",
      problems: problems.map((problem) => problem.message),
    };
  }

  const { data: id, error } = await supabase.rpc("crea_personaggio", {
    p_name: draft.name,
    // validateDraft ha già scartato i null: qui i campi sono per forza pieni.
    p_sesso: draft.sesso!,
    p_via_key: draft.via_key!,
    p_tribu_key: draft.tribu_key!,
    p_talenti: draft.talenti,
    p_razza_key: draft.razza_key!,
  });

  if (error) return { ok: false, message: describeError(error) };

  return { ok: true, id };
}

function toPersonaggio({ personaggio_talenti, ...row }: PersonaggioRow): Personaggio {
  return {
    ...row,
    talenti: personaggio_talenti.map(({ talent_key }) => talent_key),
  };
}

/**
 * PostgREST non espone il nome del vincolo in un campo strutturato: sta solo
 * dentro `message`. Questi errori sono la rete di sicurezza dietro la
 * validazione — se l'utente ne vede uno, significa che il catalogo è cambiato
 * sotto i piedi di una pagina già prerenderizzata.
 */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  personaggi_name_check: "Il nome del personaggio non è valido.",
  personaggi_user_id_fkey: "Il tuo account non è più valido. Accedi di nuovo.",
  personaggi_razza_key_fkey: "La razza scelta non esiste più. Ricarica la pagina.",
  personaggi_tribu_key_fkey: "La tribù scelta non esiste più. Ricarica la pagina.",
  personaggi_tribu_key_razza_key_fkey:
    "La tribù scelta non appartiene alla razza. Ricarica la pagina.",
  personaggi_via_key_fkey: "La Via scelta non esiste più. Ricarica la pagina.",
};

function describeError(error: PostgrestError): string {
  const constraint = /constraint "([^"]+)"/.exec(error.message)?.[1];
  if (constraint && CONSTRAINT_MESSAGES[constraint]) {
    return CONSTRAINT_MESSAGES[constraint];
  }

  switch (error.code) {
    case "23503": // foreign_key_violation, e i raise di crea_personaggio: via
      // inesistente, talento inesistente o non a scelta.
      return "Una delle scelte non esiste più nel catalogo, o non è fra quelle disponibili. Ricarica la pagina.";
    case "23514": // check_violation: crea_personaggio esige esattamente
      // `vie.talenti_scelta` talenti.
      return "Il numero di talenti scelti non è quello previsto dalla tua Via. Ricarica la pagina.";
    case "42501": // insufficient_privilege: crea_personaggio senza sessione, o
      // un accesso diretto alle tabelle, che solo la RPC può scrivere.
      return "Serve una sessione valida per salvare il personaggio. Accedi di nuovo.";
    case "PGRST202":
    case "PGRST204":
      return "L'app non è allineata al database. Ricarica la pagina.";
    default:
      return "Non è stato possibile salvare il personaggio. Riprova tra poco.";
  }
}
