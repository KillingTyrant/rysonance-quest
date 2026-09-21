"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface HeaderAnimationProps {
  children: React.ReactNode;
  className?: string;
}

export function HeaderAnimation({ children, className }: HeaderAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      
      gsap.fromTo(
        containerRef.current,
        {autoAlpha: 0, y: -15,},
        {autoAlpha: 1, y: 0, duration: 1.0, ease: "power2.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}