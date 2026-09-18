"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function HeroAnimations({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // 1. Peschiamo tutti i tracciati (path) dentro l'SVG del Logo
      // Il file Logo.tsx è fatto così: il 1° <path> è l'icona, gli altri sono le lettere
      const svgPaths = gsap.utils.toArray("h1 svg path");
      const letters = svgPaths.slice(1); // Escludiamo l'icona, prendiamo solo le lettere
      const dividers = gsap.utils.toArray(".bg-gradient-to-r"); // Le due linee decorative

      // Prepariamo la scena: nascondiamo le lettere, i bottoni e le linee
      gsap.set(letters, { autoAlpha: 0, x: -20 });
      gsap.set(dividers, { scaleX: 0, transformOrigin: "center" });

      // 2. Facciamo entrare il contenitore del Logo partendo più grande
      tl.fromTo(
        "h1",
        { autoAlpha: 0, scale: 1.15 },
        { autoAlpha: 1, scale: 1, duration: 1.2, ease: "expo.out" }
      )
      // 3. Sveliamo le lettere una ad una, da sinistra a destra
      .to(
        letters,
        { autoAlpha: 1, x: 0, duration: 0.8, stagger: 0.08, ease: "power2.out" },
        "-=0.7" // Inizia mentre l'icona si sta ancora rimpicciolendo
      )
      // 4. Facciamo espandere le due sottili linee decorative (sopra e sotto) dal centro
      .to(
        dividers,
        { scaleX: 1, duration: 0.8, stagger: 0.2, ease: "power3.inOut" },
        "-=0.4"
      )
      // 5. Facciamo apparire il bottone "Lobby" giallo dal basso
      .fromTo(
        "a, button",
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.6"
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      {children}
    </div>
  );
}