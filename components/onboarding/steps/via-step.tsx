"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { CATALOG_IMAGES } from "@/assets/catalog";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EmblemaVia } from "../emblema-via";
import type { StepProps } from "../wizard-steps";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * Il posto dell'icona di ogni via sull'anello medio, per chiave del DB: quanti
 * scatti in senso orario, dall'emblema com'è disegnato, la portano sull'asse
 * del ▲. Le icone sono a coppie opposte, quindi ogni `POSTI` scatti l'anello
 * torna a mostrare le stesse. È presentazione come le icone di
 * `CATALOG_IMAGES`: una via senza posto non compare sull'emblema.
 */
const POSTI_VIE: Record<string, number | undefined> = {
  viandante: 0,
  sapiente: 1,
  combattente: 2,
};
const POSTI = 3;

/** Di quanto l'emblema accenna da solo il gesto, in frazioni di scatto. */
const ACCENNO = 0.3;

/** La rotazione degli anelli dopo `scatti` scatti: ognuno gira dei suoi `data-gradi`. */
function anelliA(scatti: number) {
  return {
    rotation: (_: number, anello: HTMLElement) => scatti * Number(anello.dataset.gradi),
  };
}

/**
 * Nome e descrizione a `scarto` di scatto dall'asse: sfumano e scivolano col
 * dito, e a metà strada (±0,5) sono spariti, così lì possono lasciare il posto
 * a quelli della via accanto.
 */
function testiA(scarto: number) {
  return {
    opacity: Math.max(0, 1 - Math.abs(scarto) * 2),
    x: -scarto * 20,
  };
}

/**
 * Quanti px di trascinamento valgono uno scatto: l'arco che l'icona sull'asse
 * percorre in 60°, a circa metà lato dal centro. Così l'icona resta sotto il
 * dito, qualunque sia la misura dell'emblema.
 */
function pxPerScatto(lato: number) {
  return lato > 0 ? (lato / 2) * (Math.PI / 3) : 150;
}


/**
 * La Via: il percorso di crescita, il modo in cui il personaggio sta al mondo.
 * Non porta talenti e non dice quanti se ne scelgono — quel numero è lo stesso
 * per tutte le Vie (`TALENTI_DA_SCEGLIERE`).
 *
 * Ogni via ha la sua icona sull'anello medio, e la via scelta è quella con
 * l'icona sul ▲. Trascinando in orizzontale (dito o mouse) l'emblema gira con
 * il dito, a destra o a sinistra, e la via cambia appena un'altra icona è più
 * vicina all'asse; al rilascio gli anelli finiscono di girare fino all'icona
 * più vicina. Frecce e tastiera fanno uno scatto alla volta. "Seleziona" nella
 * nav conferma la via sull'asse.
 */
export function ViaStep({ catalog, draft, onChange }: StepProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const testiRef = useRef<HTMLDivElement>(null);
  const emblemaRef = useRef<HTMLDivElement>(null);

  const vie = catalog.vie.filter((item) => POSTI_VIE[item.key] !== undefined);
  const via = vie.find((item) => item.key === draft.via_key) ?? vie[0];
  const primaVia = vie[0]?.key;
  const razza = draft.razza_key ? CATALOG_IMAGES.razzeEmblemi[draft.razza_key] : undefined;

  // Gli scatti dall'emblema com'è disegnato. Non si riportano mai nel primo
  // giro: gli anelli girano sempre nel verso del gesto, e il posto sull'asse è
  // il resto della divisione per `POSTI`. Si parte dal posto della via scelta,
  // così rientrando nello step l'emblema è dove lo si era lasciato.
  const scattiRef = useRef(via ? (POSTI_VIE[via.key] ?? 0) : 0);
  // Il trascinamento in corso: da dove sono partiti dito e anelli, e quanti px
  // vale uno scatto. `null` se non ce n'è uno.
  const dragRef = useRef<{ x: number; scatti: number; px: number } | null>(null);
  const accennoRef = useRef<gsap.core.Timeline | null>(null);
  // Il suggerimento del gesto è per chi non ha ancora scelto una via: sparisce
  // al primo gesto, e rientrando nello step non torna.
  const [suggerimento, setSuggerimento] = useState(draft.via_key === null);

  // Entrando senza una scelta la via sull'asse è la prima: la si sceglie
  // subito, così "Seleziona" conferma quello che si vede.
  useEffect(() => {
    if (!draft.via_key && primaVia) onChange({ via_key: primaVia });
  }, [draft.via_key, primaVia, onChange]);

  // Gli anelli partono girati sulla via scelta. Poi, invece di spiegare il
  // gesto, l'emblema lo accenna: mezzo scatto verso la via accanto e ritorno,
  // ripetuto finché non lo si tocca. Parte dopo l'entrata dello step
  // (`StepAnimation`); con "riduci movimento" resta solo la scritta sotto
  // l'emblema.
  const { contextSafe } = useGSAP(
    () => {
      const scatti = scattiRef.current;
      gsap.set("[data-gradi]", anelliA(scatti));
      if (!suggerimento) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        accennoRef.current = gsap
          .timeline({ delay: 1, repeat: -1, repeatDelay: 2.5 })
          .to("[data-gradi]", { ...anelliA(scatti + ACCENNO), duration: 0.5, ease: "power2.out" })
          .to(testiRef.current, { ...testiA(ACCENNO), duration: 0.5, ease: "power2.out" }, "<")
          .to("[data-gradi]", { ...anelliA(scatti), duration: 0.6, ease: "power2.inOut" })
          .to(testiRef.current, { ...testiA(0), duration: 0.6, ease: "power2.inOut" }, "<");
      });
    },
    { scope: rootRef },
  );

  /** La via con l'icona sull'asse dopo `scatti` scatti, se quel posto ne ha una. */
  function viaA(scatti: number) {
    const posto = ((scatti % POSTI) + POSTI) % POSTI;
    return vie.find((item) => POSTI_VIE[item.key] === posto);
  }

  function scegli(scatti: number) {
    const scelta = viaA(scatti);
    if (scelta && scelta.key !== draft.via_key) onChange({ via_key: scelta.key });
  }

  /** Al primo gesto il suggerimento ha fatto il suo lavoro: l'emblema torna fermo. */
  function fermaSuggerimento() {
    accennoRef.current?.totalProgress(0).kill();
    accennoRef.current = null;
    setSuggerimento(false);
  }

  function durata(secondi: number) {
    return window.matchMedia(MOTION_OK).matches ? secondi : 0;
  }

  /** Gli anelli seguono il dito, e la via è quella con l'icona più vicina all'asse. */
  const segui = contextSafe((scatti: number) => {
    const vicino = Math.round(scatti);
    gsap.set("[data-gradi]", { ...anelliA(scatti), overwrite: true });
    gsap.set(testiRef.current, { ...testiA(scatti - vicino), overwrite: true });
    scegli(vicino);
  });

  /**
   * Fine del trascinamento: gli anelli finiscono di girare fino all'icona più
   * vicina all'asse, avanti o indietro. Un posto senza via riporta dove si era
   * partiti.
   */
  const rilascia = contextSafe((scatti: number, partenza: number) => {
    const vicino = Math.round(scatti);
    scattiRef.current = viaA(vicino) ? vicino : partenza;
    gsap.to("[data-gradi]", {
      ...anelliA(scattiRef.current),
      duration: durata(0.4),
      ease: "power2.out",
      overwrite: true,
    });
    gsap.to(testiRef.current, { ...testiA(0), duration: durata(0.3), overwrite: true });
    scegli(scattiRef.current);
  });

  /** Frecce e tastiera: uno scatto, e i testi della via nuova entrano dal suo lato. */
  const scatta = contextSafe((passo: 1 | -1) => {
    const scatti = scattiRef.current + passo;
    if (!viaA(scatti)) return;
    fermaSuggerimento();
    scattiRef.current = scatti;
    gsap.to("[data-gradi]", {
      ...anelliA(scatti),
      duration: durata(0.6),
      ease: "power2.out",
      overwrite: true,
    });
    scegli(scatti);
    gsap.fromTo(
      testiRef.current,
      { opacity: 0, x: 30 * passo },
      { ...testiA(0), duration: durata(0.5), delay: durata(0.1), overwrite: true },
    );
  });

  if (!via) return null;

  // Lo step è a schermo intero (`schermoIntero` in `WIZARD_STEPS`): riempie
  // l'altezza sotto l'header, e non ha "Indietro" (`senzaIndietro`).
  return (
    <div className="flex flex-1 flex-col pb-6 pt-3">
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
          tornano dov'erano. Il pointer capture tiene il trascinamento anche
          quando il dito esce dall'emblema.
        */}
        <div
          role="group"
          aria-roledescription="carosello"
          aria-label="Vie"
          tabIndex={0}
          className="flex w-80 max-w-full cursor-grab touch-pan-y select-none flex-col items-center justify-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing sm:w-[28rem]"
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            const emblema = emblemaRef.current;
            const lato = emblema ? Math.min(emblema.clientWidth, emblema.clientHeight) : 0;
            dragRef.current = { x: event.clientX, scatti: scattiRef.current, px: pxPerScatto(lato) };
            fermaSuggerimento();
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || !event.isPrimary) return;
            // Il dito verso sinistra porta l'icona sull'asse a sinistra: senso orario.
            segui(drag.scatti + (drag.x - event.clientX) / drag.px);
          }}
          onPointerUp={(event) => {
            const drag = dragRef.current;
            if (!drag || !event.isPrimary) return;
            dragRef.current = null;
            rilascia(drag.scatti + (drag.x - event.clientX) / drag.px, drag.scatti);
          }}
          onPointerCancel={() => {
            const drag = dragRef.current;
            if (!drag) return;
            dragRef.current = null;
            rilascia(drag.scatti, drag.scatti);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") scatta(1);
            else if (event.key === "ArrowLeft") scatta(-1);
            else return;
            event.preventDefault();
          }}
        >
          {/*
            L'emblema prende l'altezza che resta dopo asse e testi, fino a
            20rem: sui telefoni bassi (iPhone SE) si rimpicciolisce invece di
            spingere i testi sotto la piega. Lo misura il riquadro con
            `container-type: size`, e `min-h-32` è il minimo sotto cui la
            pagina torna a scorrere. Sugli schermi alti, oltre i 20rem, lo
            spazio in più va sopra e sotto il blocco, che resta unito. Il
            limite sta in `max-w` e non in `w`: dove le unità `cq` non ci sono
            (iOS 15) la regola cade e l'emblema resta largo quanto il riquadro,
            invece di sparire.
          */}
          <div
            ref={emblemaRef}
            className="flex max-h-80 min-h-32 w-full flex-1 items-center justify-center [container-type:size]"
          >
            <EmblemaVia razza={razza} className="w-full max-w-[min(100cqw,100cqh)]" />
          </div>

          {/* L'asse di scelta: il ▲ segna dove si ferma l'icona della via scelta. */}
          <div aria-hidden className="relative mt-6 h-px w-full bg-[#999999]">
            <svg
              viewBox="0 0 8 10"
              className="absolute bottom-full left-1/2 h-2.5 w-2 -translate-x-1/2 fill-[#999999]"
            >
              <path d="M4 0L8 10H0Z" />
            </svg>
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
            griglia, e si vede solo quella sull'asse: così il blocco è sempre
            alto quanto la via con nome, titolo e descrizione più lunghi. Se l'altezza
            seguisse la via attiva, l'emblema (che prende lo spazio che resta)
            salterebbe su e giù a ogni cambio.

            La colonna è `minmax(0, 1fr)` e non `auto`: una colonna auto si
            allargherebbe alla parola più lunga fra tutte le vie, anche quelle
            nascoste, e sforerebbe solo a destra spostando il testo fuori asse.
            Per questo da sm la colonna è larga 28rem: il nome in text-7xl
            ("VIANDANTE", "GUERRIERO") non ci starebbe nei 20rem dell'emblema.
          */}
          <div
            ref={testiRef}
            aria-live="polite"
            className="mt-3 grid w-full grid-cols-[minmax(0,1fr)]"
          >
            {vie.map((item) => (
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
                {/* Il titolo (il nome del talento di via) è l'intestazione
                    della descrizione: stanno attaccati nello stesso blocco, in
                    Cabinet come il resto dell'app, e dal nome li separa il gap
                    della colonna. Corpi dal design: 16px bold e 14px. */}
                {(item.title || item.description) && (
                  <div className="max-w-sm">
                    {item.title && (
                      <h5 className="text-balance text-base font-bold leading-none">
                        {item.title}
                      </h5>
                    )}
                    {item.description && (
                      <p className="text-sm font-normal leading-none tracking-[-0.011em]">
                        {item.description}
                      </p>
                    )}
                  </div>
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
