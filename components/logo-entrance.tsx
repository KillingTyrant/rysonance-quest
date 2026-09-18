"use client";

import { useRef } from "react";

import { Logo } from "@/components/layout/logo";
import { gsap, useGSAP } from "@/components/motion/gsap";

/**
 * Il logo della home con l'entrata "a timbro", la stessa del biglietto Quest:
 * il simbolo ruota in posizione, poi le lettere cadono una dopo l'altra da
 * grandi e inclinate, con un rimbalzo. Il timbro Quest parte quando l'ultima
 * lettera è ferma (vedi il `delay` in quest-stamp.tsx).
 *
 * Ogni lettera è un `<path>` a sé nell'SVG del logo: il primo è il simbolo,
 * gli altri sono le lettere nell'ordine di lettura.
 */
export function LogoEntrance({ className }: { className?: string }) {
  const logo = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const [simbolo, ...lettere] = gsap.utils.toArray<SVGPathElement>("path", logo.current);

      gsap
        .timeline({ delay: 0.1 })
        // Il CSS tiene nascosti i path finché non partono: niente scatto all'idratazione.
        .fromTo(
          simbolo,
          { autoAlpha: 0, scale: 0.3, rotation: -200, transformOrigin: "50% 50%" },
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.6)" },
        )
        .fromTo(
          lettere,
          { autoAlpha: 0, scale: 1.8, rotation: -20, transformOrigin: "50% 50%" },
          {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 0.5,
            ease: "back.out(2.2)",
            stagger: 0.06,
          },
          "-=0.4",
        );
    });
  });

  // `overflow-visible`: da grandi le lettere escono dal viewBox, e un <svg> inline
  // di default taglierebbe tutto ciò che sta fuori.
  return (
    <Logo
      ref={logo}
      className={`logo-entrance overflow-visible ${className ?? ""}`}
      iconOnly={false}
    />
  );
}
