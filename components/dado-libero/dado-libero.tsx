"use client";

import { ChevronUp } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { D12Dice, type D12DiceHandle } from "@/components/dice/D12Dice";
import type { DiceAppearance } from "@/components/dice/types";
import { gsap, SplitText, useGSAP } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { DadoGesto } from "@/components/quest/dado-gesto";
import { Button } from "@/components/ui/button";

/** Lo stesso dado della quest: grigio chiaro, numeri scuri, appoggiato sulla pagina. */
const DADO_APPEARANCE: Partial<DiceAppearance> = {
  bodyColor: "#e7e5e4",
  numberColor: "#1c1917",
  edgeColor: "#a8a29e",
  floor: "shadow",
  roughness: 0.6,
};

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * Il d12 da provare senza account. Il numero lo sceglie il dado stesso nel
 * browser: nessuna chiamata al server, niente da salvare. Si lancia con uno
 * swipe verso l'alto, un tocco, Invio o Spazio, quante volte si vuole.
 *
 * Le animazioni sono quelle della quest (`DadoStage`), senza l'attesa del
 * server: al rilascio il dado torna in posizione e parte subito. Tre
 * contenitori annidati, ognuno con un solo padrone delle trasformazioni:
 * `stage` per l'entrata, `float` per la fluttuazione a riposo, `press` per il dito.
 */
export function DadoLibero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<HTMLDivElement>(null);
  const esitoRef = useRef<HTMLDivElement>(null);
  const diceRef = useRef<D12DiceHandle>(null);
  const floatTweenRef = useRef<gsap.core.Tween | null>(null);
  const reducedMotion = useReducedMotion();

  const [rolling, setRolling] = useState(false);
  const [risultato, setRisultato] = useState<number | null>(null);
  const [lanci, setLanci] = useState(0);
  const pronto = !rolling;

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

  // A ogni atterraggio l'esito sale e compare.
  useGSAP(
    () => {
      if (lanci === 0) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from(esitoRef.current?.children ?? [], {
          opacity: 0,
          y: 16,
          scale: 0.96,
          duration: 0.5,
          stagger: 0.08,
          ease: "back.out(1.6)",
        });
      });
    },
    { scope: sectionRef, dependencies: [lanci], revertOnUpdate: true },
  );

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

  // Al rilascio il dado torna di scatto in posizione mentre parte il lancio 3D.
  const lancia = contextSafe((forza: number | null) => {
    if (!pronto) return;
    gsap.to(pressRef.current, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: reducedMotion ? 0 : 0.14,
      ease: "power2.in",
      overwrite: "auto",
    });
    diceRef.current?.roll({ power: forza ?? undefined });
  });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="dado-titolo"
      className="flex flex-1 flex-col"
    >
      <div className="flex flex-col gap-2 text-center">
        <h1
          id="dado-titolo"
          ref={titleRef}
          className="text-balance text-3xl font-bold leading-tight opacity-0 motion-reduce:opacity-100"
        >
          Tenta la sorte con il d12
        </h1>
        <p
          ref={subtitleRef}
          className="text-muted-foreground opacity-0 motion-reduce:opacity-100"
        >
          Lancia il dado e scopri il tuo numero
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
              onRollStart={() => setRolling(true)}
              onRollEnd={(result) => {
                setRolling(false);
                setRisultato(result);
                setLanci((n) => n + 1);
              }}
              className="max-w-none"
            />
            <DadoGesto
              disabled={!pronto}
              label="Lancia il dado"
              describedBy="dado-suggerimento"
              onPress={inPressione}
              onDrag={trascina}
              onCancel={annulla}
              onThrow={lancia}
            />
          </div>
        </div>
        <p id="dado-suggerimento" className="sr-only">
          Scorri verso l&apos;alto sul dado, oppure toccalo
        </p>
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {rolling ? "Il dado rotola…" : risultato !== null ? `È uscito il ${risultato}` : ""}
      </p>

      <div
        ref={esitoRef}
        className="flex min-h-44 flex-col items-center justify-start gap-4 text-center"
      >
        {risultato !== null && !rolling && (
          <>
            <p aria-hidden className="text-2xl font-bold">
              È uscito il {risultato}!
            </p>
            <p className="text-balance text-sm text-muted-foreground">
              In Rysonance il dado decide la tua quest. Crea il tuo personaggio e
              scopri dove ti porta.
            </p>
            <Button asChild variant="ticket" className="w-52">
              <Link href="/auth/sign-up">Crea il tuo personaggio</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
