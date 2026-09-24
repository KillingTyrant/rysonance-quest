import type {
  Catalog,
  Personaggio,
  PersonaggioDraft,
  Razza,
  Talento,
  Via,
} from "./types";

// ─────────────────────────────── Lookup ─────────────────────────────────────

export function viaByKey(catalog: Catalog, key: string | null): Via | null {
  return catalog.vie.find((via) => via.key === key) ?? null;
}

export function razzaByKey(catalog: Catalog, key: string | null): Razza | null {
  return catalog.razze.find((razza) => razza.key === key) ?? null;
}

/** Un talento del catalogo per chiave. */
export function talentoSceltaByKey(
  catalog: Catalog,
  key: string | null,
): Talento | null {
  return catalog.talentiScelta.find((talento) => talento.key === key) ?? null;
}

// ──────────────────────────── View-model condiviso ──────────────────────────

/**
 * La forma unica su cui disegna `PersonaggioSheet`. Esiste perché la scheda
 * serve in più posti che partono da sorgenti diverse (le scelte in corso nel
 * wizard, e una riga salvata nella lobby): risolvendo prima, il renderer resta
 * uno solo.
 */
export type ResolvedPersonaggio = {
  name: string;
  via: Via | null;
  razza: Razza | null;
  /** I talenti scelti dall'utente, nell'ordine in cui li ha scelti. */
  talenti: Talento[];
};

/** Le scelte in corso: la razza è quella della card selezionata. */
export function resolveDraft(
  catalog: Catalog,
  draft: PersonaggioDraft,
): ResolvedPersonaggio {
  return resolve(catalog, draft, draft.razza_key);
}

/** Un personaggio salvato porta la razza nella sua colonna. */
export function resolveRow(
  catalog: Catalog,
  personaggio: Personaggio,
): ResolvedPersonaggio {
  return resolve(catalog, personaggio, personaggio.razza_key);
}

function resolve(
  catalog: Catalog,
  scelte: PersonaggioDraft | Personaggio,
  razzaKey: string | null,
): ResolvedPersonaggio {
  const via = viaByKey(catalog, scelte.via_key);
  const razza = razzaByKey(catalog, razzaKey);

  return {
    name: scelte.name,
    via,
    razza,
    // Si itera sulle scelte, non sul catalogo: l'ordine è quello in cui sono
    // state fatte. Una chiave sconosciuta semplicemente sparisce.
    talenti: scelte.talenti
      .map((key) => talentoSceltaByKey(catalog, key))
      .filter((talento): talento is Talento => talento !== null),
  };
}
