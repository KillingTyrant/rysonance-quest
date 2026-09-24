import { razzaByKey, talentoSceltaByKey, viaByKey } from "./selectors";
import type { Catalog, PersonaggioDraft } from "./types";

/** Allineato al check `personaggi_name_check`. */
export const NAME_MAX_LENGTH = 40;

/**
 * Quanti talenti si scelgono alla creazione: lo stesso numero per tutte le Vie.
 *
 * È una SCELTA DI PRODOTTO, non un vincolo del database: la colonna con cui la
 * Via imponeva il suo numero non esiste più, e `crea_personaggio` non conta i
 * talenti — accetta qualunque numero, zero compreso. Non c'è nessun controllo
 * server-side, quindi se questa validazione sbaglia il personaggio viene
 * salvato com'è.
 *
 * Unico punto in cui la regola è scritta: per cambiarla basta questa riga.
 */
export const TALENTI_DA_SCEGLIERE = 1;

/** I campi del draft su cui può esistere un problema. */
export type DraftField =
  | "name"
  | "via_key"
  | "razza_key"
  | "talenti";

export type Problem = {
  field: DraftField;
  /** Etichetta breve, per l'elenco "Manca: …" accanto al bottone Avanti. */
  label: string;
  /** Frase completa, per la hub e per la server action. */
  message: string;
};

export function emptyDraft(): PersonaggioDraft {
  return {
    name: "",
    via_key: null,
    razza_key: null,
    talenti: [],
  };
}

/**
 * Porta un payload arrivato dalla rete alla forma di un draft. Solo
 * coercizione: qui non si decide se le scelte sono valide (lo fa
 * `validateDraft`), si decide soltanto che tipo hanno. Una server action è un
 * endpoint pubblico e i tipi TypeScript non sopravvivono al confine di rete.
 */
export function parseDraft(input: unknown): PersonaggioDraft | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;

  // I duplicati vengono tolti qui: sono una forma sbagliata del payload, non
  // una scelta sbagliata (la PK di personaggio_talenti li rifiuterebbe comunque).
  const talenti = Array.isArray(raw.talenti)
    ? [...new Set(raw.talenti.filter((key): key is string => typeof key === "string"))]
    : [];

  return {
    name: typeof raw.name === "string" ? raw.name.trim() : "",
    via_key: asKey(raw.via_key),
    razza_key: asKey(raw.razza_key),
    talenti,
  };
}

/**
 * L'unica definizione di "personaggio valido" dell'applicazione.
 *
 * È organizzata per CAMPO, non per step: gli step sono una vista sui campi
 * (`lib/onboarding/steps.ts`). Per questo il bottone "Avanti", l'elenco di
 * cosa manca, le spunte della hub e il controllo della server action sono
 * tutti derivazioni di questa lista, e non possono divergere fra loro.
 */
export function validateDraft(
  catalog: Catalog,
  draft: PersonaggioDraft,
): Problem[] {
  const problems: Problem[] = [];
  const add = (field: DraftField, label: string, message: string) =>
    problems.push({ field, label, message });

  // I controlli seguono l'ordine degli step: leggere questa funzione
  // dev'essere come ripercorrere il wizard.

  // ── chi è: nome e razza ───────────────────────────────────────────────────
  const name = draft.name.trim();
  if (name.length === 0) {
    add("name", "Nome", "Il personaggio deve avere un nome.");
  } else if (name.length > NAME_MAX_LENGTH) {
    add("name", "Nome", `Il nome non può superare i ${NAME_MAX_LENGTH} caratteri.`);
  }

  const razza = razzaByKey(catalog, draft.razza_key);
  if (!razza) {
    add("razza_key", "Razza", "Scegli una razza.");
  }

  // ── la Via ────────────────────────────────────────────────────────────────
  const via = viaByKey(catalog, draft.via_key);
  if (!via) {
    add("via_key", "Via", "Scegli la Via dell'eroe.");
  }

  // ── talenti: sempre `TALENTI_DA_SCEGLIERE`, qualunque sia la Via ──────────
  const sconosciuti = draft.talenti.filter((key) => !talentoSceltaByKey(catalog, key));
  if (sconosciuti.length > 0) {
    add(
      "talenti",
      "Talenti",
      `Non esiste nessun talento con chiave "${sconosciuti[0]}".`,
    );
  } else if (draft.talenti.length !== TALENTI_DA_SCEGLIERE) {
    const mancanti = TALENTI_DA_SCEGLIERE - draft.talenti.length;
    add(
      "talenti",
      "Talenti",
      mancanti > 0
        ? `Scegli ${quantiTalenti(TALENTI_DA_SCEGLIERE)}: ne manca${mancanti === 1 ? "" : "no"} ${mancanti}.`
        : `Puoi scegliere solo ${quantiTalenti(TALENTI_DA_SCEGLIERE)}.`,
    );
  }

  return problems;
}

/** "1 talento" / "3 talenti": la regola è una costante, i messaggi no. */
export function quantiTalenti(n: number): string {
  return n === 1 ? "1 talento" : `${n} talenti`;
}

function asKey(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

