import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { getCatalog } from "@/lib/onboarding/catalog";
import { getPersonaggio } from "@/lib/onboarding/personaggi";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";

import { toQuestCarta } from "./carta";
import { getQuestKey } from "./config";
import type { LancioResult, Quest } from "./types";

/**
 * Il numero della canzone sta in `personaggio_quest.numero_dado`, sulla riga
 * che lega il personaggio alla quest di questo deploy (`getQuestKey`). Lo
 * estrae il database, nella RPC `lancia_dado`, e non l'app: così il client non
 * può scegliersi il numero, e il personaggio ha lo stesso numero su ogni
 * browser e dispositivo. L'owner la riga la può solo leggere.
 *
 * Un personaggio senza riga per questa quest (creato prima delle quest, senza
 * `QUEST_KEY` o per un altro evento) non ha numero e non può lanciare.
 */
async function leggiNumero(personaggioId: string): Promise<number | null> {
  const questKey = getQuestKey();
  if (!questKey) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personaggio_quest")
    .select("numero_dado")
    .eq("personaggio_id", personaggioId)
    .eq("quest_key", questKey)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.numero_dado ?? null;
}

/**
 * La quest del personaggio, o `null` se il personaggio non esiste o non è
 * dell'utente corrente (lo decide RLS).
 */
export async function getQuest(personaggioId: string): Promise<Quest | null> {
  // Prima delle query: un id che non è un uuid farebbe fallire quella del
  // numero, e la pagina mostrerebbe un errore invece del 404.
  if (!isUuid(personaggioId)) return null;

  const [personaggio, catalog, numero] = await Promise.all([
    getPersonaggio(personaggioId),
    getCatalog(),
    leggiNumero(personaggioId),
  ]);
  if (!personaggio) return null;

  return {
    carta: toQuestCarta(catalog, personaggio),
    numero,
  };
}

/**
 * Lancia il dado: `lancia_dado` estrae il numero una volta sola per personaggio
 * e quest, e se c'è già restituisce quello. Così un doppio tap, un retry dopo un
 * errore di rete, due schede aperte o due dispositivi danno sempre lo stesso
 * numero.
 *
 * Non scrive cookie né rivalida la pagina: il numero arriva al client solo come
 * risultato di questa action, ed è il reducer della quest a usarlo.
 */
export async function eseguiLancio(personaggioId: unknown): Promise<LancioResult> {
  if (!isUuid(personaggioId)) {
    return { ok: false, message: "Personaggio non valido. Ricarica la pagina." };
  }

  const questKey = getQuestKey();
  if (!questKey) {
    return {
      ok: false,
      message: "La quest di questo evento non è configurata. Avvisa gli organizzatori.",
    };
  }

  const supabase = await createClient();
  const { data: numero, error } = await supabase.rpc("lancia_dado", {
    p_personaggio_id: personaggioId,
    p_quest_key: questKey,
  });

  if (error) return { ok: false, message: describeError(error) };

  return { ok: true, numero };
}

function describeError(error: PostgrestError): string {
  switch (error.code) {
    case "PT404": // lancia_dado: personaggio inesistente, di un altro utente o
      // senza riga per questa quest. Per chi chiama sono la stessa cosa.
      return "Questo personaggio non partecipa alla quest di questo evento. Avvisa gli organizzatori.";
    case "42501": // insufficient_privilege: lancia_dado senza sessione.
      return "Sessione scaduta: accedi di nuovo per lanciare il dado.";
    case "PGRST202":
      return "L'app non è allineata al database. Ricarica la pagina.";
    default:
      return "Il dado non ha risposto. Riprova tra poco.";
  }
}
