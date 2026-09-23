"use client";

import { Edges, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CanvasTexture, type Mesh, Quaternion, SRGBColorSpace, Vector3 } from "three";

import {
  ATLAS_COLUMNS,
  ATLAS_FACE_FILL,
  ATLAS_ROWS,
  createD12Geometry,
  D12_RADIUS,
  type DiceFaceMap,
  restQuaternion,
  toVector3,
} from "./dice-geometry";
import { evaluateRollPose, fitCameraDistance, LANDING_RADIUS } from "./dice-utils";
import type { DiceAppearance, DiceFloor, RollPlan, Vec2Tuple } from "./types";

export type D12SceneProps = {
  /** Piano del lancio in corso; `null` quando il dado è fermo. */
  plan: RollPlan | null;
  /** Valore da mostrare in alto finché non parte il primo lancio. */
  restValue: number | null;
  /** Posizione (x, z) in cui il dado è appoggiato. */
  restPosition: Vec2Tuple;
  /**
   * Il lancio è finito. `landing` è il centro della faccia superiore in
   * coordinate normalizzate del canvas (0..1, origine in alto a sinistra).
   */
  onRollComplete: (planId: number, landing: Vec2Tuple) => void;
  orbitControls: boolean;
  appearance: DiceAppearance;
};

// Inquadratura quasi a piombo (~74°): la faccia superiore riempie il frame, il piano si legge
// come un disco e l'apice del salto resta dentro l'inquadratura.
const CAMERA = { position: [0, 8, 2] as [number, number, number], fov: 38, near: 0.1, far: 60 };
const CAMERA_TARGET = new Vector3(0, 1.2, 0);
const CAMERA_OFFSET = new Vector3(...CAMERA.position).sub(CAMERA_TARGET);
/** Area di atterraggio più il raggio del dado e un margine: non deve mai uscire dai bordi laterali. */
const MIN_VISIBLE_HALF_WIDTH = LANDING_RADIUS + D12_RADIUS + 0.3;
const GL_OPTIONS = { antialias: true, alpha: true };
// Misure da offsetWidth/offsetHeight e non da getBoundingClientRect: se un genitore
// viene scalato o spostato da un'animazione CSS/GSAP il canvas non si ridimensiona.
const RESIZE_OPTIONS = { offsetSize: true };
const DEFAULT_REST_VALUE = 12;
const ATLAS_TILE_SIZE = 256;
/** Raggio del pentagono dentro la tessera, in frazione del lato: lo stesso delle UV. */
const FACE_RADIUS = ATLAS_FACE_FILL / 2;
/** Lato delle celle del nido d'ape, in frazione della tessera. */
const HONEYCOMB_CELL = 0.115;

export function D12Scene({
  plan,
  restValue,
  restPosition,
  onRollComplete,
  orbitControls,
  appearance,
}: D12SceneProps) {
  return (
    <Canvas
      frameloop="demand"
      shadows="percentage"
      dpr={[1, 1.5]}
      camera={CAMERA}
      gl={GL_OPTIONS}
      resize={RESIZE_OPTIONS}
      style={{ background: "transparent" }}
    >
      <CameraRig />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[3.5, 6, 4]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-far={25}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.45} />
      <Floor variant={appearance.floor} color={appearance.floorColor} />
      <Die
        plan={plan}
        restValue={restValue}
        restPosition={restPosition}
        onRollComplete={onRollComplete}
        appearance={appearance}
      />
      {orbitControls ? (
        <OrbitControls
          target={CAMERA_TARGET}
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.05}
        />
      ) : null}
    </Canvas>
  );
}

export default D12Scene;

/** Tiene la camera puntata sul bersaglio e la allontana quando il canvas è stretto e alto. */
function CameraRig() {
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    if (width <= 0 || height <= 0) return;
    const distance = fitCameraDistance({
      aspect: width / height,
      fov: CAMERA.fov,
      baseDistance: CAMERA_OFFSET.length(),
      minHalfWidth: MIN_VISIBLE_HALF_WIDTH,
    });
    camera.position.copy(CAMERA_OFFSET).setLength(distance).add(CAMERA_TARGET);
    camera.lookAt(CAMERA_TARGET);
    invalidate();
  }, [camera, width, height, invalidate]);

  return null;
}

function Floor({ variant, color }: { variant: DiceFloor; color: string }) {
  if (variant === "none") return null;
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <circleGeometry args={[4.2, 64]} />
      {variant === "shadow" ? (
        // Riceve solo l'ombra: il resto è trasparente e sotto si vede la pagina.
        <shadowMaterial transparent opacity={0.18} />
      ) : (
        <meshStandardMaterial color={color} roughness={0.95} metalness={0} />
      )}
    </mesh>
  );
}

/** Stato dell'animazione fuori da React: viene letto e scritto solo dentro `useFrame`. */
type AnimationState = {
  planId: number | null;
  startTime: number;
  completed: boolean;
  startQuaternion: Quaternion;
  finalQuaternion: Quaternion;
  spinQuaternion: Quaternion;
  spinAxis: Vector3;
  /** Appoggio per proiettare sullo schermo la faccia superiore a fine lancio. */
  landing: Vector3;
};

function createAnimationState(): AnimationState {
  return {
    planId: null,
    startTime: 0,
    completed: false,
    startQuaternion: new Quaternion(),
    finalQuaternion: new Quaternion(),
    spinQuaternion: new Quaternion(),
    spinAxis: new Vector3(),
    landing: new Vector3(),
  };
}

type DieProps = Omit<D12SceneProps, "orbitControls">;

function Die({ plan, restValue, restPosition, onRollComplete, appearance }: DieProps) {
  const meshRef = useRef<Mesh>(null);
  const animationRef = useRef<AnimationState | null>(null);
  if (animationRef.current === null) animationRef.current = createAnimationState();

  const invalidate = useThree((state) => state.invalidate);
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());

  const { geometry, faceMap } = useMemo(() => createD12Geometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const {
    bodyColor,
    numberColor,
    numberOutlineColor,
    patternColor,
    faceBorderColor,
    fontFamily,
  } = appearance;
  const texture = useMemo(
    () =>
      createNumberAtlas(faceMap, {
        bodyColor,
        numberColor,
        numberOutlineColor,
        patternColor,
        faceBorderColor,
        fontFamily,
        maxAnisotropy,
      }),
    [
      faceMap,
      bodyColor,
      numberColor,
      numberOutlineColor,
      patternColor,
      faceBorderColor,
      fontFamily,
      maxAnisotropy,
    ],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  // Posa di riposo iniziale: solo finché nessun lancio ha preso il controllo del dado.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || animationRef.current?.planId !== null) return;
    restQuaternion(faceMap, restValue ?? DEFAULT_REST_VALUE, 0, mesh.quaternion);
    mesh.position.set(restPosition[0], faceMap.inradius, restPosition[1]);
    invalidate();
  }, [faceMap, restValue, restPosition, invalidate]);

  // Con `frameloop="demand"` un nuovo piano deve chiedere esplicitamente il primo frame.
  useEffect(() => {
    if (plan) invalidate();
  }, [plan, invalidate]);

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    const animation = animationRef.current;
    if (!mesh || !animation || !plan) return;

    if (animation.planId !== plan.id) {
      animation.planId = plan.id;
      animation.startTime = performance.now();
      animation.completed = false;
      animation.startQuaternion.copy(mesh.quaternion);
      restQuaternion(faceMap, plan.result, plan.yawJitter, animation.finalQuaternion);
    }
    if (animation.completed) return;

    const pose = evaluateRollPose(plan, (performance.now() - animation.startTime) / 1000);
    mesh.position.set(pose.x, faceMap.inradius + pose.y, pose.z);

    if (pose.done) {
      mesh.quaternion.copy(animation.finalQuaternion);
      animation.completed = true;
      // A riposo il centro sta a `inradius` dal piano: la faccia superiore è
      // un altro `inradius` più su. `project` dà coordinate NDC (-1..1, y in su).
      const top = animation.landing
        .set(mesh.position.x, mesh.position.y + faceMap.inradius, mesh.position.z)
        .project(camera);
      onRollComplete(plan.id, [(top.x + 1) / 2, (1 - top.y) / 2]);
      return;
    }

    mesh.quaternion.slerpQuaternions(
      animation.startQuaternion,
      animation.finalQuaternion,
      pose.blend,
    );
    for (let i = 0; i < plan.spins.length; i += 1) {
      toVector3(plan.spins[i].axis, animation.spinAxis);
      animation.spinQuaternion.setFromAxisAngle(animation.spinAxis, pose.spinAngles[i]);
      mesh.quaternion.multiply(animation.spinQuaternion);
    }
    invalidate();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        map={texture}
        roughness={appearance.roughness}
        metalness={appearance.metalness}
      />
      <Edges threshold={20} color={appearance.edgeColor} lineWidth={1.25} />
    </mesh>
  );
}

type AtlasOptions = {
  bodyColor: string;
  numberColor: string;
  numberOutlineColor: string | null;
  patternColor: string | null;
  faceBorderColor: string | null;
  fontFamily: string;
  maxAnisotropy: number;
};

/** Disegna i dodici numeri in una griglia; ogni faccia legge la tessera del proprio valore. */
function createNumberAtlas(faceMap: DiceFaceMap, options: AtlasOptions): CanvasTexture {
  const tile = ATLAS_TILE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = tile * ATLAS_COLUMNS;
  canvas.height = tile * ATLAS_ROWS;

  const context = canvas.getContext("2d");
  if (context) {
    // Il fondo copre anche i margini fra le tessere: se un pixel di bordo viene
    // campionato per interpolazione, è comunque del colore del dado.
    context.fillStyle = options.bodyColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const face of faceMap.faces) {
      const index = face.value - 1;
      const cx = (index % ATLAS_COLUMNS + 0.5) * tile;
      const cy = (Math.floor(index / ATLAS_COLUMNS) + 0.5) * tile;
      drawFace(context, face.value, cx, cy, tile, options);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = options.maxAnisotropy;
  return texture;
}

/**
 * Una faccia: nido d'ape sul fondo, cornice scura lungo il pentagono e il numero
 * contornato sopra. Il pentagono ha un vertice in alto, come nelle UV, quindi
 * decoro e cornice cadono esattamente sugli spigoli del dado.
 */
function drawFace(
  context: CanvasRenderingContext2D,
  value: number,
  cx: number,
  cy: number,
  tile: number,
  options: AtlasOptions,
): void {
  const radius = FACE_RADIUS * tile;

  context.save();
  tracePentagon(context, cx, cy, radius);
  context.clip();

  context.fillStyle = options.bodyColor;
  context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  if (options.patternColor) {
    drawHoneycomb(context, cx, cy, radius, HONEYCOMB_CELL * tile, options.patternColor);
  }
  if (options.faceBorderColor) {
    // Tracciato dentro il clip: resta solo la metà interna, una fascia netta sul bordo.
    context.strokeStyle = options.faceBorderColor;
    context.lineWidth = tile * 0.13;
    context.lineJoin = "round";
    tracePentagon(context, cx, cy, radius);
    context.stroke();
  }
  context.restore();

  drawNumber(context, value, cx, cy, tile, options);
}

/** Pentagono regolare con un vertice in alto, come l'asse `up` della faccia. */
function tracePentagon(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  context.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

/** Reticolo di esagoni a punta in alto che copre il pentagono già ritagliato. */
function drawHoneycomb(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  cell: number,
  color: string,
): void {
  const stepX = Math.sqrt(3) * cell;
  const stepY = 1.5 * cell;
  const columns = Math.ceil(radius / stepX) + 1;
  const rows = Math.ceil(radius / stepY) + 1;

  context.strokeStyle = color;
  context.lineWidth = Math.max(1, cell * 0.16);
  context.lineJoin = "round";
  context.beginPath();
  for (let row = -rows; row <= rows; row += 1) {
    // Le righe dispari sono sfalsate di mezza cella: è quello che chiude il nido d'ape.
    const offsetX = (Math.abs(row) % 2) * (stepX / 2);
    for (let column = -columns; column <= columns; column += 1) {
      traceHexagon(context, cx + column * stepX + offsetX, cy + row * stepY, cell);
    }
  }
  context.stroke();
}

function traceHexagon(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  for (let i = 0; i < 6; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

/** Il numero, con il contorno scuro che lo stacca dal nido d'ape. */
function drawNumber(
  context: CanvasRenderingContext2D,
  value: number,
  cx: number,
  cy: number,
  tile: number,
  options: AtlasOptions,
): void {
  const baseline = cy + tile * 0.02;
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${Math.round(tile * 0.46)}px ${options.fontFamily}`;
  context.lineJoin = "round";
  context.miterLimit = 2;

  const label = String(value);
  if (options.numberOutlineColor) {
    // Il tratto è centrato sul contorno: metà finisce sotto il riempimento che segue.
    context.strokeStyle = options.numberOutlineColor;
    context.lineWidth = tile * 0.075;
    context.strokeText(label, cx, baseline);
  }
  context.fillStyle = options.numberColor;
  context.fillText(label, cx, baseline);

  // 6 e 9 si distinguono con la sottolineatura, come sui dadi reali.
  if (value === 6 || value === 9) {
    const width = tile * 0.22;
    const height = tile * 0.035;
    const x = cx - width / 2;
    const y = cy + tile * 0.24;
    if (options.numberOutlineColor) {
      context.strokeStyle = options.numberOutlineColor;
      context.lineWidth = tile * 0.06;
      context.strokeRect(x, y, width, height);
    }
    context.fillStyle = options.numberColor;
    context.fillRect(x, y, width, height);
  }
  context.restore();
}
