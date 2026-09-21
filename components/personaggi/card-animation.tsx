"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/components/motion/gsap";

/** Entrata a cascata delle card della lobby: ogni card parte dopo la precedente. */
export function CardAnimation({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 40, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            delay: 0.2 + index * 0.15,
            ease: "power2.out",
          },
        );
      });
    },
    { scope: cardRef },
  );

  // Nascosta finché l'animazione non parte, niente scatto all'idratazione; con
  // "riduci movimento" l'animazione non c'è e la card resta visibile.
  return (
    <div ref={cardRef} className="opacity-0 motion-reduce:opacity-100">
      {children}
    </div>
  );
}
