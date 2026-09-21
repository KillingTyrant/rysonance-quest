"use client";

import { Suspense, useRef, type RefObject } from "react";
import { usePathname } from "next/navigation";

import { gsap, useGSAP } from "@/components/motion/gsap";

/**
 * Transizione d'ingresso di ogni pagina, diversa per sezione. La home e la
 * lobby non ne hanno: le loro animazioni d'entrata sono già nei componenti
 * (LogoEntrance, HeaderAnimation, CardAnimation) e una dissolvenza sopra le
 * coprirebbe.
 *
 * Il pathname lo legge solo `PageTransition`, dentro un `<Suspense>` a parte:
 * con Cache Components `usePathname()` sospende sulle route con parametri non
 * noti a build time (es. /quest/[id]), e letto qui bloccherebbe il prerender
 * di tutta la pagina. Così `children` resta fuori dal boundary e si
 * prerenderizza, e l'animazione parte quando il pathname è disponibile.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full">
      <Suspense fallback={null}>
        <PageTransition containerRef={containerRef} />
      </Suspense>
      {children}
    </div>
  );
}

function PageTransition({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const pathname = usePathname();

  useGSAP(
    () => {
      if (pathname === "/" || pathname === "/lobby") return;

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        if (pathname.startsWith("/onboarding")) {
          gsap.fromTo(
            containerRef.current,
            { opacity: 0, scale: 0.96, y: 10 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power2.out" },
          );
        } else if (pathname.startsWith("/auth")) {
          gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power1.out" },
          );
        } else {
          gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power1.out" },
          );
        }
      });
    },
    { dependencies: [pathname], scope: containerRef },
  );

  return null;
}
