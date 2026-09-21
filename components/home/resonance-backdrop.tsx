"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/components/motion/gsap";

const NUMERI = Array.from({ length: 12 }, (_, i) => i + 1);
const RAGGIO_QUADRANTE = 440;
const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * Lo sfondo del logo in home: onde che si allargano dal centro (la "risonanza")
 * e un quadrante con i dodici numeri del D12 che gira piano sotto una lancetta
 * ambra, come il dado che sceglie la canzone.
 *
 * A riposo (e con "riduci movimento") restano tre cerchi fermi e il quadrante
 * dritto. Col puntatore lo sfondo si sposta di poco in direzione opposta.
 */
export function ResonanceBackdrop({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          root.current,
          { autoAlpha: 0, scale: 0.85 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 1.4,
            delay: 0.3,
            ease: "power3.out",
          },
        );
        gsap.fromTo(
          ".onda",
          { scale: 0.45, opacity: 0.55, transformOrigin: "50% 50%" },
          {
            scale: 1.35,
            opacity: 0,
            duration: 5,
            ease: "sine.out",
            // Il repeat sta nello stagger: ogni onda riparte da sé, sfasata dalle altre.
            stagger: { each: 5 / 3, repeat: -1 },
          },
        );
        gsap.to(".quadrante", {
          rotation: 360,
          svgOrigin: "0 0",
          duration: 120,
          ease: "none",
          repeat: -1,
        });
      });

      mm.add(`${MOTION_OK} and (pointer: fine)`, () => {
        const x = gsap.quickTo(root.current, "x", {
          duration: 1.2,
          ease: "power3.out",
        });
        const y = gsap.quickTo(root.current, "y", {
          duration: 1.2,
          ease: "power3.out",
        });
        const muovi = (e: PointerEvent) => {
          x((e.clientX / window.innerWidth - 0.5) * -30);
          y((e.clientY / window.innerHeight - 0.5) * -30);
        };
        window.addEventListener("pointermove", muovi);
        return () => window.removeEventListener("pointermove", muovi);
      });
    },
    { scope: root },
  );

  return (
    // Due livelli: il posizionamento (anche con translate) sta sul contenitore,
    // GSAP muove solo quello interno e non si porta dietro il translate in pixel.
    <div aria-hidden className={`pointer-events-none ${className ?? ""}`}>
      <div
        ref={root}
        className="relative h-full w-full opacity-0 motion-reduce:opacity-100"
      >
        {/* Alone ambra dietro il logo: lo stesso colore del biglietto "Vai alla Lobby". */}
        <div className="absolute inset-[22%] rounded-full bg-brand/25 blur-3xl dark:bg-brand/15" />
        <svg
          viewBox="-500 -500 1000 1000"
          className="relative h-full w-full overflow-visible text-foreground"
        >
          <g fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle className="onda" r={180} strokeOpacity={0.2} />
            <circle className="onda" r={260} strokeOpacity={0.2} />
            <circle className="onda" r={340} strokeOpacity={0.2} />
          </g>

          <g className="quadrante">
            <circle
              r={RAGGIO_QUADRANTE}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray="2 10"
            />
            {NUMERI.map((n) => {
              const angolo = ((n * 30 - 90) * Math.PI) / 180;
              return (
                <text
                  key={n}
                  x={Math.cos(angolo) * (RAGGIO_QUADRANTE - 38)}
                  y={Math.sin(angolo) * (RAGGIO_QUADRANTE - 38)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="currentColor"
                  fillOpacity={0.18}
                  className="text-[28px] font-black"
                >
                  {n}
                </text>
              );
            })}
          </g>

          {/* Lancetta fissa: il quadrante le gira sotto. */}
          <path
            d={`M-12 ${-RAGGIO_QUADRANTE - 26} L12 ${-RAGGIO_QUADRANTE - 26} L0 ${-RAGGIO_QUADRANTE - 4} Z`}
            className="fill-brand"
          />
        </svg>
      </div>
    </div>
  );
}
