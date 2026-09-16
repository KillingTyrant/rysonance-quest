"use client";

import dynamic from "next/dynamic";
import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  createDiceController,
  DEFAULT_DICE_APPEARANCE,
  isWebGLAvailable,
} from "./dice-utils";
import type { D12DiceProps, DiceAppearance } from "./types";

export type { D12DiceProps } from "./types";

// Il rendering WebGL è solo client: niente SSR per la scena, che porta three in un chunk separato.
const D12Scene = dynamic(() => import("./D12Scene"), {
  ssr: false,
  loading: () => <ScenePlaceholder />,
});

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getServerReducedMotion = () => false;

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );
}

type WebGLSupport = "unknown" | "available" | "unavailable";

const subscribeToNothing = () => () => { };
const getWebGLSupport = (): WebGLSupport =>
  isWebGLAvailable() ? "available" : "unavailable";
const getServerWebGLSupport = (): WebGLSupport => "unknown";

/** "unknown" sul server e durante l'idratazione, così il markup iniziale coincide. */
function useWebGLSupport(): WebGLSupport {
  return useSyncExternalStore(subscribeToNothing, getWebGLSupport, getServerWebGLSupport);
}

export function D12Dice({
  className,
  disabled = false,
  autoRoll = false,
  initialValue,
  onRollStart,
  onRollEnd,
  onResultChange,
  fill = false,
  orbitControls = false,
  appearance,
}: D12DiceProps) {
  const mountedRef = useRef(false);
  const callbacksRef = useRef({ onRollStart, onRollEnd, onResultChange });
  useEffect(() => {
    callbacksRef.current = { onRollStart, onRollEnd, onResultChange };
  });

  // Il controller vive quanto il componente. Le sue callback leggono sempre le props
  // più recenti e tacciono dopo lo smontaggio.
  const [controller] = useState(() =>
    createDiceController({
      initialValue,
      callbacks: {
        onRollStart: () => {
          if (mountedRef.current) callbacksRef.current.onRollStart?.();
        },
        onRollEnd: (result) => {
          if (mountedRef.current) callbacksRef.current.onRollEnd?.(result);
        },
        onResultChange: (result) => {
          if (mountedRef.current) callbacksRef.current.onResultChange?.(result);
        },
      },
    }),
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
  const reducedMotion = useReducedMotion();
  const webgl = useWebGLSupport();
  const [sceneFailed, setSceneFailed] = useState(false);
  const showFallback = webgl === "unavailable" || sceneFailed;

  const roll = useCallback(
    () => controller.roll({ disabled, reducedMotion }),
    [controller, disabled, reducedMotion],
  );

  const autoRolledRef = useRef(false);
  useEffect(() => {
    if (!autoRoll || autoRolledRef.current) return;
    autoRolledRef.current = true;
    roll();
  }, [autoRoll, roll]);

  // Senza WebGL nessuna scena chiama `settle`: chiude il lancio un timer della stessa durata.
  const { plan, rolling, result } = state;
  useEffect(() => {
    if (!showFallback || !plan) return;
    const timer = window.setTimeout(() => controller.settle(plan.id), plan.duration * 1000);
    return () => window.clearTimeout(timer);
  }, [showFallback, plan, controller]);

  const mergedAppearance = useMemo<DiceAppearance>(
    () => ({ ...DEFAULT_DICE_APPEARANCE, ...appearance }),
    [appearance],
  );

  const handleRoll = () => {
    if (rolling) return;
    roll();
  };

  const statusText = rolling
    ? "Lancio in corso..."
    : result !== null
      ? `Risultato del lancio: ${result}`
      : "Nessun lancio effettuato.";
  const sceneLabel = rolling
    ? "Dado a dodici facce in movimento"
    : result !== null
      ? `Dado a dodici facce fermo sul ${result}`
      : "Dado a dodici facce";

  return (
    <div
      role="group"
      aria-label="Dado d12"
      aria-busy={rolling}
      className={cn(
        "flex w-full max-w-md flex-col items-center gap-4",
        fill && "flex-1",
        className,
      )}
    >
      <div
        role="img"
        aria-label={sceneLabel}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border  from-muted/40 to-muted",
          fill ? "min-h-64 flex-1" : "aspect-[4/3]",
        )}
      >
        {showFallback ? (
          <DiceFallback rolling={rolling} result={result} />
        ) : webgl === "available" ? (
          <div className="absolute inset-0">
            <SceneErrorBoundary
              fallback={<DiceFallback rolling={rolling} result={result} />}
              onError={() => setSceneFailed(true)}
            >
              <D12Scene
                plan={plan}
                restValue={result}
                restPosition={state.position}
                onRollComplete={controller.settle}
                orbitControls={orbitControls}
                appearance={mergedAppearance}
              />
            </SceneErrorBoundary>
          </div>
        ) : (
          <ScenePlaceholder />
        )}
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusText}
      </p>

      {/* <div className="flex min-h-16 flex-col items-center justify-center gap-1">
        <p aria-hidden="true" className="text-4xl font-bold leading-none tabular-nums">
          {rolling ? "…" : result ?? "–"}
        </p>
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="text-sm text-muted-foreground"
        >
          {statusText}
        </p>
      </div> */}

      <Button
        type="button"
        variant={'ticket'}
        onClick={handleRoll}
        disabled={disabled}
        aria-disabled={disabled || rolling}
        className={cn("w-full", rolling && "pointer-events-none opacity-60")}
      >
        Lancia il d12
      </Button>
    </div>
  );
}

function ScenePlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 animate-pulse bg-muted/60 motion-reduce:animate-none"
    />
  );
}

function DiceFallback({ rolling, result }: { rolling: boolean; result: number | null }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
      <div
        className={cn(
          "flex size-24 items-center justify-center rounded-2xl border-2 border-primary/40 bg-background text-4xl font-bold tabular-nums shadow-sm",
          rolling && "animate-pulse motion-reduce:animate-none",
        )}
      >
        {rolling ? "…" : result ?? "–"}
      </div>
      <p className="text-xs text-muted-foreground">
        Anteprima 3D non disponibile: questo browser non supporta WebGL.
      </p>
    </div>
  );
}

type SceneErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onError: () => void;
};

/** Se la scena WebGL fallisce a runtime, il componente ripiega sull'indicatore 2D. */
class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
