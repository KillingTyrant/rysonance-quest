/**
 * Tipi condivisi del dado d12. Nessuna dipendenza da React o da three: il modulo
 * è importabile sia dall'app sia dai test eseguiti in Node.
 */

export type Vec2Tuple = readonly [number, number];
export type Vec3Tuple = readonly [number, number, number];

/** Un punto in pixel, nelle coordinate del viewport (come `clientX`/`clientY`). */
export type ScreenPoint = { x: number; y: number };

export type D12DiceProps = {
  className?: string;
  /** Impedisce nuovi lanci; il dado resta visibile con l'ultimo risultato. */
  disabled?: boolean;
  /** Esegue un lancio al montaggio, una sola volta (saltato se `disabled`). */
  autoRoll?: boolean;
  /** Risultato mostrato prima del primo lancio, se è un intero fra 1 e 12. */
  initialValue?: number;
  onRollStart?: () => void;
  /**
   * Il dado si è fermato. `landing` è il centro della faccia superiore nel
   * viewport: da lì può partire un'animazione che "esce" dal dado.
   */
  onRollEnd?: (result: number, landing: ScreenPoint) => void;
  /** Riceve `null` all'inizio del lancio e il risultato quando il dado si ferma. */
  onResultChange?: (result: number | null) => void;
  /**
   * La scena occupa tutta l'altezza disponibile invece di restare in 4:3, con il pulsante
   * in fondo. Il genitore deve essere un flex column che si estende in altezza.
   */
  fill?: boolean;
  /** Abilita i controlli orbitali della camera (disattivi di default). */
  orbitControls?: boolean;
  /** Mostra il pulsante "Lancia il d12" sotto la scena (default `true`). */
  rollButton?: boolean;
  /** Bordo e angoli arrotondati attorno alla scena (default `true`). */
  framed?: boolean;
  /**
   * Annuncia lancio e risultato con una live region (default `true`). Da
   * spegnere quando è il genitore a raccontare cosa succede.
   */
  announce?: boolean;
  /** Colori, materiale e font dei numeri del dado. */
  appearance?: Partial<DiceAppearance>;
};

/**
 * Il piano su cui cade il dado: un disco pieno, solo l'ombra (il dado sembra
 * appoggiato sullo sfondo della pagina) o niente.
 */
export type DiceFloor = "disc" | "shadow" | "none";

export type DiceAppearance = {
  bodyColor: string;
  numberColor: string;
  edgeColor: string;
  /** Contorno scuro dei numeri, per il tratto da illustrazione; `null` per numeri pieni. */
  numberOutlineColor: string | null;
  /** Reticolo esagonale disegnato sulle facce; `null` per facce lisce. */
  patternColor: string | null;
  /** Bordo scuro dipinto lungo il pentagono di ogni faccia; `null` per nessuna cornice. */
  faceBorderColor: string | null;
  floor: DiceFloor;
  /** Colore del disco; ignorato con gli altri tipi di piano. */
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
  /**
   * Forza del lancio 0..1 (per esempio dalla velocità di uno swipe): alza il
   * salto, allunga il volo e aggiunge giri, sempre dentro gli intervalli di
   * un lancio normale. Senza, tutto resta casuale.
   */
  power?: number;
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
  /**
   * Il risultato deciso fuori dal dado (per esempio estratto dal server). Se
   * manca è casuale; se non è un valore valido il lancio viene rifiutato.
   */
  result?: number;
  /** Vedi `CreateRollPlanOptions.power`. */
  power?: number;
};

export type DiceController = {
  getState: () => DiceControllerState;
  subscribe: (listener: () => void) => () => void;
  /** Avvia un lancio; restituisce `null` se rifiutato (già in corso o disabilitato). */
  roll: (options?: RollOptions) => RollPlan | null;
  /** Conclude il lancio con quell'id; ignora id non attivi. */
  settle: (planId: number) => boolean;
};
