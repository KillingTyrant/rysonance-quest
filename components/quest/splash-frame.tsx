"use client";

import Image from "next/image";
import { type ReactNode, useRef, useState } from "react";

import { PartnerLogo } from "@/components/brand/partner-logo";
import { Logo } from "@/components/layout/logo";
import { gsap, useGSAP } from "@/components/motion/gsap";

// Import relativo e non con l'alias `@/`: vedi la nota in `assets/catalog/index.ts`.
import blanco from "../../assets/brand/blanco.webp";

import { QUEST_COPY } from "./copy";

/** Quanto resta a schermo ciascuna fase: Rysonance, partner, Blanco (secondi). */
const FASE_S = 2;
/** Durata della barra, e quindi dello splash: la quest compare solo dopo (vedi `SplashGate`). */
const DURATA_S = 3 * FASE_S;

/**
 * Lo splash fa da sipario alla quest: resta per tutta l'animazione, contata da
 * quando compare sul client, e solo dopo lascia il posto a `children`. Se a quel
 * punto la quest non è ancora arrivata, lo splash resta fermo sullo stato finale
 * (il fallback di Suspense dentro `children`) finché non arriva.
 *
 * L'attesa minima non sta sul server: un `setTimeout` accanto alla query parte
 * con la richiesta, l'animazione solo quando lo splash compare, e fra i due passa
 * un tempo variabile (navigazione senza prefetch, idratazione, compilazione in
 * dev). Bastava poco perché la quest arrivasse prima del cambio al partner.
 */
export function SplashGate({ children }: { children: ReactNode }) {
  const [finito, setFinito] = useState(false);
  if (!finito) return <SplashFrame onFine={() => setFinito(true)} />;
  return children;
}

type SplashFrameProps = {
  /** Chiamata a barra piena; con "riduci movimento", dopo la stessa durata. */
  onFine?: () => void;
  /** Lo stato finale da subito, senza animazione: Blanco e barra piena. */
  finale?: boolean;
};

/**
 * Il caricamento della quest, in tre fasi da `FASE_S` l'una: logo e testo di
 * Rysonance, poi quelli del partner, infine Blanco, mentre la barra si riempie
 * in `DURATA_S`. Fa da fallback di Suspense per `/quest` e, dentro
 * `SplashGate`, per `/quest/[id]`.
 *
 * Le fasi stanno sovrapposte nella stessa cella della griglia, così il cambio
 * non sposta nulla. Con "riduci movimento" si vede solo lo stato finale:
 * Blanco e barra piena (il CSS nasconde le fasi in base alla preferenza, vedi
 * `.splash-partner` in globals.css).
 *
 * Blanco è una foto scontornata: `next/image` con `sizes`, così il browser
 * sceglie dal `srcset` la larghezza giusta per la densità dello schermo. Niente
 * `placeholder="blur"`, che riempirebbe di nero la trasparenza (vedi
 * `home/home-artwork.tsx`).
 */
export function SplashFrame({ onFine, finale = false }: SplashFrameProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (finale) {
        gsap.set(".splash-rysonance, .splash-partner", { autoAlpha: 0 });
        gsap.set(".splash-blanco", { autoAlpha: 1 });
        gsap.set(".splash-bar", { scaleX: 1 });
        return;
      }

      // Fuori da matchMedia: la durata vale anche con "riduci movimento".
      if (onFine) gsap.delayedCall(DURATA_S, onFine);

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".splash-bar",
          { scaleX: 0 },
          { scaleX: 1, duration: DURATA_S, ease: "power1.inOut", transformOrigin: "0% 50%" },
        );

        // Ogni cambio cade allo scadere della sua fase, e l'entrata parte 0.1 s
        // prima che finisca l'uscita. Oggetti nuovi a ogni giro: GSAP scrive
        // dentro i `vars` che riceve, quindi non vanno condivisi fra tween.
        const cambi = gsap.timeline();
        [
          [".splash-rysonance", ".splash-partner"],
          [".splash-partner", ".splash-blanco"],
        ].forEach(([esce, entra], i) => {
          const t = (i + 1) * FASE_S;
          cambi
            .to(esce, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: "power2.in" }, t)
            .fromTo(
              entra,
              { autoAlpha: 0, scale: 1.1 },
              { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" },
              t + 0.2,
            );
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex flex-1 flex-col">
      <div className="grid flex-1 place-items-center">
        <Logo iconOnly={false} className="splash-rysonance col-start-1 row-start-1 h-auto w-52" />
        <PartnerLogo className="splash-partner col-start-1 row-start-1 h-auto w-44" />
        <Image
          src={blanco}
          alt="Blanco"
          sizes="10rem"
          className="splash-blanco col-start-1 row-start-1 h-auto w-40"
        />
      </div>
      <div className="flex flex-col gap-3">
        <p role="status" className="grid text-center text-xs text-muted-foreground">
          <span className="splash-rysonance col-start-1 row-start-1">
            {QUEST_COPY.caricamento.rysonance}
          </span>
          <span className="splash-partner col-start-1 row-start-1">
            {QUEST_COPY.caricamento.partner}
          </span>
          <span className="splash-blanco col-start-1 row-start-1">
            {QUEST_COPY.caricamento.blanco}
          </span>
        </p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="splash-bar h-full w-full bg-foreground" />
        </div>
      </div>
    </div>
  );
}
