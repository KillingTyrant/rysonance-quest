import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { statoPass } from "./stato-pass.ts";

const ADESSO = new Date("2026-09-26T18:00:00+02:00");

describe("statoPass", () => {
  it("è valido senza scadenza e senza annullamento", () => {
    assert.equal(statoPass({ voided: false, expiration_date: null }, ADESSO), "valido");
  });

  it("è valido se la scadenza è nel futuro", () => {
    const pass = { voided: false, expiration_date: "2026-09-27T00:00:00+00:00" };
    assert.equal(statoPass(pass, ADESSO), "valido");
  });

  it("è scaduto se la scadenza è passata, anche con un fuso diverso", () => {
    // 15:59 UTC sono le 17:59 a Roma: un minuto prima di ADESSO.
    const pass = { voided: false, expiration_date: "2026-09-26T15:59:00+00:00" };
    assert.equal(statoPass(pass, ADESSO), "scaduto");
  });

  it("è scaduto nell'istante esatto della scadenza", () => {
    const pass = { voided: false, expiration_date: ADESSO.toISOString() };
    assert.equal(statoPass(pass, ADESSO), "scaduto");
  });

  it("l'annullamento vince sulla scadenza", () => {
    assert.equal(statoPass({ voided: true, expiration_date: null }, ADESSO), "annullato");
    const scaduto = { voided: true, expiration_date: "2020-01-01T00:00:00Z" };
    assert.equal(statoPass(scaduto, ADESSO), "annullato");
  });
});
