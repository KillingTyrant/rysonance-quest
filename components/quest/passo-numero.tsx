"use client";

import { type ReactNode, type RefObject, useRef, useState } from "react";

import type { ScreenPoint } from "@/components/dice/types";
import { gsap, SplitText, useGSAP } from "@/components/motion/gsap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { QUEST_COPY } from "./copy";
import { Esagono } from "./esagono";
import { QuestHeader } from "./quest-header";
import type { QuestStep } from "./quest-machine";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const RIDOTTO = "(prefers-reduced-motion: reduce)";

const movimentoRidotto = () => window.matchMedia(RIDOTTO).matches;

function centro(rect: DOMRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

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
 * Il numero gigante nei due step che lo mostrano. Nel risultato sta al centro, fra
 * il titolo che lo annuncia ("…il titolo della canzone numero") e "Continua"; nelle
 * istruzioni sale in alto e sotto compare cosa fare dopo il concerto. Resta montato
 * per entrambi gli step: il numero non rientra, scivola al suo nuovo posto, e
 * cambiano solo i testi.
 *
 * I testi che non appartengono allo step corrente escono dal flusso e restano
 * incollati al bordo in cui stavano (in alto o in basso): il layout è già quello
 * del nuovo step mentre i vecchi svaniscono, senza riservare spazio a testi invisibili.
 */
export function PassoNumero({ step, numero, origine, onContinua, onGodi }: PassoNumeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const numeroRef = useRef<HTMLDivElement>(null);
  const stepPrecedenteRef = useRef(step);
  // Dov'era il numero al tocco di "Continua": da lì scivola al suo posto nelle istruzioni.
  const numeroPrimaRef = useRef<DOMRect | null>(null);
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

  // Cambi di step: dal risultato alle istruzioni il layout cambia di colpo e il numero
  // parte dalla posizione di prima per scivolare in quella nuova; verso la card tutta
  // la schermata sale e sparisce. Se l'effetto si ripete senza un cambio (pagina
  // rimostrata, Strict Mode) si imposta lo stato finale senza animarlo.
  useGSAP(
    () => {
      const precedente = stepPrecedenteRef.current;
      stepPrecedenteRef.current = step;
      const prima = numeroPrimaRef.current;
      numeroPrimaRef.current = null;

      if (step === "carta") {
        if (precedente !== "carta" && !movimentoRidotto()) {
          gsap.to(rootRef.current, { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in" });
        } else {
          gsap.set(rootRef.current, { autoAlpha: 0 });
        }
        return;
      }

      const numeroEl = numeroRef.current;
      if (
        precedente === "risultato" &&
        step === "istruzioni" &&
        prima &&
        numeroEl &&
        !movimentoRidotto()
      ) {
        const da = centro(prima);
        const a = centro(numeroEl.getBoundingClientRect());
        gsap.fromTo(
          numeroEl,
          { x: da.x - a.x, y: da.y - a.y },
          { x: 0, y: 0, duration: 0.8, delay: 0.15, ease: "power3.inOut", overwrite: "auto" },
        );
      }
    },
    { scope: rootRef, dependencies: [step] },
  );

  function continua() {
    numeroPrimaRef.current = numeroRef.current?.getBoundingClientRect() ?? null;
    onContinua();
  }

  const numeroGigante = (
    <div className="flex flex-1 items-center justify-center py-4">
      <div
        ref={numeroRef}
        aria-hidden
        className="grid place-items-center text-[min(30vw,8rem)] opacity-0 motion-reduce:opacity-100 [&>*]:[grid-area:1/1]"
      >
        <Esagono />
        <p className="font-extrabold leading-none tabular-nums text-numero-foreground">
          {numero}
        </p>
      </div>
    </div>
  );

  return (
    <section ref={rootRef} className="flex flex-1 flex-col text-center">
      <QuestHeader />

      {/* Il riferimento dei testi tolti dal flusso: restano al bordo in cui stavano. */}
      <div className="relative flex flex-1 flex-col">
        {conRisultato ? (
          <TestiRisultato attivo={step === "risultato"} numero={numero} onContinua={continua}>
            {numeroGigante}
          </TestiRisultato>
        ) : (
          numeroGigante
        )}
        <TestiIstruzioni
          attivo={step === "istruzioni"}
          inArrivo={step === "risultato"}
          numero={numero}
          onGodi={onGodi}
        />
      </div>
    </section>
  );
}

/**
 * Entrata e uscita dei testi di uno step quando diventa, o smette di essere, quello
 * attivo. Le `radici` escono svanendo verso l'alto; per entrare diventano visibili e
 * `entrata` ne anima il contenuto (`cambiato`: lo step è appena arrivato da un altro,
 * non montato così). Con "riduci movimento" è solo una dissolvenza.
 */
function useTestiStep(
  attivo: boolean,
  radici: RefObject<HTMLElement | null>[],
  entrata: (cambiato: boolean) => void,
) {
  const attivoPrecedenteRef = useRef(attivo);

  useGSAP(
    () => {
      const cambiato = attivoPrecedenteRef.current !== attivo;
      attivoPrecedenteRef.current = attivo;
      const elementi = radici.map((ref) => ref.current);
      const ridotto = movimentoRidotto();

      if (!attivo) {
        if (cambiato && !ridotto) {
          gsap.to(elementi, { autoAlpha: 0, y: -16, duration: 0.3, ease: "power2.in" });
        } else {
          gsap.set(elementi, { autoAlpha: 0 });
        }
        return;
      }

      // Visibili subito: un elemento `visibility: hidden` non prende il focus, e il
      // titolo lo riceve appena lo step cambia.
      gsap.set(elementi, { visibility: "visible", opacity: ridotto ? 0 : 1, y: 0 });
      if (ridotto) {
        gsap.to(elementi, { opacity: 1, duration: 0.2 });
        return;
      }
      entrata(cambiato);
    },
    { dependencies: [attivo] },
  );
}

type TestiRisultatoProps = {
  attivo: boolean;
  numero: number;
  onContinua: () => void;
  /** Il numero gigante, fra il titolo e il bottone. */
  children: ReactNode;
};

/**
 * Il titolo sopra il numero e "Continua" sotto. Il titolo finisce con "numero" e lo
 * completa l'esagono: lo screen reader legge il numero subito dopo.
 */
function TestiRisultato({ attivo, numero, onContinua, children }: TestiRisultatoProps) {
  const titoloRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const bottoneRef = useRef<HTMLButtonElement>(null);

  // Il titolo sale riga per riga quando il numero è quasi atterrato, poi arriva il bottone.
  useTestiStep(attivo, [titoloRef, ctaRef], () => {
    const split = SplitText.create(titoloRef.current, {
      type: "lines",
      mask: "lines",
      ignore: ".sr-only",
    });
    gsap
      .timeline({ delay: 0.4 })
      .from(split.lines, { yPercent: 100, duration: 0.7, stagger: 0.08, ease: "power4.out" })
      .from(
        bottoneRef.current,
        { opacity: 0, y: 24, duration: 0.5, ease: "back.out(1.7)" },
        "-=0.3",
      );
  });

  return (
    <>
      <h1
        ref={titoloRef}
        data-quest-titolo
        tabIndex={-1}
        inert={!attivo}
        className={cn(
          "text-balance text-xl font-bold leading-tight opacity-0 outline-none motion-reduce:opacity-100",
          !attivo && "absolute inset-x-0 top-0",
        )}
      >
        {QUEST_COPY.risultato.titolo}
        <span className="sr-only"> {numero}.</span>
      </h1>

      {children}

      <div
        ref={ctaRef}
        inert={!attivo}
        className={cn(
          "flex justify-center opacity-0 motion-reduce:opacity-100",
          !attivo && "absolute inset-x-0 bottom-0",
        )}
      >
        <Button ref={bottoneRef} type="button" variant="ticket" onClick={onContinua}>
          {QUEST_COPY.risultato.cta}
        </Button>
      </div>
    </>
  );
}

type TestiIstruzioniProps = {
  attivo: boolean;
  /** Lo step è ancora il risultato: i testi aspettano fuori dal flusso, invisibili. */
  inArrivo: boolean;
  numero: number;
  onGodi: () => void;
};

/** Sotto il numero: cosa fare dopo il concerto e "Goditi l'evento". */
function TestiIstruzioni({ attivo, inArrivo, numero, onGodi }: TestiIstruzioniProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titoloRef = useRef<HTMLHeadingElement>(null);
  const testiRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  // Dal risultato si aspetta che il numero sia a metà strada verso l'alto.
  useTestiStep(attivo, [rootRef], (cambiato) => {
    const split = SplitText.create(titoloRef.current, {
      type: "words",
      mask: "words",
      ignore: ".sr-only",
    });
    gsap
      .timeline({ delay: cambiato ? 0.45 : 0.15 })
      .from(split.words, { yPercent: 100, duration: 0.6, stagger: 0.05, ease: "power4.out" })
      .from(
        gsap.utils.toArray<HTMLElement>(testiRef.current?.children ?? []),
        { opacity: 0, y: 12, duration: 0.45, stagger: 0.12, ease: "power2.out" },
        "-=0.55",
      )
      .from(ctaRef.current, { opacity: 0, y: 24, duration: 0.5, ease: "back.out(1.7)" }, "-=0.25");
  });

  return (
    <div
      ref={rootRef}
      inert={!attivo}
      className={cn(
        "flex flex-col items-center gap-3 opacity-0 motion-reduce:opacity-100",
        inArrivo && "absolute inset-x-0 bottom-0",
      )}
    >
      <h1
        ref={titoloRef}
        data-quest-titolo
        tabIndex={-1}
        className="text-balance text-xl font-bold leading-tight outline-none"
      >
        {QUEST_COPY.istruzioni.titolo}
        <span className="sr-only"> Il tuo numero è {numero}.</span>
      </h1>
      <div ref={testiRef} className="flex flex-col gap-4 text-balance text-sm">
        {QUEST_COPY.istruzioni.testi.map((testo) => (
          <p key={testo}>{testo}</p>
        ))}
      </div>
      <Button ref={ctaRef} type="button" variant="ticket" className="mt-6" onClick={onGodi}>
        {QUEST_COPY.istruzioni.cta}
      </Button>
    </div>
  );
}
