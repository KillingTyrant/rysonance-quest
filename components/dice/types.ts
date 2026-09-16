/**
 * Tipi condivisi del dado d12. Nessuna dipendenza da React o da three: il modulo
 * è importabile sia dall'app sia dai test eseguiti in Node.
 */

export type Vec2Tuple = readonly [number, number];
export type Vec3Tuple = readonly [number, number, number];

export type D12DiceProps = {
  className?: string;
  /** Impedisce nuovi lanci; il dado resta visibile con l'ultimo risultato. */
  disabled?: boolean;
  /** Esegue un lancio al montaggio, una sola volta (saltato se `disabled`). */
  autoRoll?: boolean;
  /** Risultato mostrato prima del primo lancio, se è un intero fra 1 e 12. */
  initialValue?: number;
  onRollStart?: () => void;
  onRollEnd?: (result: number) => void;
  /** Riceve `null` all'inizio del lancio e il risultato quando il dado si ferma. */
  onResultChange?: (result: number | null) => void;
  /**
   * La scena occupa tutta l'altezza disponibile invece di restare in 4:3, con il pulsante
   * in fondo. Il genitore deve essere un flex column che si estende in altezza.
   */
  fill?: boolean;
  /** Abilita i controlli orbitali della camera (disattivi di default). */
  orbitControls?: boolean;
  /** Colori, materiale e font dei numeri del dado. */
  appearance?: Partial<DiceAppearance>;
};

export type DiceAppearance = {
  bodyColor: string;
  numberColor: string;
  edgeColor: string;
  floorColor: string;
  roughness: number;
  metalness: number;
  /** Font con cui vengono disegnati i numeri sulle facce. */
  fontFamily: string;
};

/** Rotazione completa attorno a un asse: `turns` giri interi (con segno). */
export type RollSpin = {
  axis: Vec3Tuple;
  turns: number;
};

/** Un arco di rimbalzo fra due istanti normalizzati, con altezza massima in unità mondo. */
export type RollBounce = {
  start: number;
  end: number;
  height: number;
};

/** Istanti chiave del lancio come frazioni 0..1 della durata totale. */
export type RollTimeline = {
  /** Fine della preparazione e inizio della salita. */
  liftStart: number;
  /** Punto più alto del salto. */
  apex: number;
  /** Primo impatto con il piano. */
  land: number;
  bounces: readonly RollBounce[];
  /** Istante in cui il dado è del tutto fermo nell'orientamento finale. */
  settled: number;
};

/**
 * Piano di un lancio: tutto ciò che è casuale viene deciso qui, una volta sola,
 * così l'animazione è deterministica per l'intera durata.
 */
export type RollPlan = {
  id: number;
  result: number;
  /** Durata in secondi. */
  duration: number;
  reducedMotion: boolean;
  /** Altezza massima del salto sopra la posizione di riposo. */
  apexHeight: number;
  /** Posizione (x, z) di partenza e di atterraggio sul piano. */
  from: Vec2Tuple;
  to: Vec2Tuple;
  spins: readonly RollSpin[];
  /** Ampiezza (frazione di giro) del caricamento iniziale all'indietro. */
  windUp: number;
  /** Rotazione casuale attorno alla verticale sommata all'orientamento finale. */
  yawJitter: number;
  timeline: RollTimeline;
};

/** Posa del dado a un dato istante: solo numeri, senza oggetti three. */
export type RollPose = {
  x: number;
  /** Altezza sopra la posizione di riposo. */
  y: number;
  z: number;
  /** Angolo (radianti) di ciascuno degli `spins` del piano. */
  spinAngles: readonly number[];
  /** Interpolazione 0..1 dall'orientamento iniziale a quello finale. */
  blend: number;
  progress: number;
  done: boolean;
};

export type CameraFitOptions = {
  /** Larghezza / altezza del canvas. */
  aspect: number;
  /** Angolo di campo verticale in gradi. */
  fov: number;
  /** Distanza camera-bersaglio dell'inquadratura di riferimento. */
  baseDistance: number;
  /** Semi-larghezza orizzontale, alla distanza del bersaglio, che deve restare visibile. */
  minHalfWidth: number;
};

export type CreateRollPlanOptions = {
  id: number;
  result: number;
  from?: Vec2Tuple;
  reducedMotion?: boolean;
  random?: () => number;
};

export type DiceControllerState = {
  rolling: boolean;
  /** Ultimo risultato fermo; `null` durante il lancio o prima del primo lancio. */
  result: number | null;
  plan: RollPlan | null;
  /** Posizione (x, z) in cui il dado è appoggiato. */
  position: Vec2Tuple;
};

export type DiceControllerCallbacks = {
  onRollStart?: (plan: RollPlan) => void;
  onRollEnd?: (result: number) => void;
  onResultChange?: (result: number | null) => void;
};

export type DiceControllerOptions = {
  initialValue?: number;
  callbacks?: DiceControllerCallbacks;
  random?: () => number;
};

export type RollOptions = {
  disabled?: boolean;
  reducedMotion?: boolean;
};

export type DiceController = {
  getState: () => DiceControllerState;
  subscribe: (listener: () => void) => () => void;
  /** Avvia un lancio; restituisce `null` se rifiutato (già in corso o disabilitato). */
  roll: (options?: RollOptions) => RollPlan | null;
  /** Conclude il lancio con quell'id; ignora id non attivi. */
  settle: (planId: number) => boolean;
};
