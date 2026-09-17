"use client";

import { ChevronUp } from "lucide-react";
import { type Dispatch, useEffect, useRef } from "react";

import { lanciaDado } from "@/app/(protected)/quest/actions";
import { D12Dice, type D12DiceHandle } from "@/components/dice/D12Dice";
import type { DiceAppearance, ScreenPoint } from "@/components/dice/types";
import { gsap, SplitText, useGSAP } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { Button } from "@/components/ui/button";

import { QUEST_COPY } from "./copy";
import { DadoGesto } from "./dado-gesto";
import { QuestHeader } from "./quest-header";
import type { QuestEvent, QuestState } from "./quest-machine";

/** Il dado del mockup: grigio chiaro, numeri scuri, appoggiato sulla pagina. */
const DADO_APPEARANCE: Partial<DiceAppearance> = {
  bodyColor: "#e7e5e4",
  numberColor: "#1c1917",
  edgeColor: "#a8a29e",
  floor: "shadow",
  roughness: 0.6,
};

/** Oltre questo tempo senza risposta il lancio si considera fallito, e si può ritentare. */
const LANCIO_TIMEOUT_MS = 10_000;
const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const RIDOTTO = "(prefers-reduced-motion: reduce)";

function entro<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

type DadoStageProps = {
  /** `false` quando il dado è atterrato e la quest è passata al risultato. */
  attivo: boolean;
  personaggioId: string;
  state: QuestState;
  dispatch: Dispatch<QuestEvent>;
  /** Il dado si è fermato sul numero; `landing` è la sua faccia superiore nel viewport. */
  onAtterrato: (landing: ScreenPoint) => void;
};

/**
 * "Lancia il dado": titolo, suggerimento del gesto e il d12 3D.
 *
 * Il numero lo estrae il server al rilascio del gesto; nell'attesa il dado si
 * carica verso l'alto e freme, e quando il numero arriva parte il lancio 3D che
 * atterra proprio lì. Lo stato del lancio sta nel reducer della quest: questo
 * componente traduce i gesti in eventi e gli stati in animazioni.
 *
 * Tre contenitori annidati, ognuno con un solo padrone delle trasformazioni:
 * `stage` per l'entrata, `float` per la fluttuazione a riposo, `press` per il
 * dito e l'attesa. Così le animazioni non si pestano i piedi.
 */
export function DadoStage({
  attivo,
  personaggioId,
  state,
  dispatch,
  onAtterrato,
}: DadoStageProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<HTMLDivElement>(null);
  const diceRef = useRef<D12DiceHandle>(null);
  const floatTweenRef = useRef<gsap.core.Tween | null>(null);
  const attesaRef = useRef<gsap.core.Timeline | null>(null);
  const tentativoRef = useRef(0);
  const lanciatoRef = useRef(false);
  const attivoPrecedenteRef = useRef(attivo);
  const reducedMotion = useReducedMotion();

  const pronto =
    state.numero === null && (state.lancio === "fermo" || state.lancio === "errore");

  // Entrata: il titolo sale riga per riga da dietro una maschera, poi il
  // sottotitolo e il dado. Con "riduci movimento" gli elementi sono già visibili
  // (`motion-reduce:opacity-100`) e qui non succede nulla.
  const { contextSafe } = useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.set([titleRef.current, subtitleRef.current, stageRef.current], { opacity: 1 });
        SplitText.create(titleRef.current, {
          type: "lines",
          mask: "lines",
          // Il font arriva con `display: swap`: quando cambia, le righe si ricalcolano.
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 100,
              duration: 0.7,
              stagger: 0.08,
              delay: 0.1,
              ease: "power4.out",
            }),
        });
        gsap.from(subtitleRef.current, {
          opacity: 0,
          y: 12,
          duration: 0.5,
          delay: 0.45,
          ease: "power2.out",
        });
        gsap.from(stageRef.current, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          delay: 0.3,
          ease: "back.out(1.4)",
        });
      });
    },
    { scope: sectionRef },
  );

  // A riposo il dado fluttua e le frecce invitano a lanciarlo; appena parte un
  // lancio tutto si spegne (il revert riporta il dado in posizione).
  useGSAP(
    () => {
      if (!pronto) {
        gsap.to(hintRef.current, { autoAlpha: 0, duration: 0.2 });
        return;
      }
      gsap.matchMedia().add(MOTION_OK, () => {
        floatTweenRef.current = gsap.to(floatRef.current, {
          y: -6,
          duration: 1.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
        gsap.fromTo(
          gsap.utils.toArray<SVGElement>(hintRef.current?.children ?? []),
          { opacity: 0.2, y: 4 },
          {
            opacity: 1,
            y: -4,
            duration: 0.6,
            ease: "sine.inOut",
            stagger: { each: 0.15, from: "end", repeat: -1, yoyo: true },
          },
        );
      });
    },
    { scope: sectionRef, dependencies: [pronto], revertOnUpdate: true },
  );

  // Fine dell'attesa: il numero è arrivato (il dado torna giù e parte il lancio)
  // oppure il server ha fallito (il dado torna giù scuotendo la testa).
  useGSAP(
    () => {
      if (state.lancio !== "in-volo" && state.lancio !== "errore") return;
      attesaRef.current?.kill();
      const rientro = gsap.to(pressRef.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: 0.14,
        ease: "power2.in",
        overwrite: "auto",
      });
      if (state.lancio === "errore" && !reducedMotion) {
        gsap
          .timeline()
          .add(rientro)
          .fromTo(pressRef.current, { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      }
    },
    { scope: sectionRef, dependencies: [state.lancio] },
  );

  // Uscita dopo l'atterraggio: mentre il numero vola via dalla faccia del dado,
  // titolo e dado si rimpiccioliscono e svaniscono. Il logo resta: quello della
  // schermata successiva, identico, gli sta sopra. Se l'effetto si ripete senza un
  // cambio (pagina rimostrata) la schermata sparisce e basta.
  useGSAP(
    () => {
      const cambiato = attivoPrecedenteRef.current !== attivo;
      attivoPrecedenteRef.current = attivo;
      if (attivo) return;

      if (!cambiato) {
        gsap.set(sectionRef.current, { autoAlpha: 0 });
        return;
      }
      const ridotto = window.matchMedia(RIDOTTO).matches;
      gsap.to(contentRef.current, {
        autoAlpha: 0,
        scale: ridotto ? 1 : 0.92,
        duration: ridotto ? 0.2 : 0.45,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(sectionRef.current, { autoAlpha: 0 });
        },
      });
    },
    { scope: sectionRef, dependencies: [attivo] },
  );

  // Il lancio 3D parte dallo stato, non dalla risposta del server: se la pagina
  // viene nascosta e rimostrata nel frattempo, il lancio non va perso né ripetuto.
  useEffect(() => {
    if (state.lancio !== "in-volo" || state.numero === null || lanciatoRef.current) return;
    lanciatoRef.current = true;
    diceRef.current?.roll({ result: state.numero, power: state.forza ?? undefined });
  }, [state.lancio, state.numero, state.forza]);

  const inPressione = contextSafe(() => {
    if (reducedMotion) return;
    floatTweenRef.current?.pause();
    gsap.to(pressRef.current, {
      y: 6,
      scale: 0.97,
      duration: 0.15,
      ease: "power2.out",
      overwrite: "auto",
    });
  });

  // Il dado segue il dito con attrito: verso l'alto fin quasi a staccarsi, di lato appena.
  const trascina = contextSafe((dx: number, dy: number) => {
    if (reducedMotion) return;
    gsap.to(pressRef.current, {
      x: gsap.utils.clamp(-16, 16, dx * 0.15),
      y: gsap.utils.clamp(-60, 12, dy * 0.35),
      rotation: gsap.utils.clamp(-8, 8, dx * 0.06),
      duration: 0.25,
      ease: "power3.out",
      overwrite: "auto",
    });
  });

  const annulla = contextSafe(() => {
    if (reducedMotion) return;
    gsap.to(pressRef.current, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.7,
      ease: "elastic.out(1, 0.5)",
      overwrite: "auto",
    });
    floatTweenRef.current?.resume();
  });

  // Mentre il server estrae: il dado si carica verso l'alto e freme.
  const anticipa = contextSafe(() => {
    if (reducedMotion) return;
    attesaRef.current = gsap
      .timeline()
      .to(pressRef.current, {
        x: 0,
        y: -18,
        rotation: 0,
        scale: 1,
        duration: 0.16,
        ease: "power2.out",
        overwrite: "auto",
      })
      .fromTo(
        pressRef.current,
        { rotation: -2 },
        { rotation: 2, duration: 0.07, ease: "sine.inOut", yoyo: true, repeat: -1 },
      );
  });

  function lancia(forza: number | null) {
    if (!pronto) return;
    dispatch({ type: "gesto", forza });
    anticipa();

    // Una risposta arrivata dopo un nuovo tentativo non deve più contare.
    const tentativo = ++tentativoRef.current;
    entro(lanciaDado(personaggioId), LANCIO_TIMEOUT_MS)
      .then((esito) => {
        if (tentativo !== tentativoRef.current) return;
        dispatch(
          esito.ok
            ? { type: "numero", numero: esito.numero }
            : { type: "errore", messaggio: esito.message },
        );
      })
      .catch(() => {
        if (tentativo !== tentativoRef.current) return;
        dispatch({
          type: "errore",
          messaggio: "Il dado non ha risposto. Controlla la connessione e riprova.",
        });
      });
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="quest-dado-titolo"
      className="flex flex-1 flex-col"
    >
      <QuestHeader />

      <div ref={contentRef} className="flex flex-1 flex-col">
        <div className="flex flex-col gap-2 text-center">
          <h1
            id="quest-dado-titolo"
            ref={titleRef}
            data-quest-titolo
            tabIndex={-1}
            className="text-balance text-3xl font-bold leading-tight opacity-0 outline-none motion-reduce:opacity-100"
          >
            {QUEST_COPY.dado.titolo}
          </h1>
          <p
            ref={subtitleRef}
            className="text-muted-foreground opacity-0 motion-reduce:opacity-100"
          >
            {QUEST_COPY.dado.sottotitolo}
          </p>
        </div>

        <div
          ref={stageRef}
          className="relative flex min-h-80 flex-1 flex-col opacity-0 motion-reduce:opacity-100"
        >
          <div
            ref={hintRef}
            aria-hidden
            className="pointer-events-none flex flex-col items-center pt-6 text-muted-foreground"
          >
            <ChevronUp className="-mb-4 size-7" strokeWidth={2.5} />
            <ChevronUp className="-mb-4 size-7" strokeWidth={2.5} />
            <ChevronUp className="size-7" strokeWidth={2.5} />
          </div>

          <div ref={floatRef} className="relative flex flex-1 flex-col">
            <div ref={pressRef} className="relative flex flex-1 flex-col">
              <D12Dice
                ref={diceRef}
                fill
                framed={false}
                rollButton={false}
                announce={false}
                appearance={DADO_APPEARANCE}
                onRollEnd={(_, landing) => onAtterrato(landing)}
                className="max-w-none"
              />
              <DadoGesto
                disabled={!pronto}
                label={QUEST_COPY.dado.gesto}
                describedBy="quest-dado-suggerimento"
                onPress={inPressione}
                onDrag={trascina}
                onCancel={annulla}
                onThrow={lancia}
              />
            </div>
          </div>
          <p id="quest-dado-suggerimento" className="sr-only">
            {QUEST_COPY.dado.suggerimento}
          </p>
        </div>

        <div className="flex min-h-24 flex-col items-center justify-center">
          {state.lancio === "errore" && state.errore && (
            <div role="alert" className="flex flex-col items-center gap-3 text-center text-sm">
              <p className="text-destructive">{state.errore}</p>
              <Button type="button" variant="ticketSecondary" onClick={() => lancia(null)}>
                {QUEST_COPY.dado.riprova}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
