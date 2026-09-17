import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DodecahedronGeometry, Vector3 } from "three";

import {
  assignFaceUvs,
  ATLAS_COLUMNS,
  ATLAS_ROWS,
  buildD12FaceMap,
  createD12Geometry,
  D12_RADIUS,
  restQuaternion,
} from "./dice-geometry.ts";

const UP = new Vector3(0, 1, 0);
/** Rapporto inraggio/circumraggio di un dodecaedro regolare. */
const INRADIUS_RATIO = 0.7946545;

describe("buildD12FaceMap", () => {
  const faceMap = buildD12FaceMap(new DodecahedronGeometry(1, 0));

  it("trova dodici facce con valori 1..12 tutti diversi", () => {
    assert.equal(faceMap.faces.length, 12);
    assert.deepEqual(
      [...faceMap.byValue.keys()].sort((a, b) => a - b),
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it("assegna a facce opposte valori che sommano a 13", () => {
    for (const face of faceMap.faces) {
      const opposite = faceMap.faces.find(
        (other) => other !== face && other.normal.dot(face.normal) < -0.999,
      );
      assert.ok(opposite);
      assert.equal(face.value + opposite.value, 13);
    }
  });

  it("costruisce per ogni faccia una base ortonormale destrorsa rivolta all'esterno", () => {
    for (const face of faceMap.faces) {
      assert.ok(Math.abs(face.normal.length() - 1) < 1e-6);
      assert.ok(Math.abs(face.up.dot(face.normal)) < 1e-6);
      assert.ok(Math.abs(face.right.dot(face.normal)) < 1e-6);
      assert.ok(Math.abs(face.right.dot(face.up)) < 1e-6);
      assert.ok(new Vector3().crossVectors(face.right, face.up).dot(face.normal) > 0.999);
      assert.ok(face.normal.dot(face.center) > 0);
    }
  });

  it("calcola l'inraggio del dodecaedro", () => {
    assert.ok(Math.abs(faceMap.inradius - INRADIUS_RATIO) < 1e-4);
  });

  it("rifiuta geometrie che non sono un dodecaedro a detail 0", () => {
    assert.throws(() => buildD12FaceMap(new DodecahedronGeometry(1, 1)));
  });
});

describe("restQuaternion", () => {
  const { faceMap } = createD12Geometry();

  it("porta la faccia del valore in alto, con il numero rivolto lontano dalla camera", () => {
    for (let value = 1; value <= 12; value += 1) {
      const face = faceMap.byValue.get(value);
      assert.ok(face);
      const rotation = restQuaternion(faceMap, value);

      const normal = face.normal.clone().applyQuaternion(rotation);
      assert.ok(normal.dot(UP) > 0.99999, `faccia ${value}: normale ${normal.toArray().join(",")}`);

      const up = face.up.clone().applyQuaternion(rotation);
      assert.ok(Math.abs(up.y) < 1e-6);
      assert.ok(up.z < -0.99999, `faccia ${value}: alto ${up.toArray().join(",")}`);

      for (const other of faceMap.faces) {
        if (other === face) continue;
        assert.ok(other.normal.clone().applyQuaternion(rotation).dot(UP) < 0.99);
      }
    }
  });

  it("applica lo yaw extra attorno alla verticale", () => {
    const face = faceMap.byValue.get(7);
    assert.ok(face);
    const rotation = restQuaternion(faceMap, 7, Math.PI / 2);
    assert.ok(face.normal.clone().applyQuaternion(rotation).dot(UP) > 0.99999);
    const up = face.up.clone().applyQuaternion(rotation);
    assert.ok(up.x < -0.99999 && Math.abs(up.z) < 1e-6);
  });

  it("rifiuta valori senza faccia", () => {
    assert.throws(() => restQuaternion(faceMap, 13), RangeError);
  });
});

describe("assignFaceUvs", () => {
  it("confina le UV di ogni faccia nella tessera del proprio valore", () => {
    const geometry = new DodecahedronGeometry(D12_RADIUS, 0);
    const faceMap = buildD12FaceMap(geometry);
    assignFaceUvs(geometry, faceMap);

    const uv = geometry.getAttribute("uv");
    assert.equal(uv.count, 108);
    for (const face of faceMap.faces) {
      const tile = face.value - 1;
      const column = tile % ATLAS_COLUMNS;
      const row = Math.floor(tile / ATLAS_COLUMNS);
      for (let i = 0; i < 9; i += 1) {
        const u = uv.getX(face.index * 9 + i);
        const v = uv.getY(face.index * 9 + i);
        assert.ok(u > column / ATLAS_COLUMNS && u < (column + 1) / ATLAS_COLUMNS);
        assert.ok(v > 1 - (row + 1) / ATLAS_ROWS && v < 1 - row / ATLAS_ROWS);
      }
    }
  });
});
