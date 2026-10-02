/**
 * Logica del d12 indipendente da React e da three: valori, easing, piano di
 * animazione e controller dello stato del lancio. La casualità viene campionata
 * una sola volta in `createRollPlan`, quindi ogni lancio è deterministico dopo
 * la creazione del piano ed è testabile con un `random` iniettato.
 */

import type {
  CameraFitOptions,
  CreateRollPlanOptions,
  DiceAppearance,
  DiceController,
  DiceControllerOptions,
  DiceControllerState,
  FlightFrame,
  FlightFrameOptions,
  RollOptions,
  RollPlan,
  RollPose,
  RollSpin,
  RollTimeline,
  Vec2Tuple,
  Vec3Tuple,
} from "./types";

export const D12_FACES = 12;

/**
 * Il d12 d'oro del gioco: facce a nido d'ape, cornice e contorni scuri come in
 * un'illustrazione, numeri chiari che restano leggibili anche in movimento.
 */
export const DEFAULT_DICE_APPEARANCE: DiceAppearance = {
  bodyColor: "#c68f22",
  numberColor: "#f3cf67",
  edgeColor: "#181206",
  numberOutlineColor: "#181206",
  patternColor: "#a3711a",
  faceBorderColor: "#1d1508",
  floor: "disc",
  floorColor: "#dcd6cb",
  roughness: 0.55,
  metalness: 0.12,
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

/** Durata (secondi) del lancio completo, estratta in questo intervallo. */
export const ROLL_DURATION_RANGE: Vec2Tuple = [1.6, 2.1];
export const REDUCED_MOTION_ROLL_DURATION = 0.7;
/** Altezza massima del salto (unità mondo sopra la posizione di riposo). */
export const APEX_HEIGHT_RANGE: Vec2Tuple = [1.3, 1.8];
export const REDUCED_MOTION_APEX_HEIGHT = 0.18;
/** Raggio del disco attorno all'origine in cui il dado atterra. */
export const LANDING_RADIUS = 0.55;
/**
 * Quota di casualità che resta in un lancio con `power`: due gesti identici
 * non devono produrre due voli identici.
 */
export const POWER_NOISE = 0.25;

const TWO_PI = Math.PI * 2;

export function randomD12(random: () => number = Math.random): number {
  return Math.floor(random() * D12_FACES) + 1;
}

export function isValidD12Value(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= D12_FACES
  );
}

export function clamp01(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function easeInOutSine(t: number): number {
  return (1 - Math.cos(Math.PI * t)) / 2;
}

/**
 * Distanza della camera dal bersaglio. L'angolo di campo è verticale: in un canvas
 * stretto e alto l'orizzonte visibile si restringe, quindi la camera arretra finché
 * `minHalfWidth` torna in vista. Nei canvas larghi resta alla distanza di riferimento.
 */
export function fitCameraDistance({
  aspect,
  fov,
  baseDistance,
  minHalfWidth,
}: CameraFitOptions): number {
  const tanHalfFov = Math.tan((fov * Math.PI) / 360);
  return Math.max(baseDistance, minHalfWidth / (tanHalfFov * aspect));
}

/** Punti sul bordo del disco di atterraggio, al riposo e all'apice: il volo sta dentro. */
const FLIGHT_RIM_SAMPLES = 24;
const FIT_ITERATIONS = 40;

/**
 * Inquadratura stretta sul volo: la distanza minima a cui il volume del lancio
 * (il disco di atterraggio dal riposo fino all'apice, con il dado attorno) resta
 * tutto nel canvas, e lo spostamento verticale che lo centra. Il salto sale verso
 * la camera, quindi il volume sta più sopra che sotto il bersaglio e `shiftY` è
 * positivo: il dado a riposo finisce sotto il centro.
 *
 * Senza spostamento orizzontale: la larghezza basta per il lato più largo.
 */
export function fitFlightFrame(options: FlightFrameOptions): FlightFrame {
  const tanHalfFov = Math.tan((options.fov * Math.PI) / 360);
  const maxHalfHeight = tanHalfFov * (1 - options.margin);
  const maxHalfWidth = maxHalfHeight * options.aspect;
  const fits = (distance: number) => {
    const bounds = flightBounds(options, distance);
    return (
      bounds !== null &&
      (bounds.maxY - bounds.minY) / 2 <= maxHalfHeight &&
      bounds.maxX <= maxHalfWidth
    );
  };

  // Raddoppia fino a contenere il volo, poi stringe: la dimensione apparente cala con la distanza.
  let far = 1;
  for (let i = 0; i < 32 && !fits(far); i += 1) far *= 2;
  let near = far / 2;
  for (let i = 0; i < FIT_ITERATIONS; i += 1) {
    const middle = (near + far) / 2;
    if (fits(middle)) far = middle;
    else near = middle;
  }

  const bounds = flightBounds(options, far);
  const centerY = bounds ? (bounds.maxY + bounds.minY) / 2 : 0;
  return { distance: far, shiftY: centerY / tanHalfFov };
}

/**
 * Estensione del volo vista dalla camera a `distance` dal bersaglio, in tangenti
 * dell'angolo dall'asse ottico (le unità del piano immagine a distanza 1). `null`
 * se una parte del dado finisce alle spalle della camera.
 */
function flightBounds(
  { target, direction, dieRadius, restHeight, apexHeight, landingRadius }: FlightFrameOptions,
  distance: number,
): { minY: number; maxY: number; maxX: number } | null {
  // La base di `lookAt` con l'alto del mondo in +y: avanti, destra = avanti × alto, su = destra × avanti.
  const forward = normalize3([-direction[0], -direction[1], -direction[2]]);
  const right = normalize3([-forward[2], 0, forward[0]]);
  const up = cross3(right, forward);
  const eye: Vec3Tuple = [
    target[0] - forward[0] * distance,
    target[1] - forward[1] * distance,
    target[2] - forward[2] * distance,
  ];

  let minY = Infinity;
  let maxY = -Infinity;
  let maxX = 0;
  for (const height of [restHeight, restHeight + apexHeight]) {
    for (let i = 0; i < FLIGHT_RIM_SAMPLES; i += 1) {
      const angle = (i / FLIGHT_RIM_SAMPLES) * TWO_PI;
      const offset: Vec3Tuple = [
        Math.cos(angle) * landingRadius - eye[0],
        height - eye[1],
        Math.sin(angle) * landingRadius - eye[2],
      ];
      const depth = dot3(offset, forward);
      if (depth <= dieRadius) return null;
      // Le due tangenti alla sfera del dado nel piano fra l'asse ottico e l'asse dato.
      const [lowY, highY] = tangentSpan(dot3(offset, up), depth, dieRadius);
      const [, highX] = tangentSpan(Math.abs(dot3(offset, right)), depth, dieRadius);
      minY = Math.min(minY, lowY);
      maxY = Math.max(maxY, highY);
      maxX = Math.max(maxX, highX);
    }
  }
  return { minY, maxY, maxX };
}

/** Tangenti dei due raggi che sfiorano la sfera; oltre i 90° dall'asse non c'è immagine. */
function tangentSpan(lateral: number, depth: number, radius: number): Vec2Tuple {
  const center = Math.atan2(lateral, depth);
  const half = Math.asin(radius / Math.hypot(lateral, depth));
  const limit = Math.PI / 2;
  return [
    center - half <= -limit ? -Infinity : Math.tan(center - half),
    center + half >= limit ? Infinity : Math.tan(center + half),
  ];
}

function dot3(a: Vec3Tuple, b: Vec3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross3(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize3(v: Vec3Tuple): Vec3Tuple {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
}

/** Avanzamento 0..1 della fase [start, end] al tempo normalizzato p. */
function phase(p: number, start: number, end: number): number {
  return clamp01((p - start) / (end - start));
}

function randomRange(random: () => number, min: number, max: number): number {
  return lerp(min, max, random());
}

function randomSign(random: () => number): number {
  return random() < 0.5 ? -1 : 1;
}

/**
 * Intensità 0..1 di una grandezza del lancio. Consuma sempre un solo valore di
 * `random`, con o senza `power`: la sequenza delle estrazioni non cambia e
 * senza `power` il piano è identico a un lancio puramente casuale.
 */
function throwStrength(random: () => number, power: number | undefined): number {
  const noise = random();
  if (power === undefined) return noise;
  return clamp01(power) * (1 - POWER_NOISE) + noise * POWER_NOISE;
}

/** Intero in [min, max] proporzionale a `strength` (0..1). */
function intFromStrength(strength: number, min: number, max: number): number {
  return Math.min(max, min + Math.floor(strength * (max - min + 1)));
}

/** Versore uniforme sulla sfera: nessun asse privilegiato, la rotazione coinvolge sempre più assi. */
function randomUnitAxis(random: () => number): Vec3Tuple {
  const y = randomRange(random, -1, 1);
  const angle = random() * TWO_PI;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  return [Math.cos(angle) * r, y, Math.sin(angle) * r];
}

const REDUCED_MOTION_TIMELINE: RollTimeline = {
  liftStart: 0.1,
  apex: 0.45,
  land: 0.8,
  bounces: [],
  settled: 0.92,
};

export function createRollPlan(options: CreateRollPlanOptions): RollPlan {
  const {
    id,
    result,
    from = [0, 0],
    reducedMotion = false,
    power,
    random = Math.random,
  } = options;
  if (!isValidD12Value(result)) {
    throw new RangeError(`Risultato d12 non valido: ${String(result)}`);
  }

  if (reducedMotion) {
    return {
      id,
      result,
      reducedMotion,
      duration: REDUCED_MOTION_ROLL_DURATION,
      apexHeight: REDUCED_MOTION_APEX_HEIGHT,
      from,
      to: from,
      spins: [],
      windUp: 0,
      yawJitter: randomRange(random, -0.15, 0.15),
      timeline: REDUCED_MOTION_TIMELINE,
    };
  }

  const apexHeight = lerp(
    APEX_HEIGHT_RANGE[0],
    APEX_HEIGHT_RANGE[1],
    throwStrength(random, power),
  );
  const landingAngle = random() * TWO_PI;
  const landingRadius = Math.sqrt(random()) * LANDING_RADIUS;
  const spins: RollSpin[] = [
    {
      axis: randomUnitAxis(random),
      turns: randomSign(random) * intFromStrength(throwStrength(random, power), 2, 3),
    },
    {
      axis: randomUnitAxis(random),
      turns: randomSign(random) * intFromStrength(throwStrength(random, power), 1, 2),
    },
  ];
  const land = 0.6;
  const duration = lerp(
    ROLL_DURATION_RANGE[0],
    ROLL_DURATION_RANGE[1],
    throwStrength(random, power),
  );

  return {
    id,
    result,
    reducedMotion,
    duration,
    apexHeight,
    from,
    to: [Math.cos(landingAngle) * landingRadius, Math.sin(landingAngle) * landingRadius],
    spins,
    windUp: 0.012,
    yawJitter: randomRange(random, -0.35, 0.35),
    timeline: {
      liftStart: 0.08,
      apex: 0.36,
      land,
      bounces: [
        { start: land, end: 0.76, height: apexHeight * 0.26 },
        { start: 0.76, end: 0.86, height: apexHeight * 0.08 },
      ],
      settled: 0.94,
    },
  };
}

/** Altezza sopra il riposo: salita decelerata, caduta accelerata, poi archi parabolici. */
function heightAt(plan: RollPlan, p: number): number {
  const { liftStart, apex, land, bounces } = plan.timeline;
  if (p < liftStart) return 0;
  if (p < apex) return plan.apexHeight * easeOutQuad(phase(p, liftStart, apex));
  if (p < land) return plan.apexHeight * (1 - easeInQuad(phase(p, apex, land)));
  for (const bounce of bounces) {
    if (p >= bounce.start && p < bounce.end) {
      const u = phase(p, bounce.start, bounce.end);
      return 4 * bounce.height * u * (1 - u);
    }
  }
  return 0;
}

/**
 * Frazione di giro compiuta. Prima del lancio un piccolo caricamento
 * all'indietro che torna a zero; poi decelerazione fino a `settled`, dove vale
 * esattamente 1 (giri interi: l'orientamento torna a quello finale).
 */
function spinProgress(plan: RollPlan, p: number): number {
  const { liftStart, settled } = plan.timeline;
  if (p < liftStart) return -plan.windUp * Math.sin(Math.PI * (p / liftStart));
  return easeOutCubic(phase(p, liftStart, settled));
}

export function evaluateRollPose(plan: RollPlan, elapsedSeconds: number): RollPose {
  const progress = clamp01(elapsedSeconds / plan.duration);
  const { liftStart, settled } = plan.timeline;
  const travel = easeOutCubic(phase(progress, liftStart, settled));
  const spin = spinProgress(plan, progress);

  return {
    x: lerp(plan.from[0], plan.to[0], travel),
    y: heightAt(plan, progress),
    z: lerp(plan.from[1], plan.to[1], travel),
    spinAngles: plan.spins.map((s) => TWO_PI * s.turns * spin),
    blend: easeInOutSine(phase(progress, liftStart, settled)),
    progress,
    done: progress >= 1,
  };
}

/**
 * Stato del lancio, indipendente dal rendering. Il componente React vi si
 * sottoscrive con `useSyncExternalStore`; la scena 3D (o un timer, senza WebGL)
 * chiama `settle` quando l'animazione è finita.
 */
export function createDiceController(options: DiceControllerOptions = {}): DiceController {
  const { initialValue, callbacks = {}, random = Math.random } = options;
  const listeners = new Set<() => void>();
  let nextPlanId = 1;
  let state: DiceControllerState = {
    rolling: false,
    result: isValidD12Value(initialValue) ? initialValue : null,
    plan: null,
    position: [0, 0],
  };

  function setState(next: DiceControllerState) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    roll(rollOptions: RollOptions = {}) {
      if (state.rolling || rollOptions.disabled) return null;
      const result = rollOptions.result ?? randomD12(random);
      if (!isValidD12Value(result)) return null;
      const plan = createRollPlan({
        id: nextPlanId++,
        result,
        from: state.position,
        reducedMotion: rollOptions.reducedMotion ?? false,
        power: rollOptions.power,
        random,
      });
      setState({ rolling: true, result: null, plan, position: state.position });
      callbacks.onRollStart?.(plan);
      callbacks.onResultChange?.(null);
      return plan;
    },
    settle(planId) {
      const plan = state.plan;
      if (!plan || plan.id !== planId) return false;
      setState({ rolling: false, result: plan.result, plan: null, position: plan.to });
      callbacks.onRollEnd?.(plan.result);
      callbacks.onResultChange?.(plan.result);
      return true;
    },
  };
}

let webglSupport: boolean | null = null;

/** Verifica una sola volta se il browser può creare un contesto WebGL. */
export function isWebGLAvailable(): boolean {
  if (webglSupport !== null) return webglSupport;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglSupport = context !== null;
    // Libera subito il contesto di prova: i browser ne limitano il numero per pagina.
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}
