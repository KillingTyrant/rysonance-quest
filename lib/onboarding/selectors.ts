import type {
  Catalog,
  Personaggio,
  PersonaggioDraft,
  Razza,
  Sesso,
  Talento,
  Tribu,
  Via,
} from "./types";
import { SESSI } from "./types";

// ─────────────────────────────── Lookup ─────────────────────────────────────

export function viaByKey(catalog: Catalog, key: string | null): Via | null {
  return catalog.vie.find((via) => via.key === key) ?? null;
}

export function razzaByKey(catalog: Catalog, key: string | null): Razza | null {
  return catalog.razze.find((razza) => razza.key === key) ?? null;
}

export function tribuByKey(catalog: Catalog, key: string | null): Tribu | null {
  if (!key) return null;
  for (const razza of catalog.razze) {
    const found = razza.tribu.find((tribu) => tribu.key === key);
    if (found) return found;
  }
  return null;
}

/** Cerca solo fra i talenti a scelta: gli altri non si possono scegliere. */
export function talentoSceltaByKey(
  catalog: Catalog,
  key: string | null,
): Talento | null {
  return catalog.talentiScelta.find((talento) => talento.key === key) ?? null;
}

/**
 * "i Nani" ma "gli Umani": l'articolo plurale maschile dipende dall'iniziale
 * del nome. Serve a comporre anche le preposizioni — "a" + articolo dà "ai" o
 * "agli", "de" + articolo dà "dei" o "degli".
 *
 * Nessun nome di razza comincia per z o s+consonante, ma la regola completa
 * costa una riga e non lascia trappole a chi aggiungerà una razza.
 */
export function articolo(nome: string): "i" | "gli" {
  return /^([aeiou]|z|s[bcdfglmnpqrtv]|gn|ps|x|y)/i.test(nome) ? "gli" : "i";
}

export function sessoName(sesso: Sesso | null): string | null {
  return SESSI.find((item) => item.key === sesso)?.name ?? null;
}

// ─────────────────────────────── Derivazioni ────────────────────────────────

/** Il talento con cui la via comincia (`vie.talent_key`). */
export function talentoIniziale(via: Via | null): Talento | null {
  return via?.talento ?? null;
}

/**
 * Quanti talenti deve scegliere chi percorre questa via. È `vie.talenti_scelta`,
 * la stessa regola che `crea_personaggio` impone al salvataggio: qui serve al
 * wizard per sapere quante card far scegliere prima di provare a salvare.
 */
export function talentiDaScegliere(via: Via | null): number {
  return via?.talenti_scelta ?? 0;
}

/**
 * Una razza è giocabile se ha almeno una tribù: senza, non ci sarebbe niente
 * da scegliere nella sua card e il personaggio non sarebbe salvabile
 * (`personaggi.tribu_key` è obbligatoria).
 */
export function isRazzaGiocabile(razza: Razza): boolean {
  return razza.tribu.length > 0;
}

/** Tutti i talenti che il personaggio NON sceglie: razza, tribù, apertura della via. */
export function talentiAssegnati(
  razza: Razza | null,
  tribu: Tribu | null,
  via: Via | null,
): Talento[] {
  return [razza?.talento, tribu?.talento, talentoIniziale(via)].filter(
    (talento): talento is Talento => talento !== null && talento !== undefined,
  );
}

// ──────────────────────────── View-model condiviso ──────────────────────────

/**
 * La forma unica su cui disegna `PersonaggioSheet`. Esiste perché il riepilogo
 * serve in tre posti che partono da sorgenti diverse (le scelte in corso nel
 * wizard, e una riga salvata nella lobby): risolvendo prima, il renderer resta
 * uno solo.
 */
export type ResolvedPersonaggio = {
  name: string;
  sesso: string | null;
  via: Via | null;
  razza: Razza | null;
  tribu: Tribu | null;
  /**
   * Assegnati (razza, tribù, via) e poi quelli scelti dall'utente. Chi disegna
   * distingue i due gruppi con `talento.kind`, senza bisogno di due liste.
   */
  talenti: Talento[];
  /**
   * Vita, mana e velocità base della tribù. Sono `null` finché nel wizard la
   * tribù non è scelta, o se il personaggio salvato non ne ha una: nel
   * catalogo non sono mai nulli.
   */
  hp: number | null;
  mana: number | null;
  speed: number | null;
};

/**
 * Le scelte in corso: la razza è quella della card selezionata, che può
 * esistere anche prima della tribù.
 */
export function resolveDraft(
  catalog: Catalog,
  draft: PersonaggioDraft,
): ResolvedPersonaggio {
  return resolve(catalog, draft, draft.razza_key);
}

/**
 * Un personaggio salvato porta la razza nella sua colonna: la tribù è
 * facoltativa, quindi non si può ricavare da lei.
 */
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
  const tribu = tribuByKey(catalog, scelte.tribu_key);

  return {
    name: scelte.name,
    sesso: sessoName(scelte.sesso),
    via,
    razza,
    tribu,
    talenti: [
      ...talentiAssegnati(razza, tribu, via),
      // Si itera sulle scelte, non sul catalogo: l'ordine è quello in cui sono
      // state fatte. Una chiave sconosciuta semplicemente sparisce.
      ...scelte.talenti
        .map((key) => talentoSceltaByKey(catalog, key))
        .filter((talento): talento is Talento => talento !== null),
    ],
    hp: tribu?.base_hp ?? null,
    mana: tribu?.base_mana ?? null,
    speed: tribu?.base_speed ?? null,
  };
}
