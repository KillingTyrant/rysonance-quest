/**
 * Quello che la quest mostra del personaggio: pochi campi già risolti sul
 * catalogo, perché al client non serve (e non va mandato) il catalogo intero.
 */
export type QuestCarta = {
  personaggioId: string;
  nome: string;
  /** Chiave della razza: servirà a scegliere l'illustrazione della card. */
  razzaKey: string;
  razza: string | null;
  via: string | null;
};

export type Quest = {
  carta: QuestCarta;
  /** Il numero della canzone da indovinare, se è già stato estratto. */
  numero: number | null;
};

/** Esito del lancio, restituito dalla server action al dado. */
export type LancioResult =
  | { ok: true; numero: number }
  | { ok: false; message: string };
