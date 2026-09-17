"use client";

import { useRef, useState } from "react";

import type { ScreenPoint } from "@/components/dice/types";
import { gsap, SplitText, useGSAP } from "@/components/motion/gsap";
import { Button } from "@/components/ui/button";

import { QUEST_COPY } from "./copy";
import { QuestHeader } from "./quest-header";
import type { QuestStep } from "./quest-machine";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const RIDOTTO = "(prefers-reduced-motion: reduce)";

const movimentoRidotto = () => window.matchMedia(RIDOTTO).matches;

type PassoNumeroProps = {
  step: QuestStep;
  numero: number;
  /**
   * Dove si è fermato il dado, se il numero arriva da un lancio appena fatto: il
   * numero parte da lì. `null` per chi rientra con il numero già estratto.
   */
  origine: ScreenPoint | null;
  onContinua: () => void;
  onGodi: () => void;
};

/**
 * Il numero gigante con, sotto, i testi del risultato ("Uhuh che gran bel
 * numero!") e poi delle istruzioni ("E ora che si fa?"). Resta montato per
 * entrambi gli step: il numero non rientra, pulsa, e cambiano solo i testi.
 */
export function PassoNumero({ step, numero, origine, onContinua, onGodi }: PassoNumeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const numeroRef = useRef<HTMLParagraphElement>(null);
  const stepPrecedenteRef = useRef(step);
  // I testi del risultato esistono solo se la quest è passata di lì: chi rientra con
  // il numero già estratto parte dalle istruzioni e non deve vederli nemmeno un attimo.
  const [conRisultato] = useState(step === "risultato");

  // Entrata del numero, una volta al montaggio. Dopo un lancio vola dalla faccia del
  // dado al suo posto crescendo; altrimenti compare con un piccolo rimbalzo.
  useGSAP(
    () => {
      const numeroEl = numeroRef.current;
      if (!numeroEl) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.set(numeroEl, { opacity: 1 });
        if (origine) {
          const rect = numeroEl.getBoundingClientRect();
          gsap.from(numeroEl, {
            x: origine.x - (rect.left + rect.width / 2),
            y: origine.y - (rect.top + rect.height / 2),
            scale: 0.22,
            duration: 0.85,
            ease: "expo.out",
          });
        } else {
          gsap.from(numeroEl, { opacity: 0, scale: 0.8, duration: 0.6, ease: "back.out(1.6)" });
        }
      });
      mm.add(RIDOTTO, () => {
        gsap.from(numeroEl, { opacity: 0, duration: 0.2 });
      });
    },
    { scope: rootRef },
  );

  // Cambi di step: dal risultato alle istruzioni il numero pulsa; verso la card tutta
  // la schermata sale e sparisce. Se l'effetto si ripete senza un cambio (pagina
  // rimostrata, Strict Mode) si imposta lo stato finale senza animarlo.
  useGSAP(
    () => {
      const precedente = stepPrecedenteRef.current;
      stepPrecedenteRef.current = step;

      if (step === "carta") {
        if (precedente !== "carta" && !movimentoRidotto()) {
          gsap.to(rootRef.current, { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in" });
        } else {
          gsap.set(rootRef.current, { autoAlpha: 0 });
        }
        return;
      }

      if (precedente === "risultato" && step === "istruzioni" && !movimentoRidotto()) {
        gsap
          .timeline()
          .to(numeroRef.current, { scale: 0.9, duration: 0.18, ease: "power2.in" })
          .to(numeroRef.current, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      }
    },
    { scope: rootRef, dependencies: [step] },
  );

  return (
    <section ref={rootRef} className="flex flex-1 flex-col text-center">
      <QuestHeader />

      <div className="flex flex-1 items-center justify-center py-4">
        <p
          ref={numeroRef}
          aria-hidden
          className="text-[11rem] font-extrabold leading-none tabular-nums opacity-0 motion-reduce:opacity-100"
        >
          {numero}
        </p>
      </div>

      {/* I due blocchi di testo occupano la stessa cella: uno esce mentre l'altro entra. */}
      <div className="grid [&>*]:[grid-area:1/1]">
        {conRisultato && (
          <TestiPasso
            attivo={step === "risultato"}
            variante="risultato"
            numero={numero}
            titolo={QUEST_COPY.risultato.titolo}
            testo={QUEST_COPY.risultato.testo}
            cta={QUEST_COPY.risultato.cta}
            onCta={onContinua}
          />
        )}
        <TestiPasso
          attivo={step === "istruzioni"}
          variante="istruzioni"
          numero={numero}
          titolo={QUEST_COPY.istruzioni.titolo}
          testo={QUEST_COPY.istruzioni.testo}
          cta={QUEST_COPY.istruzioni.cta}
          onCta={onGodi}
        />
      </div>
    </section>
  );
}

type TestiPassoProps = {
  attivo: boolean;
  variante: "risultato" | "istruzioni";
  numero: number;
  titolo: string;
  testo: string;
  cta: string;
  onCta: () => void;
};

function TestiPasso({ attivo, variante, numero, titolo, testo, cta, onCta }: TestiPassoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titoloRef = useRef<HTMLHeadingElement>(null);
  const testoRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const attivoPrecedenteRef = useRef(attivo);

  useGSAP(
    () => {
      const cambiato = attivoPrecedenteRef.current !== attivo;
      attivoPrecedenteRef.current = attivo;
      const root = rootRef.current;
      const ridotto = movimentoRidotto();

      if (!attivo) {
        if (cambiato && !ridotto) {
          gsap.to(root, { autoAlpha: 0, y: -16, duration: 0.3, ease: "power2.in" });
        } else {
          gsap.set(root, { autoAlpha: 0 });
        }
        return;
      }

      // Visibile subito e trasparente: un elemento `visibility: hidden` non prende il
      // focus, e il titolo lo riceve appena lo step cambia.
      gsap.set(root, { visibility: "visible", opacity: ridotto ? 0 : 1, y: 0 });
      if (ridotto) {
        gsap.to(root, { opacity: 1, duration: 0.2 });
        return;
      }

      const timeline = gsap.timeline({
        // Chi arriva da un altro step aspetta che quello esca; il risultato aspetta il volo del numero.
        delay: cambiato ? 0.25 : variante === "risultato" ? 0.4 : 0.15,
      });
      if (variante === "risultato") {
        timeline.from(titoloRef.current, {
          scale: 0.6,
          opacity: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.45)",
        });
      } else {
        const split = SplitText.create(titoloRef.current, {
          type: "words",
          mask: "words",
          ignore: ".sr-only",
        });
        timeline.from(split.words, {
          yPercent: 100,
          duration: 0.6,
          stagger: 0.05,
          ease: "power4.out",
        });
      }
      timeline
        .from(testoRef.current, { opacity: 0, y: 12, duration: 0.45, ease: "power2.out" }, "-=0.55")
        .from(ctaRef.current, { opacity: 0, y: 24, duration: 0.5, ease: "back.out(1.7)" }, "-=0.25");
    },
    { scope: rootRef, dependencies: [attivo] },
  );

  return (
    <div
      ref={rootRef}
      inert={!attivo}
      className="flex flex-col items-center gap-3 opacity-0 motion-reduce:opacity-100"
    >
      <h1
        ref={titoloRef}
        data-quest-titolo
        tabIndex={-1}
        className="text-3xl font-bold outline-none"
      >
        {titolo}
        <span className="sr-only"> Il tuo numero è {numero}.</span>
      </h1>
      <p ref={testoRef} className="text-balance text-muted-foreground">
        {testo}
      </p>
      <Button
        ref={ctaRef}
        type="button"
        variant="ticket"
        size="lg"
        className="mt-6 w-full"
        onClick={onCta}
      >
        {cta}
      </Button>
    </div>
  );
}
