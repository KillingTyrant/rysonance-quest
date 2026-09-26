"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { gsap, useGSAP } from "@/components/motion/gsap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EmblemaVia } from "../emblema-via";
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

/** Di quanto l'emblema accenna da solo il gesto, in frazioni di passo. */
const ACCENNO = 0.3;

/** La rotazione degli anelli dopo `passi` passi: ognuno gira dei suoi `data-gradi`. */
function anelliA(passi: number) {
  return {
    rotation: (_: number, anello: HTMLElement) => passi * Number(anello.dataset.gradi),
  };
}

/** Nome e descrizione a `progresso` di passo dal centro: sfumano e scivolano via. */
function testiA(progresso: number) {
  return {
    opacity: Math.max(0, 1 - Math.abs(progresso) * 1.5),
    x: -progresso * 20,
  };
}

/** Dove sta la via `i` sul righello, in percentuale della sua larghezza. */
function posizione(i: number, count: number) {
  return `${((i + 0.5) / count) * 100}%`;
}

/**
 * La Via: il percorso di crescita, il modo in cui il personaggio sta al mondo.
 * Non porta talenti e non dice quanti se ne scelgono — quel numero è lo stesso
 * per tutte le Vie (`TALENTI_DA_SCEGLIERE`).
 *
 * Una via alla volta al centro dell'emblema: trascinando in orizzontale (dito
 * o mouse) gli anelli ruotano e allo scatto cambia via; frecce, tastiera e
 * tacche del righello fanno lo stesso. La via al centro è quella scelta, e
 * "Seleziona" nella nav la conferma.
 */
export function ViaStep({ catalog, draft, onChange }: StepProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const testiRef = useRef<HTMLDivElement>(null);
  // Passi fatti dall'ingresso nello step: gli anelli girano sempre nel verso
  // del gesto, anche quando l'indice della via ricomincia da capo.
  const passiRef = useRef(0);
  // Dove è partito il trascinamento in corso, `null` se non ce n'è uno.
  const dragRef = useRef<number | null>(null);
  const accennoRef = useRef<gsap.core.Timeline | null>(null);
  // Il suggerimento del gesto è per chi non ha ancora scelto una via: sparisce
  // al primo gesto, e rientrando nello step non torna.
  const [suggerimento, setSuggerimento] = useState(draft.via_key === null);

  const count = catalog.vie.length;
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

  // Invece di spiegare il gesto, l'emblema lo accenna: mezzo scatto verso la
  // via successiva e ritorno, ripetuto finché non lo si tocca. Parte dopo
  // l'entrata dello step (`StepAnimation`); con "riduci movimento" resta solo
  // la scritta sotto l'emblema.
  const { contextSafe } = useGSAP(
    () => {
      if (!suggerimento) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        accennoRef.current = gsap
          .timeline({ delay: 1, repeat: -1, repeatDelay: 2.5 })
          .to("[data-gradi]", { ...anelliA(ACCENNO), duration: 0.5, ease: "power2.out" })
          .to(testiRef.current, { ...testiA(ACCENNO), duration: 0.5, ease: "power2.out" }, "<")
          .to("[data-gradi]", { ...anelliA(0), duration: 0.6, ease: "power2.inOut" })
          .to(testiRef.current, { ...testiA(0), duration: 0.6, ease: "power2.inOut" }, "<");
      });
    },
    { scope: rootRef },
  );

  /** Al primo gesto il suggerimento ha fatto il suo lavoro: l'emblema torna fermo. */
  function fermaSuggerimento() {
    accennoRef.current?.totalProgress(0).kill();
    accennoRef.current = null;
    setSuggerimento(false);
  }

  /** Gli anelli seguono il trascinamento: `progresso` è la frazione di passo. */
  const segui = contextSafe((progresso: number) => {
    gsap.set("[data-gradi]", { ...anelliA(passiRef.current + progresso), overwrite: true });
    gsap.set(testiRef.current, { ...testiA(progresso), overwrite: true });
  });

  /** Chiude il gesto: `passo` vie avanti o indietro, `0` per tornare dove si era. */
  const scatta = contextSafe((passo: number) => {
    fermaSuggerimento();
    const tempo = window.matchMedia(MOTION_OK).matches ? 1 : 0;
    passiRef.current += passo;

    gsap.to("[data-gradi]", {
      ...anelliA(passiRef.current),
      duration: 0.6 * tempo,
      ease: "power2.out",
      overwrite: true,
    });

    if (passo === 0) {
      gsap.to(testiRef.current, { ...testiA(0), duration: 0.5 * tempo, overwrite: true });
      return;
    }

    onChange({ via_key: catalog.vie[(indice + passo + count) % count].key });
    gsap.fromTo(
      testiRef.current,
      { opacity: 0, x: 30 * Math.sign(passo) },
      { ...testiA(0), duration: 0.5 * tempo, delay: 0.1 * tempo, overwrite: true },
    );
  });

  if (!via) return null;

  // Lo step è a schermo intero (`schermoIntero` in `WIZARD_STEPS`): riempie
  // l'altezza sotto l'header, e "Indietro" sta in fondo.
  return (
    <div className="flex flex-1 flex-col pt-3">
      <div ref={rootRef} className="flex flex-1 justify-center gap-4">
        {/* Su mobile si trascina; le frecce servono da sm in su. */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden shrink-0 self-center rounded-full sm:inline-flex"
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
          className="flex w-80 max-w-full cursor-grab touch-pan-y select-none flex-col items-center justify-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing sm:w-[28rem]"
          onPointerDown={(event) => {
            // Le tacche del righello sono bottoni: il capture ruberebbe il loro click.
            if (!event.isPrimary || event.button !== 0) return;
            if ((event.target as Element).closest("button")) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = event.clientX;
            fermaSuggerimento();
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
          {/*
            L'emblema prende l'altezza che resta dopo righello e testi, fino a
            20rem: sui telefoni bassi (iPhone SE) si rimpicciolisce invece di
            spingere "Indietro" sotto la piega. Lo misura il riquadro con
            `container-type: size`, e `min-h-32` è il minimo sotto cui la
            pagina torna a scorrere. Sugli schermi alti, oltre i 20rem, lo
            spazio in più va sopra e sotto il blocco, che resta unito. Il
            limite sta in `max-w` e non in `w`: dove le unità `cq` non ci sono
            (iOS 15) la regola cade e l'emblema resta largo quanto il riquadro,
            invece di sparire.
          */}
          <div className="flex max-h-80 min-h-32 w-full flex-1 items-center justify-center [container-type:size]">
            <EmblemaVia className="w-full max-w-[min(100cqw,100cqh)]">
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
          </div>

          {/*
            Il righello: una tacca per via e il ▲ su quella al centro, così si
            vede quante vie ci sono e dove si è. Ogni tacca porta dritta alla
            sua via.
          */}
          <div className="relative mt-6 h-3 w-4/5 max-w-64">
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-[#999999]" />
            {catalog.vie.map((item, i) => (
              <button
                key={item.key}
                type="button"
                aria-label={item.name}
                aria-current={i === indice ? "true" : undefined}
                onClick={() => scatta(i - indice)}
                className="absolute bottom-0 flex h-6 w-8 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ left: posizione(i, count) }}
              >
                <span className="h-2 w-px bg-[#999999]" />
              </button>
            ))}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 -translate-x-1/2 translate-y-1/2 bg-background px-1 text-[10px] leading-none text-[#999999] transition-[left] duration-500 ease-out motion-reduce:transition-none"
              style={{ left: posizione(indice, count) }}
            >
              ▲
            </span>
          </div>

          <p
            aria-hidden={!suggerimento}
            className={cn(
              "flex h-6 items-end gap-2 text-xs text-muted-foreground transition-opacity duration-500",
              suggerimento ? "opacity-100" : "opacity-0",
            )}
          >
            <span aria-hidden>‹</span>
            Trascina per sfogliare le Vie
            <span aria-hidden>›</span>
          </p>

          {/*
            I testi di tutte le vie stanno sovrapposti nella stessa cella della
            griglia, e si vede solo quella al centro: così il blocco è sempre
            alto quanto la via con nome e descrizione più lunghi. Se l'altezza
            seguisse la via attiva, l'emblema (che prende lo spazio che resta)
            salterebbe su e giù a ogni cambio.

            La colonna è `minmax(0, 1fr)` e non `auto`: una colonna auto si
            allargherebbe alla parola più lunga fra tutte le vie, anche quelle
            nascoste, e sforerebbe solo a destra spostando il testo fuori asse.
            Per questo da sm la colonna è larga 28rem: il nome in text-7xl
            ("COMBATTENTE") non ci starebbe nei 20rem dell'emblema.
          */}
          <div
            ref={testiRef}
            aria-live="polite"
            className="mt-3 grid w-full grid-cols-[minmax(0,1fr)]"
          >
            {catalog.vie.map((item) => (
              <div
                key={item.key}
                className={cn(
                  "flex flex-col items-center gap-3 text-center [grid-area:1/1]",
                  item.key !== via.key && "invisible",
                )}
              >
                <h4 className="text-balance font-sprat text-5xl font-extralight uppercase leading-none tracking-[-0.07em] sm:text-7xl">
                  {item.name}
                </h4>
                {item.description && (
                  <p className="max-w-sm px-4 text-sm leading-tight text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden shrink-0 self-center rounded-full sm:inline-flex"
          onClick={() => scatta(1)}
        >
          <ArrowRight />
          <span className="sr-only">Via successiva</span>
        </Button>
      </div>
    </div>
  );
}
