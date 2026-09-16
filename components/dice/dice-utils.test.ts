import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import {
  createDiceController,
  createRollPlan,
  evaluateRollPose,
  fitCameraDistance,
  isValidD12Value,
  randomD12,
  REDUCED_MOTION_ROLL_DURATION,
  ROLL_DURATION_RANGE,
} from "./dice-utils.ts";
import type { RollPlan } from "./types.ts";

/** Generatore deterministico (LCG) per rendere riproducibili i piani di lancio. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe("randomD12", () => {
  it("restituisce sempre un intero fra 1 e 12", () => {
    for (let i = 0; i < 2000; i += 1) {
      const value = randomD12();
      assert.ok(Number.isInteger(value));
      assert.ok(value >= 1 && value <= 12);
    }
  });

  it("copre entrambi gli estremi in base al generatore", () => {
    assert.equal(randomD12(() => 0), 1);
    assert.equal(randomD12(() => 0.999999), 12);
  });
});

describe("isValidD12Value", () => {
  it("accetta solo interi fra 1 e 12", () => {
    for (let value = 1; value <= 12; value += 1) {
      assert.equal(isValidD12Value(value), true);
    }
    for (const bad of [0, 13, -1, 6.5, NaN, Infinity, "7", null, undefined, {}, true]) {
      assert.equal(isValidD12Value(bad), false, `${String(bad)} non dovrebbe essere valido`);
    }
  });
});

describe("createRollPlan / evaluateRollPose", () => {
  it("è deterministico dato lo stesso generatore", () => {
    const a = createRollPlan({ id: 1, result: 7, random: seededRandom(42) });
    const b = createRollPlan({ id: 1, result: 7, random: seededRandom(42) });
    assert.deepEqual(a, b);
  });

  it("rifiuta risultati non validi", () => {
    assert.throws(() => createRollPlan({ id: 1, result: 13 }), RangeError);
  });

  it("dura fra 1.5 e 2.2 secondi, parte fermo e arriva fermo con giri interi", () => {
    const plan = createRollPlan({ id: 1, result: 3, random: seededRandom(7) });
    assert.ok(plan.duration >= ROLL_DURATION_RANGE[0] && plan.duration <= ROLL_DURATION_RANGE[1]);
    assert.ok(plan.duration >= 1.5 && plan.duration <= 2.2);

    const start = evaluateRollPose(plan, 0);
    assert.equal(start.y, 0);
    assert.equal(start.blend, 0);
    assert.equal(start.done, false);
    assert.deepEqual([start.x, start.z], [...plan.from]);

    const end = evaluateRollPose(plan, plan.duration + 1);
    assert.equal(end.done, true);
    assert.equal(end.y, 0);
    assert.equal(end.blend, 1);
    assert.deepEqual([end.x, end.z], [...plan.to]);
    for (const angle of end.spinAngles) {
      const turns = angle / (Math.PI * 2);
      assert.ok(Math.abs(turns - Math.round(turns)) < 1e-9, "i giri finali devono essere interi");
    }
  });

  it("salta, ricade e rimbalza restando sempre sopra il piano", () => {
    const plan = createRollPlan({ id: 1, result: 3, random: seededRandom(99) });
    const { timeline } = plan;

    const apex = evaluateRollPose(plan, timeline.apex * plan.duration);
    assert.ok(Math.abs(apex.y - plan.apexHeight) < 1e-9);
    const landing = evaluateRollPose(plan, timeline.land * plan.duration);
    assert.ok(Math.abs(landing.y) < 1e-9);

    const bounce = timeline.bounces[0];
    const midBounce = evaluateRollPose(plan, ((bounce.start + bounce.end) / 2) * plan.duration);
    assert.ok(Math.abs(midBounce.y - bounce.height) < 1e-9);
    assert.ok(bounce.height < plan.apexHeight);

    for (let t = 0; t <= plan.duration; t += plan.duration / 200) {
      const pose = evaluateRollPose(plan, t);
      assert.ok(pose.y >= -1e-9);
      assert.ok([pose.x, pose.y, pose.z, pose.blend, ...pose.spinAngles].every(Number.isFinite));
    }
  });

  it("con movimento ridotto è breve, senza giri né rimbalzi", () => {
    const plan = createRollPlan({ id: 2, result: 5, reducedMotion: true, from: [0.2, -0.1] });
    assert.equal(plan.duration, REDUCED_MOTION_ROLL_DURATION);
    assert.equal(plan.spins.length, 0);
    assert.equal(plan.timeline.bounces.length, 0);
    assert.deepEqual(plan.to, plan.from);
    assert.ok(plan.apexHeight < 0.3);
    assert.equal(evaluateRollPose(plan, plan.duration).done, true);
  });
});

describe("fitCameraDistance", () => {
  const options = { fov: 38, baseDistance: 6.5, minHalfWidth: 1.65 };

  it("resta alla distanza di riferimento nei canvas larghi", () => {
    assert.equal(fitCameraDistance({ ...options, aspect: 4 / 3 }), options.baseDistance);
    assert.equal(fitCameraDistance({ ...options, aspect: 2.5 }), options.baseDistance);
  });

  it("arretra nei canvas stretti fino a mostrare la semi-larghezza richiesta", () => {
    const aspect = 0.56;
    const distance = fitCameraDistance({ ...options, aspect });
    assert.ok(distance > options.baseDistance);

    const halfWidth = Math.tan((options.fov * Math.PI) / 360) * aspect * distance;
    assert.ok(Math.abs(halfWidth - options.minHalfWidth) < 1e-9);
  });
});

describe("createDiceController", () => {
  it("usa initialValue solo se valido", () => {
    assert.equal(createDiceController({ initialValue: 9 }).getState().result, 9);
    assert.equal(createDiceController({ initialValue: 0 }).getState().result, null);
    assert.equal(createDiceController({ initialValue: 4.5 }).getState().result, null);
    assert.equal(createDiceController().getState().result, null);
  });

  it("chiama onRollStart e azzera il risultato all'inizio del lancio", () => {
    const onRollStart = mock.fn<(plan: RollPlan) => void>();
    const onResultChange = mock.fn<(result: number | null) => void>();
    const controller = createDiceController({
      initialValue: 3,
      callbacks: { onRollStart, onResultChange },
    });

    const plan = controller.roll();
    assert.ok(plan);
    assert.equal(onRollStart.mock.callCount(), 1);
    assert.equal(onRollStart.mock.calls[0].arguments[0], plan);
    assert.deepEqual(onResultChange.mock.calls[0].arguments, [null]);

    const state = controller.getState();
    assert.equal(state.rolling, true);
    assert.equal(state.result, null);
    assert.equal(state.plan, plan);
  });

  it("impedisce un secondo lancio mentre il primo è in corso", () => {
    const onRollStart = mock.fn<() => void>();
    const controller = createDiceController({ callbacks: { onRollStart } });

    const first = controller.roll();
    assert.ok(first);
    assert.equal(controller.roll(), null);
    assert.equal(onRollStart.mock.callCount(), 1);

    controller.settle(first.id);
    assert.ok(controller.roll(), "dopo lo stop si può rilanciare");
    assert.equal(onRollStart.mock.callCount(), 2);
  });

  it("chiama onRollEnd con un intero fra 1 e 12 solo quando il dado si ferma", () => {
    const onRollEnd = mock.fn<(result: number) => void>();
    const onResultChange = mock.fn<(result: number | null) => void>();
    const controller = createDiceController({ callbacks: { onRollEnd, onResultChange } });

    const plan = controller.roll();
    assert.ok(plan);
    assert.equal(onRollEnd.mock.callCount(), 0);

    assert.equal(controller.settle(plan.id), true);
    assert.equal(onRollEnd.mock.callCount(), 1);
    const [result] = onRollEnd.mock.calls[0].arguments;
    assert.ok(isValidD12Value(result));
    assert.equal(result, plan.result);
    assert.deepEqual(onResultChange.mock.calls.at(-1)?.arguments, [result]);

    const state = controller.getState();
    assert.equal(state.rolling, false);
    assert.equal(state.result, result);
    assert.equal(state.plan, null);
    assert.deepEqual(state.position, plan.to);
  });

  it("ignora settle con un id non attivo", () => {
    const onRollEnd = mock.fn<(result: number) => void>();
    const controller = createDiceController({ callbacks: { onRollEnd } });
    assert.equal(controller.settle(1), false);

    const plan = controller.roll();
    assert.ok(plan);
    assert.equal(controller.settle(plan.id + 1), false);
    assert.equal(onRollEnd.mock.callCount(), 0);
    assert.equal(controller.getState().rolling, true);
  });

  it("con disabled rifiuta il lancio senza chiamare callback", () => {
    const onRollStart = mock.fn<() => void>();
    const onResultChange = mock.fn<(result: number | null) => void>();
    const controller = createDiceController({
      initialValue: 8,
      callbacks: { onRollStart, onResultChange },
    });

    assert.equal(controller.roll({ disabled: true }), null);
    assert.equal(onRollStart.mock.callCount(), 0);
    assert.equal(onResultChange.mock.callCount(), 0);
    assert.deepEqual(controller.getState(), {
      rolling: false,
      result: 8,
      plan: null,
      position: [0, 0],
    });
  });

  it("propaga reducedMotion al piano e notifica i sottoscrittori", () => {
    const controller = createDiceController();
    const listener = mock.fn<() => void>();
    const unsubscribe = controller.subscribe(listener);

    const plan = controller.roll({ reducedMotion: true });
    assert.ok(plan);
    assert.equal(plan.reducedMotion, true);
    assert.equal(listener.mock.callCount(), 1);

    unsubscribe();
    controller.settle(plan.id);
    assert.equal(listener.mock.callCount(), 1);
  });
});
