"use client";

import { type PointerEvent, useRef } from "react";

import { classifyGesture, type GestureSample } from "./gesture";

/** Campioni tenuti in memoria oltre al primo: circa mezzo secondo a 60 Hz. */
const MAX_SAMPLES = 32;

type DadoGestoProps = {
  disabled: boolean;
  label: string;
  /** Id del testo che spiega il gesto, per `aria-describedby`. */
  describedBy?: string;
  onPress: () => void;
  /** Spostamento dal punto di pressione, in pixel. */
  onDrag: (dx: number, dy: number) => void;
  /** Rilasciato senza lanciare: il dado torna a posto. */
  onCancel: () => void;
  /** Lancio: `forza` 0..1 per uno swipe, `null` per un tocco o la tastiera. */
  onThrow: (forza: number | null) => void;
};

function sample(event: PointerEvent<HTMLButtonElement>): GestureSample {
  return { x: event.clientX, y: event.clientY, t: event.timeStamp };
}

/**
 * La superficie con cui si lancia il dado: un vero `<button>` steso sopra la
 * scena. Uno swipe verso l'alto lancia con la forza del gesto, un tocco lancia
 * e basta; da tastiera Invio e Spazio fanno lo stesso, così il lancio non
 * dipende dallo swipe.
 *
 * `touch-none` impedisce che trascinando sul dado scorra la pagina; il pointer
 * capture tiene gli eventi anche quando il dito esce dal bottone, che nel
 * frattempo si sposta insieme al dado.
 */
export function DadoGesto({
  disabled,
  label,
  describedBy,
  onPress,
  onDrag,
  onCancel,
  onThrow,
}: DadoGestoProps) {
  const samplesRef = useRef<GestureSample[] | null>(null);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-describedby={describedBy}
      className="absolute inset-0 z-10 cursor-grab touch-none select-none rounded-3xl outline-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing disabled:cursor-default"
      onPointerDown={(event) => {
        if (disabled || !event.isPrimary || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        samplesRef.current = [sample(event)];
        onPress();
      }}
      onPointerMove={(event) => {
        const samples = samplesRef.current;
        if (!samples || !event.isPrimary) return;
        samples.push(sample(event));
        // Il primo campione resta: dice da dove è partito il gesto.
        if (samples.length > MAX_SAMPLES + 1) samples.splice(1, 1);
        onDrag(event.clientX - samples[0].x, event.clientY - samples[0].y);
      }}
      onPointerUp={(event) => {
        const samples = samplesRef.current;
        if (!samples || !event.isPrimary) return;
        samplesRef.current = null;
        samples.push(sample(event));
        const gesture = classifyGesture(samples);
        if (gesture.kind === "none") onCancel();
        else onThrow(gesture.kind === "swipe" ? gesture.power : null);
      }}
      onPointerCancel={() => {
        if (!samplesRef.current) return;
        samplesRef.current = null;
        onCancel();
      }}
      onClick={(event) => {
        // Invio e Spazio arrivano come click con `detail === 0`; i click del
        // puntatore li ha già gestiti pointerup.
        if (event.detail === 0) onThrow(null);
      }}
    />
  );
}
