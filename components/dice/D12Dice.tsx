"use client";

import dynamic from "next/dynamic";
import {
  Component,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  createDiceController,
  DEFAULT_DICE_APPEARANCE,
  isWebGLAvailable,
} from "./dice-utils";
import type { D12DiceProps, DiceAppearance, ScreenPoint, Vec2Tuple } from "./types";

export type { D12DiceProps } from "./types";

/** Comandi del dado per chi lo orchestra da fuori, per esempio con un gesto. */
export type D12DiceHandle = {
  /**
   * Avvia un lancio. `result` è il valore su cui il dado deve fermarsi (se
   * manca è casuale), `power` la forza 0..1 del gesto. Restituisce `false` se
   * il lancio è rifiutato: già in corso, dado disabilitato o risultato non valido.
   */
  roll: (options?: { result?: number; power?: number }) => boolean;
};

// Il rendering WebGL è solo client: niente SSR per la scena, che porta three in un chunk separato.
const D12Scene = dynamic(() => import("./D12Scene"), {
  ssr: false,
  loading: () => <ScenePlaceholder />,
});

/** Senza WebGL, o se il timer chiude il lancio, l'atterraggio è il centro della scena. */
const SCENE_CENTER: Vec2Tuple = [0.5, 0.5];

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
  rollButton = true,
  framed = true,
  announce = true,
  appearance,
  ref,
}: D12DiceProps & { ref?: Ref<D12DiceHandle> }) {
  const mountedRef = useRef(false);
  const callbacksRef = useRef({ onRollStart, onRollEnd, onResultChange });
  useEffect(() => {
    callbacksRef.current = { onRollStart, onRollEnd, onResultChange };
  });

  const sceneFrameRef = useRef<HTMLDivElement>(null);
  // Dove si è fermato l'ultimo lancio, in pixel del viewport. Lo scrive `settleAt`
  // subito prima di chiudere il lancio, e lo legge la callback `onRollEnd`.
  const landingRef = useRef<ScreenPoint>({ x: 0, y: 0 });

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
          if (mountedRef.current) callbacksRef.current.onRollEnd?.(result, landingRef.current);
        },
        onResultChange: (result) => {
          if (mountedRef.current) callbacksRef.current.onResultChange?.(result);
        },
      },
    }),
  );

  // Layout effect e non effect: deve precedere quello che, quando la pagina torna
  // visibile, chiude il lancio rimasto in volo — altrimenti le callback tacerebbero.
  useLayoutEffect(() => {
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

  /** Chiude il lancio convertendo l'atterraggio dal riquadro della scena al viewport. */
  const settleAt = useCallback(
    (planId: number, landing: Vec2Tuple) => {
      const rect = sceneFrameRef.current?.getBoundingClientRect();
      if (rect) {
        landingRef.current = {
          x: rect.left + landing[0] * rect.width,
          y: rect.top + landing[1] * rect.height,
        };
      }
      controller.settle(planId);
    },
    [controller],
  );

  const roll = useCallback(
    (options: { result?: number; power?: number } = {}) =>
      controller.roll({ ...options, disabled, reducedMotion }),
    [controller, disabled, reducedMotion],
  );

  useImperativeHandle(ref, () => ({ roll: (options) => roll(options) !== null }), [roll]);

  // Con cacheComponents Next nasconde le pagine con <Activity> invece di smontarle.
  // Nascondendo, il Canvas smonta il renderer e perde il contesto WebGL; tornando
  // visibile riuserebbe quello vecchio e la scena resterebbe vuota. Quindi al ritorno
  // si rimonta con una key nuova, e il lancio rimasto in volo si chiude subito.
  const [sceneKey, setSceneKey] = useState(0);
  const hiddenRef = useRef(false);
  useLayoutEffect(() => {
    if (hiddenRef.current) {
      hiddenRef.current = false;
      const { plan } = controller.getState();
      if (plan) settleAt(plan.id, SCENE_CENTER);
      setSceneKey((key) => key + 1);
    }
    return () => {
      hiddenRef.current = true;
    };
  }, [controller, settleAt]);

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
    const timer = window.setTimeout(
      () => settleAt(plan.id, SCENE_CENTER),
      plan.duration * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [showFallback, plan, settleAt]);

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
        ref={sceneFrameRef}
        role="img"
        aria-label={sceneLabel}
        className={cn(
          "relative w-full",
          framed && "overflow-hidden rounded-xl border from-muted/40 to-muted",
          fill ? "min-h-64 flex-1" : "aspect-[4/3]",
        )}
      >
        {showFallback ? (
          <DiceFallback rolling={rolling} result={result} />
        ) : webgl === "available" ? (
          <div key={sceneKey} className="absolute inset-0">
            <SceneErrorBoundary
              fallback={<DiceFallback rolling={rolling} result={result} />}
              onError={() => setSceneFailed(true)}
            >
              <D12Scene
                plan={plan}
                restValue={result}
                restPosition={state.position}
                onRollComplete={settleAt}
                orbitControls={orbitControls}
                appearance={mergedAppearance}
              />
            </SceneErrorBoundary>
          </div>
        ) : (
          <ScenePlaceholder />
        )}
      </div>

      {announce && (
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {statusText}
        </p>
      )}

      {rollButton && (
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
      )}
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
