"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/components/motion/gsap";

/**
 * Il timbro "Quest" sul logo della home: un biglietto inclinato che cade sul
 * logo come un timbro e poi fa passare un riflesso a intervalli.
 *
 * La forma sta in `.quest-stamp` (globals.css), il movimento qui. Il riflesso è
 * un gradiente sul `::before` del biglietto, quindi resta dentro la mask delle
 * tacche: GSAP ne muove la posizione tramite la variabile `--shine`.
 */
export function QuestStamp({ className }: { className?: string }) {
  const stamp = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    // `matchMedia`: se "riduci movimento" si attiva a pagina aperta, GSAP
    // annulla le animazioni e il timbro torna fermo e visibile.
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap
        .timeline({ delay: 0.4 })
        // Il CSS lo tiene nascosto finché non parte: niente scatto all'idratazione.
        .fromTo(
          stamp.current,
          { autoAlpha: 0, scale: 1.8, rotation: -20 },
          { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.7, ease: "back.out(2.2)" },
        )
        .fromTo(
          stamp.current,
          { "--shine": "150%" },
          { "--shine": "-50%", duration: 1, ease: "power2.inOut", repeat: -1, repeatDelay: 1.4 },
          "+=0.3",
        );
    });
  });

  return (
    <span ref={stamp} className={`z-10 quest-stamp btn-ticket ${className ?? ""}`}>
      Quest
    </span>
  );
}
