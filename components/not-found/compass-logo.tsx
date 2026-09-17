"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

import { Logo } from "@/components/layout/logo";

gsap.registerPlugin(useGSAP);

/**
 * Il simbolo del logo come l'ago di una bussola che ha perso il nord: entra
 * girando a vuoto, poi oscilla cercando la direzione, si assesta e ricomincia.
 *
 * `useGSAP` registra tutto in un `gsap.context()` e lo annulla allo smontaggio
 * (anche nel doppio mount di Strict Mode). Il server rende il `Logo` dritto e
 * senza stili inline: con "riduci movimento" attivo resta così.
 */
export function CompassLogo({ className }: { className?: string }) {
  const logo = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    // `matchMedia` e non un controllo al mount: se la preferenza cambia a
    // pagina aperta, GSAP annulla le animazioni e rimette il simbolo dritto.
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(logo.current, { transformOrigin: "50% 50%" });

      const search = gsap
        .timeline({
          repeat: -1,
          repeatDelay: 1.2,
          // Ricalcola le ampiezze a ogni giro: l'ago non ripete mai lo stesso gesto.
          repeatRefresh: true,
          defaults: { ease: "sine.inOut" },
        })
        .to(logo.current, { rotation: () => gsap.utils.random(-16, -10), duration: 1.1 })
        .to(logo.current, { rotation: () => gsap.utils.random(8, 12), duration: 1.3 })
        .to(logo.current, { rotation: () => gsap.utils.random(-6, -3), duration: 1 })
        .to(logo.current, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.4)" });

      // Un giro intero: il primo frame coincide con il markup del server, quindi
      // all'idratazione il simbolo non scatta.
      gsap
        .timeline()
        .from(logo.current, { rotation: -360, duration: 1.6, ease: "power3.out" })
        .add(search);
    });
  });

  return <Logo ref={logo} className={className} />;
}
