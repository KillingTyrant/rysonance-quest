"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/components/motion/gsap";

/** Entrata dall'alto dell'intestazione della lobby. */
export function HeaderAnimation({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          containerRef.current,
          { autoAlpha: 0, y: -15 },
          { autoAlpha: 1, y: 0, duration: 1.0, ease: "power2.out" },
        );
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
