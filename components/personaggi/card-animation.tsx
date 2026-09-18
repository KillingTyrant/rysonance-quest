"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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
      gsap.fromTo(
        cardRef.current,
        {opacity: 0, y: 40, scale: 0.94,
        },
        {opacity: 1, y: 0,scale: 1, duration: 0.7, delay: 0.2 + index * 0.15, 
             ease: "power2.out", 
        }
      );
    },
    { scope: cardRef }
  );

  return (
    <div ref={cardRef} className="opacity-0">
      {children}
    </div>
  );
}