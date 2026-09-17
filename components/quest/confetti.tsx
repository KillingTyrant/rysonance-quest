"use client";

import { type Ref, useImperativeHandle, useRef } from "react";

import type { ScreenPoint } from "@/components/dice/types";
import { gsap, useGSAP } from "@/components/motion/gsap";

export type ConfettiHandle = {
  /** Un'esplosione di coriandoli dal punto indicato, in coordinate del viewport. */
  burst: (origin: ScreenPoint) => void;
};

/** Giallo del brand, neutri e un accento viola preso dalle illustrazioni. */
const COLORI = ["#FFBA30", "#E6A72B", "#1c1917", "#a8a29e", "#fafaf9", "#8b5cf6"];
const QUANTI = 56;

/**
 * Coriandoli come elementi DOM mossi da Physics2D: velocità e angolo iniziali,
 * gravità, un po' di attrito. Il contenitore è fisso sul viewport e fuori da
 * qualunque elemento trasformato, così `fixed` resta davvero fisso.
 *
 * Le particelle le crea e le toglie questo componente, non React: il `<div>` non
 * ha figli React. Con "riduci movimento" non parte nulla.
 */
export function Confetti({ ref }: { ref?: Ref<ConfettiHandle> }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Se la pagina viene nascosta a metà volo, il revert riporterebbe le particelle
  // al punto di partenza: vanno tolte.
  const { contextSafe } = useGSAP(
    () => () => {
      containerRef.current?.replaceChildren();
    },
    { scope: containerRef },
  );

  useImperativeHandle(
    ref,
    () => ({
      burst: contextSafe((origin: ScreenPoint) => {
        const container = containerRef.current;
        if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }

        for (let i = 0; i < QUANTI; i += 1) {
          const particella = document.createElement("span");
          const lato = gsap.utils.random(6, 12);
          Object.assign(particella.style, {
            position: "absolute",
            left: `${origin.x}px`,
            top: `${origin.y}px`,
            width: `${lato}px`,
            height: `${lato * gsap.utils.random(0.4, 1)}px`,
            background: gsap.utils.random(COLORI),
            borderRadius: Math.random() < 0.3 ? "9999px" : "2px",
          });
          container.appendChild(particella);

          const durata = gsap.utils.random(1.4, 2.2);
          gsap
            .timeline({ onComplete: () => particella.remove() })
            .set(particella, { xPercent: -50, yPercent: -50 })
            .to(particella, {
              duration: durata,
              ease: "none",
              rotation: gsap.utils.random(-720, 720),
              physics2D: {
                velocity: gsap.utils.random(380, 950),
                // 0° è a destra e 90° in basso: 210..330 è un ventaglio verso l'alto.
                angle: gsap.utils.random(210, 330),
                gravity: 1300,
                friction: 0.015,
              },
            })
            .to(particella, { opacity: 0, duration: 0.4 }, durata - 0.4);
        }
      }),
    }),
    [contextSafe],
  );

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    />
  );
}
