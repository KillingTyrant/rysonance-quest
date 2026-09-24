import { resolveRow } from "@/lib/onboarding/selectors";
import type { Catalog, Personaggio } from "@/lib/onboarding/types";

import type { QuestCarta } from "./types";

/**
 * La card di un personaggio salvato, risolta sul catalogo. La usano la quest e la
 * lobby: al client arrivano solo questi campi, non il catalogo intero.
 */
export function toQuestCarta(catalog: Catalog, personaggio: Personaggio): QuestCarta {
  const resolved = resolveRow(catalog, personaggio);
  return {
    personaggioId: personaggio.id,
    nome: resolved.name,
    razzaKey: personaggio.razza_key,
    razza: resolved.razza?.name ?? null,
    via: resolved.via?.name ?? null,
  };
}
