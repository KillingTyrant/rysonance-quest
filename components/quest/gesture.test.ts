import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyGesture,
  DEFAULT_GESTURE_OPTIONS,
  type GestureSample,
} from "./gesture.ts";

/** Un tratto rettilineo campionato ogni 16 ms, come i pointermove a 60 Hz. */
function stroke(
  from: { x: number; y: number },
  to: { x: number; y: number },
  duration: number,
  start = 0,
): GestureSample[] {
  const steps = Math.max(1, Math.round(duration / 16));
  return Array.from({ length: steps + 1 }, (_, i) => ({
    x: from.x + ((to.x - from.x) * i) / steps,
    y: from.y + ((to.y - from.y) * i) / steps,
    t: start + (duration * i) / steps,
  }));
}

describe("classifyGesture", () => {
  it("senza campioni non fa nulla", () => {
    assert.deepEqual(classifyGesture([]), { kind: "none" });
  });

  it("riconosce un tocco, anche con un po' di tremolio", () => {
    assert.deepEqual(classifyGesture([{ x: 100, y: 300, t: 0 }]), { kind: "tap" });
    assert.deepEqual(
      classifyGesture(stroke({ x: 100, y: 300 }, { x: 104, y: 294 }, 120)),
      { kind: "tap" },
    );
  });

  it("una pressione troppo lunga senza movimento non lancia", () => {
    const hold = [
      { x: 100, y: 300, t: 0 },
      { x: 100, y: 300, t: DEFAULT_GESTURE_OPTIONS.tapMaxDuration + 50 },
    ];
    assert.deepEqual(classifyGesture(hold), { kind: "none" });
  });

  it("uno swipe veloce verso l'alto lancia con una forza proporzionale", () => {
    const lento = classifyGesture(stroke({ x: 100, y: 400 }, { x: 100, y: 300 }, 180));
    const rapido = classifyGesture(stroke({ x: 100, y: 400 }, { x: 110, y: 150 }, 140));
    assert.equal(lento.kind, "swipe");
    assert.equal(rapido.kind, "swipe");
    if (lento.kind !== "swipe" || rapido.kind !== "swipe") return;
    assert.ok(lento.power > 0 && lento.power < 1);
    assert.ok(rapido.power > lento.power);
  });

  it("la forza non supera 1 per quanto veloce sia il gesto", () => {
    const flick = classifyGesture(stroke({ x: 0, y: 800 }, { x: 0, y: 0 }, 48));
    assert.deepEqual(flick, { kind: "swipe", power: 1 });
  });

  it("verso il basso, di lato o troppo corto non lancia", () => {
    assert.deepEqual(
      classifyGesture(stroke({ x: 100, y: 300 }, { x: 100, y: 450 }, 120)),
      { kind: "none" },
    );
    assert.deepEqual(
      classifyGesture(stroke({ x: 100, y: 300 }, { x: 300, y: 250 }, 120)),
      { kind: "none" },
    );
    assert.deepEqual(
      classifyGesture(stroke({ x: 100, y: 300 }, { x: 100, y: 270 }, 60)),
      { kind: "none" },
    );
  });

  it("chi sale e si ferma prima di staccare il dito non lancia", () => {
    const salita = stroke({ x: 100, y: 400 }, { x: 100, y: 200 }, 150);
    const fermo = stroke({ x: 100, y: 200 }, { x: 100, y: 200 }, 200, 150).slice(1);
    assert.deepEqual(classifyGesture([...salita, ...fermo]), { kind: "none" });
  });

  it("una salita lenta, senza slancio, non lancia", () => {
    assert.deepEqual(
      classifyGesture(stroke({ x: 100, y: 400 }, { x: 100, y: 250 }, 1500)),
      { kind: "none" },
    );
  });
});
