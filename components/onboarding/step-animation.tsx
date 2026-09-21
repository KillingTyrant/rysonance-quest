"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/components/motion/gsap";

/**
 * Transizione fra le viste del wizard: la vista nuova entra da sinistra se si
 * va avanti, da destra se si torna indietro. Va montata con una `key` per
 * vista, così ogni cambio la rimonta e riparte l'animazione.
 */
export function StepAnimation({
  children,
  isBackward = false,
}: {
  children: React.ReactNode;
  isBackward?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, x: isBackward ? 100 : -100 },
          { opacity: 1, x: 0, duration: 0.8, ease: "circ.out", clearProps: "all" },
        );
      });
    },
    { scope: containerRef, dependencies: [isBackward] },
  );

  return (
    <div ref={containerRef} className="flex w-full flex-1 flex-col">
      {children}
    </div>
  );
}
