"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { gsap, useGSAP } from "@/components/motion/gsap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EmblemaVia } from "../emblema-via";
import { StepSection } from "../step-section";
import type { StepProps } from "../wizard-steps";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * Il colore di ogni via, per chiave del DB: tinge la parte bassa dell'emblema.
 * È presentazione come le icone di `CATALOG_IMAGES`, e una via senza colore
 * resta nera.
 */
const COLORI_VIE: Record<string, string | undefined> = {
  combattente: "#FF4500",
  sapiente: "#3B82F6",
  viandante: "#9333EA",
};

/** Trascinamento che vale un passo intero, in px: oltre `SOGLIA` di passo si cambia via. */
const PX_PER_PASSO = 150;
const SOGLIA = 0.4;

/**
 * La Via: il percorso di crescita, il modo in cui il personaggio sta al mondo.
 * Non porta talenti e non dice quanti se ne scelgono — quel numero è lo stesso
 * per tutte le Vie (`TALENTI_DA_SCEGLIERE`).
 *
 * Una via alla volta al centro dell'emblema: trascinando in orizzontale (dito
 * o mouse) gli anelli ruotano e allo scatto cambia via; le frecce, anche da
 * tastiera, fanno lo stesso. La via al centro è quella scelta, e "Seleziona"
 * nella nav la conferma.
 */
export function ViaStep({ catalog, draft, onChange }: StepProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const testiRef = useRef<HTMLDivElement>(null);
  // Passi fatti dall'ingresso nello step: gli anelli girano sempre nel verso
  // del gesto, anche quando l'indice della via ricomincia da capo.
  const passiRef = useRef(0);
  // Dove è partito il trascinamento in corso, `null` se non ce n'è uno.
  const dragRef = useRef<number | null>(null);
  // Il suggerimento del gesto compare solo a chi non ha ancora scelto una via.
  const [tutorial, setTutorial] = useState(draft.via_key === null);

  const { contextSafe } = useGSAP({ scope: rootRef });

  const indice = Math.max(
    0,
    catalog.vie.findIndex((via) => via.key === draft.via_key),
  );
  const via = catalog.vie[indice];

  // Entrando senza una scelta la via al centro è la prima: la si sceglie
  // subito, così "Seleziona" conferma quello che si vede.
  useEffect(() => {
    if (!draft.via_key && catalog.vie[0]) onChange({ via_key: catalog.vie[0].key });
  }, [draft.via_key, catalog.vie, onChange]);

  /** Gli anelli seguono il trascinamento: `progresso` è la frazione di passo. */
  const segui = contextSafe((progresso: number) => {
    gsap.set("[data-gradi]", {
      rotation: (_: number, anello: HTMLElement) =>
        (passiRef.current + progresso) * Number(anello.dataset.gradi),
      overwrite: true,
    });
    gsap.set(testiRef.current, {
      opacity: Math.max(0, 1 - Math.abs(progresso) * 1.5),
      x: -progresso * 20,
      overwrite: true,
    });
  });

  /** Chiude il gesto: avanti, indietro, o `0` per tornare dove si era. */
  const scatta = contextSafe((passo: -1 | 0 | 1) => {
    setTutorial(false);
    const tempo = window.matchMedia(MOTION_OK).matches ? 1 : 0;
    passiRef.current += passo;

    gsap.to("[data-gradi]", {
      rotation: (_: number, anello: HTMLElement) =>
        passiRef.current * Number(anello.dataset.gradi),
      duration: 0.6 * tempo,
      ease: "power2.out",
      overwrite: true,
    });

    if (passo === 0) {
      gsap.to(testiRef.current, { opacity: 1, x: 0, duration: 0.5 * tempo, overwrite: true });
      return;
    }

    const count = catalog.vie.length;
    onChange({ via_key: catalog.vie[(indice + passo + count) % count].key });
    gsap.fromTo(
      testiRef.current,
      { opacity: 0, x: 30 * passo },
      { opacity: 1, x: 0, duration: 0.5 * tempo, delay: 0.1 * tempo, overwrite: true },
    );
  });

  if (!via) return null;

  return (
    <StepSection>
      <div ref={rootRef} className="flex items-center justify-center gap-4">
        {/* Su mobile si trascina; le frecce servono da sm in su. */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden shrink-0 rounded-full sm:inline-flex"
          onClick={() => scatta(-1)}
        >
          <ArrowLeft />
          <span className="sr-only">Via precedente</span>
        </Button>

        {/*
          `touch-pan-y` lascia al browser lo scroll verticale della pagina: se
          il gesto diventa uno scroll arriva un pointercancel e gli anelli
          tornano a posto. Il pointer capture tiene il trascinamento anche
          quando il dito esce dall'emblema.
        */}
        <div
          role="group"
          aria-roledescription="carosello"
          aria-label="Vie"
          tabIndex={0}
          className="flex w-80 max-w-full cursor-grab touch-pan-y select-none flex-col items-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = event.clientX;
          }}
          onPointerMove={(event) => {
            if (dragRef.current === null || !event.isPrimary) return;
            segui((dragRef.current - event.clientX) / PX_PER_PASSO);
          }}
          onPointerUp={(event) => {
            if (dragRef.current === null || !event.isPrimary) return;
            const progresso = (dragRef.current - event.clientX) / PX_PER_PASSO;
            dragRef.current = null;
            scatta(progresso > SOGLIA ? 1 : progresso < -SOGLIA ? -1 : 0);
          }}
          onPointerCancel={() => {
            if (dragRef.current === null) return;
            dragRef.current = null;
            scatta(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") scatta(1);
            else if (event.key === "ArrowLeft") scatta(-1);
            else return;
            event.preventDefault();
          }}
        >
          <EmblemaVia>
            {/* Una sfumatura per via, in dissolvenza incrociata al cambio. */}
            {catalog.vie.map((item) => {
              const colore = COLORI_VIE[item.key];
              if (!colore) return null;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "pointer-events-none absolute inset-0 z-10 mix-blend-screen transition-opacity duration-700 ease-in-out",
                    item.key === via.key ? "opacity-100" : "opacity-0",
                  )}
                  style={{ background: `linear-gradient(to bottom, black 40%, ${colore})` }}
                />
              );
            })}
          </EmblemaVia>

          <div className="relative mb-6 mt-6 flex w-full justify-center px-2">
            <div aria-hidden className="absolute bottom-0 h-px w-4/5 bg-[#999999]" />
            <span aria-hidden className="relative top-1 bg-background px-2 text-[10px] text-[#999999]">
              ▲
            </span>
          </div>

          <div
            ref={testiRef}
            aria-live="polite"
            className="flex min-h-44 w-full flex-col items-center gap-3 text-center"
          >
            <h4 className="text-balance font-sprat text-5xl font-extralight uppercase leading-none tracking-[-0.07em] sm:text-7xl">
              {via.name}
            </h4>
            {via.description && (
              <p className="max-w-sm px-4 text-sm leading-tight text-muted-foreground">
                {via.description}
              </p>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden shrink-0 rounded-full sm:inline-flex"
          onClick={() => scatta(1)}
        >
          <ArrowRight />
          <span className="sr-only">Via successiva</span>
        </Button>
      </div>

      <TutorialGesto visibile={tutorial} onChiudi={() => setTutorial(false)} />
    </StepSection>
  );
}

/**
 * Il suggerimento del gesto, sopra tutta la pagina (nav compresa) finché non
 * lo si tocca. Sta in un portale su `body`: dentro lo step `fixed` si
 * aggancerebbe al contenitore che `StepAnimation` sta traslando. Il nodo si
 * monta dopo il primo render, come in `NavAction`.
 */
function TutorialGesto({ visibile, onChiudi }: { visibile: boolean; onChiudi: () => void }) {
  const [portale, setPortale] = useState<HTMLElement | null>(null);
  const manoRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setPortale(document.body);
  }, []);

  // La mano scorre da destra a sinistra finché il suggerimento è aperto; con
  // "riduci movimento" resta ferma.
  useGSAP(
    () => {
      if (!visibile || !manoRef.current) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.to(manoRef.current, {
          keyframes: {
            "0%": { x: 30, opacity: 0 },
            "30%": { opacity: 1 },
            "70%": { opacity: 1 },
            "100%": { x: -30, opacity: 0 },
          },
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
        });
      });
    },
    { dependencies: [visibile, portale], revertOnUpdate: true },
  );

  if (!portale) return null;

  return createPortal(
    <button
      type="button"
      inert={!visibile}
      onClick={onChiudi}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/60 px-8 text-white backdrop-blur-sm transition-opacity duration-700",
        visibile ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <svg
        ref={manoRef}
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-16 w-16"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5"
        />
      </svg>
      <span className="text-center text-lg font-bold">
        Scorri col dito verso destra o sinistra per esplorare le Vie.
      </span>
    </button>,
    portale,
  );
}
