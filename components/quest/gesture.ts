/**
 * Riconoscimento del gesto con cui si lancia il dado: un tocco o uno swipe verso
 * l'alto. Nessuna dipendenza da React o dal DOM: riceve i campioni del puntatore
 * e restituisce una decisione, così le soglie sono verificabili in Node.
 */

/** Un campione del puntatore: coordinate del viewport e `timeStamp` in millisecondi. */
export type GestureSample = { x: number; y: number; t: number };

export type Gesture =
  | { kind: "tap" }
  /** `power` 0..1 dalla velocità verso l'alto al momento del rilascio. */
  | { kind: "swipe"; power: number }
  /** Trascinato e rilasciato senza slancio, o in un'altra direzione: il dado torna a posto. */
  | { kind: "none" };

export type GestureOptions = {
  /** Oltre questo spostamento (px) non è più un tocco. */
  tapMaxDistance: number;
  /** Oltre questa durata (ms) non è più un tocco: è una pressione lunga. */
  tapMaxDuration: number;
  /** Salita minima (px) perché il rilascio conti come lancio. */
  swipeMinDistance: number;
  /** Velocità verso l'alto (px/ms) sotto cui il rilascio non ha slancio. */
  swipeMinVelocity: number;
  /** Velocità (px/ms) a cui la forza del lancio è piena. */
  swipeMaxVelocity: number;
  /** Finestra (ms) prima del rilascio su cui si misura la velocità. */
  velocityWindow: number;
  /**
   * Quanto la direzione può scostarsi dalla verticale: la salita deve valere
   * almeno questa frazione dello spostamento orizzontale.
   */
  verticalRatio: number;
};

export const DEFAULT_GESTURE_OPTIONS: GestureOptions = {
  tapMaxDistance: 10,
  tapMaxDuration: 800,
  swipeMinDistance: 40,
  swipeMinVelocity: 0.35,
  swipeMaxVelocity: 2.4,
  velocityWindow: 100,
  verticalRatio: 0.7,
};

export function classifyGesture(
  samples: readonly GestureSample[],
  options: GestureOptions = DEFAULT_GESTURE_OPTIONS,
): Gesture {
  if (samples.length === 0) return { kind: "none" };

  const first = samples[0];
  const last = samples[samples.length - 1];
  const rise = first.y - last.y;
  const drift = Math.abs(last.x - first.x);

  if (
    Math.hypot(drift, rise) <= options.tapMaxDistance &&
    last.t - first.t <= options.tapMaxDuration
  ) {
    return { kind: "tap" };
  }

  if (rise < options.swipeMinDistance || rise < drift * options.verticalRatio) {
    return { kind: "none" };
  }

  // Lo slancio è quello degli ultimi istanti: chi sale veloce e poi si ferma
  // prima di staccare il dito non sta lanciando.
  const windowStart = last.t - options.velocityWindow;
  const reference = samples.find((sample) => sample.t >= windowStart) ?? first;
  const elapsed = Math.max(1, last.t - reference.t);
  const velocity = (reference.y - last.y) / elapsed;

  if (reference === last || velocity < options.swipeMinVelocity) {
    return { kind: "none" };
  }

  const power =
    (velocity - options.swipeMinVelocity) /
    (options.swipeMaxVelocity - options.swipeMinVelocity);
  return { kind: "swipe", power: Math.min(1, Math.max(0, power)) };
}
