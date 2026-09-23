import {
  articolo,
  isRazzaGiocabile,
  razzaByKey,
  talentiDaScegliere,
  talentoSceltaByKey,
  tribuByKey,
  viaByKey,
} from "./selectors";
import type { Catalog, PersonaggioDraft } from "./types";

/** Allineato al check `personaggi_name_check`. */
export const NAME_MAX_LENGTH = 40;

/** I campi del draft su cui può esistere un problema. */
export type DraftField =
  | "name"
  | "via_key"
  | "razza_key"
  | "tribu_key"
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
    tribu_key: null,
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
    tribu_key: asKey(raw.tribu_key),
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

  // ── chi è: nome, razza e tribù ────────────────────────────────────────────
  const name = draft.name.trim();
  if (name.length === 0) {
    add("name", "Nome", "Il personaggio deve avere un nome.");
  } else if (name.length > NAME_MAX_LENGTH) {
    add("name", "Nome", `Il nome non può superare i ${NAME_MAX_LENGTH} caratteri.`);
  }

  const razza = razzaByKey(catalog, draft.razza_key);
  if (!razza) {
    add("razza_key", "Razza", "Scegli una razza.");
  } else if (!isRazzaGiocabile(razza)) {
    add(
      "razza_key",
      "Razza",
      `${maiuscola(articolo(razza.name))} ${razza.name} non sono ancora giocabili.`,
    );
  }

  const tribu = tribuByKey(catalog, draft.tribu_key);
  if (!tribu) {
    add("tribu_key", "Tribù", "Scegli una tribù.");
  } else if (razza && tribu.razza_key !== razza.key) {
    add(
      "tribu_key",
      "Tribù",
      `${tribu.name} non appartiene a${articolo(razza.name)} ${razza.name}.`,
    );
  }

  // ── la Via ────────────────────────────────────────────────────────────────
  const via = viaByKey(catalog, draft.via_key);
  if (!via) {
    add("via_key", "Via", "Scegli la Via dell'eroe.");
  }

  // ── talenti: quanti ne servono lo dice la Via, nessun altro vincolo ────────
  const sconosciuti = draft.talenti.filter((key) => !talentoSceltaByKey(catalog, key));
  const attesi = talentiDaScegliere(via);
  if (sconosciuti.length > 0) {
    add(
      "talenti",
      "Talenti",
      `Non esiste nessun talento con chiave "${sconosciuti[0]}".`,
    );
  } else if (!via) {
    // Senza Via non si sa quanti talenti servano: la scelta non può dirsi
    // fatta. Senza questo caso `attesi` varrebbe 0 e un draft ancora vuoto
    // risulterebbe completo — spunta verde sulla riga "talenti" della hub.
    add(
      "talenti",
      "Talenti",
      "Scegli prima la Via: è lei a dire quanti talenti puoi apprendere.",
    );
  } else if (draft.talenti.length !== attesi) {
    const mancanti = attesi - draft.talenti.length;
    add(
      "talenti",
      "Talenti",
      mancanti > 0
        ? `Scegli ${attesi} talenti: ne manca${mancanti === 1 ? "" : "no"} ${mancanti}.`
        : `Puoi scegliere solo ${attesi} talenti.`,
    );
  }

  return problems;
}

function maiuscola(parola: string): string {
  return parola[0].toUpperCase() + parola.slice(1);
}

function asKey(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

