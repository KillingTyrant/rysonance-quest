import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  initialQuestState,
  questReducer,
  type QuestEvent,
  type QuestState,
} from "./quest-machine.ts";

function run(state: QuestState, ...events: QuestEvent[]): QuestState {
  return events.reduce(questReducer, state);
}

describe("initialQuestState", () => {
  it("senza numero parte dal dado", () => {
    assert.deepEqual(initialQuestState(null), {
      step: "dado",
      numero: null,
      lancio: "fermo",
      forza: null,
      errore: null,
    });
  });

  it("con il numero già estratto riparte dalle istruzioni", () => {
    const state = initialQuestState(7);
    assert.equal(state.step, "istruzioni");
    assert.equal(state.numero, 7);
  });

  it("ignora un numero non valido", () => {
    for (const numero of [0, 13, 4.5]) {
      assert.equal(initialQuestState(numero).step, "dado");
      assert.equal(initialQuestState(numero).numero, null);
    }
  });
});

describe("questReducer", () => {
  it("percorre tutta la quest nell'ordine previsto", () => {
    let state = initialQuestState(null);

    state = questReducer(state, { type: "gesto", forza: 0.8 });
    assert.equal(state.lancio, "in-attesa");
    assert.equal(state.forza, 0.8);

    state = questReducer(state, { type: "numero", numero: 5 });
    assert.equal(state.lancio, "in-volo");
    assert.equal(state.numero, 5);
    assert.equal(state.step, "dado");

    state = questReducer(state, { type: "atterrato" });
    assert.equal(state.step, "risultato");
    assert.equal(state.lancio, "fermo");

    state = run(state, { type: "continua" }, { type: "godi" });
    assert.equal(state.step, "carta");
    assert.equal(state.numero, 5);
  });

  it("un secondo gesto durante il lancio non cambia nulla", () => {
    const attesa = run(initialQuestState(null), { type: "gesto", forza: null });
    assert.equal(questReducer(attesa, { type: "gesto", forza: 1 }), attesa);

    const volo = questReducer(attesa, { type: "numero", numero: 2 });
    assert.equal(questReducer(volo, { type: "gesto", forza: 1 }), volo);
  });

  it("con il numero già estratto il dado non si rilancia", () => {
    const state = { ...initialQuestState(9), step: "dado" as const };
    assert.equal(questReducer(state, { type: "gesto", forza: null }), state);
  });

  it("dopo un errore si può ritentare, e l'errore sparisce", () => {
    const errore = run(
      initialQuestState(null),
      { type: "gesto", forza: 0.4 },
      { type: "errore", messaggio: "Il server non risponde." },
    );
    assert.equal(errore.lancio, "errore");
    assert.equal(errore.errore, "Il server non risponde.");
    assert.equal(errore.forza, null);

    const ritento = questReducer(errore, { type: "gesto", forza: 0.6 });
    assert.equal(ritento.lancio, "in-attesa");
    assert.equal(ritento.errore, null);
  });

  it("ignora risposte fuori tempo e numeri non validi", () => {
    const fermo = initialQuestState(null);
    assert.equal(questReducer(fermo, { type: "numero", numero: 3 }), fermo);
    assert.equal(questReducer(fermo, { type: "errore", messaggio: "x" }), fermo);
    assert.equal(questReducer(fermo, { type: "atterrato" }), fermo);

    const attesa = questReducer(fermo, { type: "gesto", forza: null });
    assert.equal(questReducer(attesa, { type: "numero", numero: 13 }), attesa);
    assert.equal(questReducer(attesa, { type: "atterrato" }), attesa);
  });

  it("Continua e Godi l'evento valgono solo nel loro step", () => {
    const dado = initialQuestState(null);
    assert.equal(questReducer(dado, { type: "continua" }), dado);
    assert.equal(questReducer(dado, { type: "godi" }), dado);

    const istruzioni = initialQuestState(4);
    assert.equal(questReducer(istruzioni, { type: "continua" }), istruzioni);

    const carta = questReducer(istruzioni, { type: "godi" });
    assert.equal(carta.step, "carta");
    assert.equal(questReducer(carta, { type: "godi" }), carta);
  });
});
