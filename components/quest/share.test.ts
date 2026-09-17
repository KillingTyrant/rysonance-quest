import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { coverCrop, fitFontSize, modoCondivisione, nomeFileCarta } from "./share.ts";

describe("coverCrop", () => {
  it("taglia i lati quando la destinazione è più stretta della sorgente", () => {
    // 1000×1396 in 1080×1920: si scala sull'altezza e si tagliano i fianchi.
    const crop = coverCrop(1000, 1396, 1080, 1920);
    assert.equal(crop.sy, 0);
    assert.equal(crop.sh, 1396);
    assert.ok(crop.sw < 1000);
    assert.ok(Math.abs(crop.sx * 2 + crop.sw - 1000) < 1e-9, "il ritaglio è centrato");
    assert.ok(Math.abs(crop.sw / crop.sh - 1080 / 1920) < 1e-9, "stesse proporzioni della destinazione");
  });

  it("taglia sopra e sotto quando la destinazione è più larga", () => {
    const crop = coverCrop(1000, 1000, 1600, 900);
    assert.equal(crop.sx, 0);
    assert.equal(crop.sw, 1000);
    assert.ok(Math.abs(crop.sy * 2 + crop.sh - 1000) < 1e-9);
  });

  it("con le stesse proporzioni prende tutta la sorgente", () => {
    const crop = coverCrop(500, 1000, 1080, 2160);
    for (const [actual, expected] of [
      [crop.sx, 0],
      [crop.sy, 0],
      [crop.sw, 500],
      [crop.sh, 1000],
    ]) {
      assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≈ ${expected}`);
    }
  });
});

describe("fitFontSize", () => {
  const measure = (charWidth: number) => (size: number) => size * charWidth;

  it("usa la dimensione massima se il testo ci sta", () => {
    assert.equal(fitFontSize(measure(3), 900, 260, 96), 260);
  });

  it("riduce in proporzione per stare nella larghezza", () => {
    const size = fitFontSize(measure(6), 900, 260, 96);
    assert.equal(size, 150);
    assert.ok(size * 6 <= 900);
  });

  it("non scende sotto il minimo", () => {
    assert.equal(fitFontSize(measure(40), 900, 260, 96), 96);
  });
});

describe("nomeFileCarta", () => {
  it("toglie accenti e spazi", () => {
    assert.equal(nomeFileCarta("Kòren il Rosso"), "koren-il-rosso-rysonance.png");
    assert.equal(nomeFileCarta("  Eroe 4821! "), "eroe-4821-rysonance.png");
  });

  it("ha un nome di riserva se non resta nulla", () => {
    assert.equal(nomeFileCarta("★★★"), "eroe-rysonance.png");
  });
});

describe("modoCondivisione", () => {
  const data = { title: "Koren" };

  it("condivide il file solo se il browser dice di poterlo fare", () => {
    assert.equal(modoCondivisione({ share: () => {}, canShare: () => true }, data), "file");
    assert.equal(modoCondivisione({ share: () => {}, canShare: () => false }, data), "download");
  });

  it("senza Web Share scarica", () => {
    assert.equal(modoCondivisione({}, data), "download");
    assert.equal(modoCondivisione({ canShare: () => true }, data), "download");
    assert.equal(modoCondivisione(undefined, data), "download");
  });
});
