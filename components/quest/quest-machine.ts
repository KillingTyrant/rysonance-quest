/**
 * La quest come macchina a stati: quale schermata si vede e a che punto è il
 * lancio del dado. Un reducer puro, senza React né DOM, così ogni transizione è
 * verificabile in Node e le animazioni possono solo seguirlo, mai deciderlo.
 */

export type QuestStep = "dado" | "risultato" | "istruzioni" | "carta";

/**
 * - `fermo`: nessun lancio in corso.
 * - `in-attesa`: gesto fatto, il server sta estraendo il numero.
 * - `in-volo`: il numero è arrivato e il dado 3D sta rotolando verso di lui.
 * - `errore`: il server non ha risposto; si può ritentare.
 */
export type LancioStato = "fermo" | "in-attesa" | "in-volo" | "errore";

export type QuestState = {
  step: QuestStep;
  /** Il numero della canzone: `null` finché il server non l'ha estratto. */
  numero: number | null;
  lancio: LancioStato;
  /** Forza 0..1 dello swipe che ha avviato il lancio; `null` per tocco o tastiera. */
  forza: number | null;
  errore: string | null;
};

export type QuestEvent =
  | { type: "gesto"; forza: number | null }
  | { type: "numero"; numero: number }
  | { type: "errore"; messaggio: string }
  | { type: "atterrato" }
  | { type: "continua" }
  | { type: "godi" };

// Ridefinito invece di importare `isValidD12Value`: i test Node caricano questo modulo direttamente.
function isNumeroValido(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 1 && value <= 12;
}

/**
 * Chi arriva con il numero già estratto riparte dalle istruzioni: il numero
 * gigante e cosa fare all'evento sono ciò che gli serve, la sorpresa l'ha già
 * avuta. Gli altri partono dal dado.
 */
export function initialQuestState(numero: number | null): QuestState {
  const estratto = isNumeroValido(numero);
  return {
    step: estratto ? "istruzioni" : "dado",
    numero: estratto ? numero : null,
    lancio: "fermo",
    forza: null,
    errore: null,
  };
}

/**
 * Ogni evento vale solo nello stato in cui ha senso; altrimenti lo stato resta
 * lo stesso oggetto. Così un doppio tap, una risposta arrivata tardi o un
 * "Continua" premuto due volte non possono far saltare uno step.
 */
export function questReducer(state: QuestState, event: QuestEvent): QuestState {
  switch (event.type) {
    case "gesto":
      if (
        state.step !== "dado" ||
        state.numero !== null ||
        (state.lancio !== "fermo" && state.lancio !== "errore")
      ) {
        return state;
      }
      return { ...state, lancio: "in-attesa", forza: event.forza, errore: null };

    case "numero":
      if (state.lancio !== "in-attesa" || !isNumeroValido(event.numero)) return state;
      return { ...state, lancio: "in-volo", numero: event.numero };

    case "errore":
      if (state.lancio !== "in-attesa") return state;
      return { ...state, lancio: "errore", forza: null, errore: event.messaggio };

    case "atterrato":
      if (state.lancio !== "in-volo") return state;
      return { ...state, step: "risultato", lancio: "fermo" };

    case "continua":
      if (state.step !== "risultato") return state;
      return { ...state, step: "istruzioni" };

    case "godi":
      if (state.step !== "istruzioni") return state;
      return { ...state, step: "carta" };
  }
}
