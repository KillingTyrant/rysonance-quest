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
  RollOptions,
  RollPlan,
  RollPose,
  RollSpin,
  RollTimeline,
  Vec2Tuple,
  Vec3Tuple,
} from "./types";

export const D12_FACES = 12;

export const DEFAULT_DICE_APPEARANCE: DiceAppearance = {
  bodyColor: "#e8b04b",
  numberColor: "#241c14",
  edgeColor: "#8a5f14",
  floorColor: "#dcd6cb",
  roughness: 0.42,
  metalness: 0.08,
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

/** Avanzamento 0..1 della fase [start, end] al tempo normalizzato p. */
function phase(p: number, start: number, end: number): number {
  return clamp01((p - start) / (end - start));
}

function randomRange(random: () => number, min: number, max: number): number {
  return lerp(min, max, random());
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function randomSign(random: () => number): number {
  return random() < 0.5 ? -1 : 1;
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

  const apexHeight = randomRange(random, APEX_HEIGHT_RANGE[0], APEX_HEIGHT_RANGE[1]);
  const landingAngle = random() * TWO_PI;
  const landingRadius = Math.sqrt(random()) * LANDING_RADIUS;
  const spins: RollSpin[] = [
    { axis: randomUnitAxis(random), turns: randomSign(random) * randomInt(random, 2, 3) },
    { axis: randomUnitAxis(random), turns: randomSign(random) * randomInt(random, 1, 2) },
  ];
  const land = 0.6;

  return {
    id,
    result,
    reducedMotion,
    duration: randomRange(random, ROLL_DURATION_RANGE[0], ROLL_DURATION_RANGE[1]),
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
      const plan = createRollPlan({
        id: nextPlanId++,
        result: randomD12(random),
        from: state.position,
        reducedMotion: rollOptions.reducedMotion ?? false,
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
