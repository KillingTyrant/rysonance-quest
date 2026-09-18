"use client";

import { useRef } from "react";

import { gsap, SplitText, useGSAP } from "@/components/motion/gsap";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

const PASSI = [
  {
    numero: "01",
    titolo: "Crea il tuo eroe",
    testo: "Scegli nome, razza e talenti: la tua scheda è pronta in un paio di minuti.",
  },
  {
    numero: "02",
    titolo: "Lancia il D12",
    testo: "Il dado sceglie il numero della canzone che dovrai riconoscere.",
  },
  {
    numero: "03",
    titolo: "Indovina all'evento",
    testo: "Quando tocca a te, ascolta la tua canzone. Se la indovini, la ricompensa è tua.",
  },
] as const;

/**
 * Il sottotitolo sotto il logo: entra parola per parola quando il timbro Quest
 * è appena caduto (vedi il `delay` in quest-stamp.tsx).
 */
export function HomeTagline() {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    gsap.matchMedia().add(MOTION_OK, () => {
      gsap.set(ref.current, { opacity: 1 });
      SplitText.create(ref.current, {
        type: "words",
        mask: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 110,
            duration: 0.6,
            delay: 2,
            stagger: 0.04,
            ease: "power4.out",
          }),
      });
    });
  });

  return (
    <p
      ref={ref}
      className="relative max-w-xl text-balance text-lg text-muted-foreground opacity-0 motion-reduce:opacity-100 sm:text-xl"
    >
      Crea il tuo personaggio, lancia il dado e porta la tua quest all&apos;evento:
      una canzone ti aspetta.
    </p>
  );
}

/** "Come funziona": i tre passi della quest, che salgono uno dopo l'altro. */
export function HomeSteps() {
  const ref = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo(
          ".passo",
          { autoAlpha: 0, y: 32 },
          { autoAlpha: 1, y: 0, duration: 0.7, delay: 2.3, stagger: 0.12, ease: "back.out(1.4)" },
        );
      });
    },
    { scope: ref },
  );

  return (
    <ol ref={ref} className="grid w-full gap-4 text-left sm:grid-cols-3">
      {PASSI.map((passo) => (
        <li
          key={passo.numero}
          className="passo group relative overflow-hidden rounded-xl border bg-card/60 p-5 backdrop-blur-sm transition-colors hover:border-foreground/30"
        >
          <span
            aria-hidden
            className="absolute -right-2 -top-4 text-7xl font-black text-foreground/5 transition-colors group-hover:text-[#FFBA30]/30"
          >
            {passo.numero}
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Passo {passo.numero}
          </p>
          <h2 className="mt-2 text-lg font-black">{passo.titolo}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{passo.testo}</p>
        </li>
      ))}
    </ol>
  );
}
