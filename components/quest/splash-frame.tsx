"use client";

import { useRef } from "react";

import { PartnerLogo } from "@/components/brand/partner-logo";
import { Logo } from "@/components/layout/logo";
import { gsap, useGSAP } from "@/components/motion/gsap";

import { QUEST_COPY } from "./copy";

/** Quando lo splash passa da Rysonance al partner (secondi). */
const CAMBIO_S = 1;
/** Durata della barra: coincide con l'attesa minima della quest (SPLASH_MIN_MS). */
const DURATA_S = 2;

/**
 * Il caricamento della quest, in due fasi: prima logo e testo di Rysonance,
 * dopo `CAMBIO_S` quelli del partner, mentre la barra si riempie in `DURATA_S`.
 * Fa da fallback di Suspense per `/quest` e `/quest/[id]`.
 *
 * Le due fasi stanno sovrapposte nella stessa cella della griglia, così il
 * cambio non sposta nulla. Con "riduci movimento" si vede solo lo stato
 * finale: logo del partner e barra piena (il CSS nasconde la fase partner solo
 * quando il movimento è ammesso, vedi `.splash-partner` in globals.css).
 */
export function SplashFrame() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".splash-bar",
          { scaleX: 0 },
          { scaleX: 1, duration: DURATA_S, ease: "power1.inOut", transformOrigin: "0% 50%" },
        );

        gsap
          .timeline({ delay: CAMBIO_S })
          .to(".splash-rysonance", {
            autoAlpha: 0,
            scale: 0.9,
            duration: 0.3,
            ease: "power2.in",
          })
          .fromTo(
            ".splash-partner",
            { autoAlpha: 0, scale: 1.1 },
            { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" },
            "-=0.1",
          );
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex flex-1 flex-col">
      <div className="grid flex-1 place-items-center">
        <Logo iconOnly={false} className="splash-rysonance col-start-1 row-start-1 h-auto w-52" />
        <PartnerLogo className="splash-partner col-start-1 row-start-1 h-auto w-44" />
      </div>
      <div className="flex flex-col gap-3">
        <p role="status" className="grid text-center text-xs text-muted-foreground">
          <span className="splash-rysonance col-start-1 row-start-1">
            {QUEST_COPY.caricamento.rysonance}
          </span>
          <span className="splash-partner col-start-1 row-start-1">
            {QUEST_COPY.caricamento.partner}
          </span>
        </p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="splash-bar h-full w-full bg-foreground" />
        </div>
      </div>
    </div>
  );
}
