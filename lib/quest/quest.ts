import "server-only";

import { cookies } from "next/headers";

import { isValidD12Value, randomD12 } from "@/components/dice/dice-utils";
import { getCatalog } from "@/lib/onboarding/catalog";
import { getPersonaggio } from "@/lib/onboarding/personaggi";
import { isUuid } from "@/lib/utils";

import { toQuestCarta } from "./carta";
import type { LancioResult, Quest } from "./types";

/**
 * ⚠️ Soluzione provvisoria: il numero della canzone vive in un cookie per
 * personaggio, finché non avrà un campo nel database. Questo modulo è l'unico
 * che lo sa — quando arriverà il campo cambiano solo `leggiNumero` e
 * `eseguiLancio`, non le rotte né i componenti.
 *
 * Il cookie è `httpOnly`, quindi il JavaScript della pagina non lo legge né lo
 * scrive; ma non è firmato, e chi cancella i cookie o cambia browser può
 * rilanciare. Per ora è accettato.
 */
const COOKIE_PREFIX = "rq_numero_";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function leggiNumero(store: CookieStore, personaggioId: string): number | null {
  const value = Number(store.get(COOKIE_PREFIX + personaggioId)?.value);
  return isValidD12Value(value) ? value : null;
}

/**
 * La quest del personaggio, o `null` se il personaggio non esiste o non è
 * dell'utente corrente (lo decide RLS).
 */
export async function getQuest(personaggioId: string): Promise<Quest | null> {
  const [personaggio, catalog, store] = await Promise.all([
    getPersonaggio(personaggioId),
    getCatalog(),
    cookies(),
  ]);
  if (!personaggio) return null;

  return {
    carta: toQuestCarta(catalog, personaggio),
    numero: leggiNumero(store, personaggio.id),
  };
}

/**
 * Estrae il numero della canzone, una volta sola per personaggio: se c'è già,
 * restituisce quello. Così un doppio tap, un retry dopo un errore di rete o due
 * schede aperte danno sempre lo stesso numero.
 *
 * L'estrazione avviene qui, sul server, e non nel browser. Scrivere il cookie
 * fa ri-renderizzare la pagina nella stessa risposta: il client deve ignorare
 * il numero che gli arriva dalle props dopo il mount.
 */
export async function eseguiLancio(personaggioId: unknown): Promise<LancioResult> {
  if (!isUuid(personaggioId)) {
    return { ok: false, message: "Personaggio non valido. Ricarica la pagina." };
  }

  try {
    const personaggio = await getPersonaggio(personaggioId);
    if (!personaggio) {
      return {
        ok: false,
        message: "Non troviamo il tuo personaggio: forse la sessione è scaduta. Ricarica la pagina.",
      };
    }

    const store = await cookies();
    const esistente = leggiNumero(store, personaggio.id);
    if (esistente !== null) return { ok: true, numero: esistente };

    const numero = randomD12();
    store.set(COOKIE_PREFIX + personaggio.id, String(numero), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return { ok: true, numero };
  } catch {
    return { ok: false, message: "Il dado non ha risposto. Riprova tra poco." };
  }
}
