"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function StepAnimation({ children, isBackward = false }: { children: React.ReactNode, isBackward?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current,
        { opacity: 0, x: isBackward ? 100 : -100 }, // <-- Parte da sinistra o da destra
        { opacity: 1, x: 0, duration: 0.8, ease: "circ.out", clearProps: "all" }
      );
    },
    { scope: containerRef, dependencies: [isBackward] } // <-- Ricarica l'animazione se cambia la direzione
  );

  return (
    <div ref={containerRef} className="flex w-full flex-1 flex-col">
      {children}
    </div>
  );
}