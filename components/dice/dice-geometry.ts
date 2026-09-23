/**
 * Geometria del d12 con three: mappa valore → faccia, UV per l'atlante dei
 * numeri e orientamento di riposo che porta davvero la faccia del risultato in
 * alto. Nessuna dipendenza da React o dal DOM, così è verificabile in Node.
 */

import {
  BufferAttribute,
  type BufferGeometry,
  DodecahedronGeometry,
  Quaternion,
  Vector3,
} from "three";

import type { Vec3Tuple } from "./types";

/** Raggio circoscritto del dado in unità mondo. */
export const D12_RADIUS = 0.8;
export const ATLAS_COLUMNS = 4;
export const ATLAS_ROWS = 3;
/**
 * Quanto della tessera dell'atlante copre il pentagono, da vertice a vertice:
 * il resto è margine contro il sanguinamento fra tessere. Lo usa anche chi
 * disegna l'atlante, per far coincidere decori e cornice con i bordi reali.
 */
export const ATLAS_FACE_FILL = 0.96;

// Ridefinito invece di importare `D12_FACES`: i test Node caricano questo modulo direttamente.
const FACE_COUNT = 12;
/** `DodecahedronGeometry` con detail 0: ogni pentagono è un ventaglio di 3 triangoli, 9 vertici. */
const VERTICES_PER_FACE = 9;
const PENTAGON_VERTICES = 5;
const UP = new Vector3(0, 1, 0);
/** Direzione opposta alla camera: l'"alto" del numero punta qui, così si legge dritto. */
const AWAY_FROM_CAMERA = new Vector3(0, 0, -1);

export type DiceFace = {
  /** Posizione della faccia nella geometria (0..11). */
  index: number;
  value: number;
  normal: Vector3;
  center: Vector3;
  /** Direzione "alto" del numero, nel piano della faccia. */
  up: Vector3;
  /** Direzione "destra" del numero, vista dall'esterno. */
  right: Vector3;
  /** Distanza centro-vertice del pentagono. */
  circumradius: number;
};

export type DiceFaceMap = {
  faces: readonly DiceFace[];
  byValue: ReadonlyMap<number, DiceFace>;
  /** Distanza centro-faccia: altezza del centro quando il dado è appoggiato. */
  inradius: number;
};

export type D12Model = {
  geometry: DodecahedronGeometry;
  faceMap: DiceFaceMap;
};

export function createD12Geometry(radius = D12_RADIUS): D12Model {
  const geometry = new DodecahedronGeometry(radius, 0);
  const faceMap = buildD12FaceMap(geometry);
  assignFaceUvs(geometry, faceMap);
  return { geometry, faceMap };
}

/**
 * Ricava le 12 facce dalla geometria e assegna i valori come su un d12 reale:
 * facce opposte sommano a 13. L'assegnazione dipende solo dall'ordine dei
 * vertici di three, quindi è stabile fra un render e l'altro.
 */
export function buildD12FaceMap(geometry: BufferGeometry): DiceFaceMap {
  const position = geometry.getAttribute("position");
  if (geometry.index !== null || position.count !== FACE_COUNT * VERTICES_PER_FACE) {
    throw new Error("Serve un dodecaedro non indicizzato con detail 0");
  }

  const unassigned = Array.from({ length: FACE_COUNT }, (_, index) => {
    const base = index * VERTICES_PER_FACE;
    // I tre triangoli condividono vertici: i 5 distinti, nell'ordine del buffer, sono il pentagono.
    const vertices: Vector3[] = [];
    for (let i = 0; i < VERTICES_PER_FACE; i += 1) {
      const vertex = new Vector3().fromBufferAttribute(position, base + i);
      if (!vertices.some((known) => known.distanceToSquared(vertex) < 1e-10)) {
        vertices.push(vertex);
      }
    }
    if (vertices.length !== PENTAGON_VERTICES) {
      throw new Error(`La faccia ${index} non è un pentagono`);
    }
    const center = vertices
      .reduce((sum, vertex) => sum.add(vertex), new Vector3())
      .divideScalar(vertices.length);
    const normal = new Vector3()
      .subVectors(vertices[1], vertices[0])
      .cross(new Vector3().subVectors(vertices[2], vertices[0]))
      .normalize();
    if (normal.dot(center) < 0) normal.negate();
    const up = new Vector3().subVectors(vertices[0], center).normalize();
    // u = v × n: con n verso l'osservatore, "destra" è a destra e il numero non è specchiato.
    const right = new Vector3().crossVectors(up, normal).normalize();
    return { index, normal, center, up, right, circumradius: vertices[0].distanceTo(center) };
  });

  const values = new Array<number>(FACE_COUNT).fill(0);
  let nextValue = 1;
  for (let index = 0; index < FACE_COUNT; index += 1) {
    if (values[index] !== 0) continue;
    const opposite = unassigned.findIndex(
      (face, other) => other !== index && face.normal.dot(unassigned[index].normal) < -0.999,
    );
    if (opposite < 0) throw new Error(`Faccia ${index} senza faccia opposta`);
    values[index] = nextValue;
    values[opposite] = FACE_COUNT + 1 - nextValue;
    nextValue += 1;
  }

  const faces = unassigned.map((face) => ({ ...face, value: values[face.index] }));
  return {
    faces,
    byValue: new Map(faces.map((face) => [face.value, face])),
    inradius: faces[0].center.length(),
  };
}

/**
 * Riscrive le UV così che ogni faccia copra la tessera del proprio valore in un
 * atlante `columns × rows`. `fill` lascia un margine per evitare sanguinamenti.
 */
export function assignFaceUvs(
  geometry: BufferGeometry,
  faceMap: DiceFaceMap,
  columns = ATLAS_COLUMNS,
  rows = ATLAS_ROWS,
  fill = ATLAS_FACE_FILL,
): void {
  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);
  const offset = new Vector3();

  for (const face of faceMap.faces) {
    const tile = face.value - 1;
    const column = tile % columns;
    const row = Math.floor(tile / columns);
    const scale = fill / (2 * face.circumradius);
    for (let i = 0; i < VERTICES_PER_FACE; i += 1) {
      const index = face.index * VERTICES_PER_FACE + i;
      offset.fromBufferAttribute(position, index).sub(face.center);
      const dx = offset.dot(face.right) * scale;
      const dy = offset.dot(face.up) * scale;
      // La texture da canvas ha l'origine in alto a sinistra e three la capovolge (flipY):
      // dy positivo deve salire nell'immagine, quindi v cresce.
      uv[index * 2] = (column + 0.5 + dx) / columns;
      uv[index * 2 + 1] = 1 - (row + 0.5 - dy) / rows;
    }
  }

  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
}

/** Angolo con segno, attorno a +Y, che porta `from` su `to` (entrambi nel piano XZ). */
function signedAngleAroundY(from: Vector3, to: Vector3): number {
  return Math.atan2(from.z * to.x - from.x * to.z, from.x * to.x + from.z * to.z);
}

/**
 * Orientamento di riposo con la faccia `value` rivolta verso l'alto e il numero
 * leggibile dalla camera, più una rotazione extra `yawJitter` attorno alla verticale.
 */
export function restQuaternion(
  faceMap: DiceFaceMap,
  value: number,
  yawJitter = 0,
  target = new Quaternion(),
): Quaternion {
  const face = faceMap.byValue.get(value);
  if (!face) throw new RangeError(`Nessuna faccia con valore ${String(value)}`);

  target.setFromUnitVectors(face.normal, UP);
  const upInWorld = face.up.clone().applyQuaternion(target);
  const yaw = signedAngleAroundY(upInWorld, AWAY_FROM_CAMERA) + yawJitter;
  return target.premultiply(new Quaternion().setFromAxisAngle(UP, yaw));
}

export function toVector3(tuple: Vec3Tuple, target = new Vector3()): Vector3 {
  return target.set(tuple[0], tuple[1], tuple[2]);
}
