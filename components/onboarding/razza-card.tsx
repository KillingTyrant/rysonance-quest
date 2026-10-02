import { useEffect, useRef, type ReactNode } from "react";

import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Razza } from "@/lib/onboarding/types";

type RazzaCardProps = {
  razza: Razza;
  selected: boolean;
  disabled?: boolean;
  /** Perché la razza non è selezionabile (mostrato sulla copertina). */
  disabledReason?: string;
  /** L'illustrazione della razza, a tutta card (vedi docs/immagini_catalogo.md). */
  media?: ReactNode;
  onSelect: () => void;
};

/**
 * La card di scelta della razza, nei suoi due stati: chiusa mostra copertina e
 * nome in piccolo, aperta — quando è la razza scelta — li mostra in grande.
 * Senza bordo in entrambi: la scelta si legge dall'altezza della card. Un
 * tocco la apre e la porta al centro dello schermo, un secondo la richiude.
 */
export function RazzaCard({
  razza,
  selected,
  disabled = false,
  disabledReason,
  media,
  onSelect,
}: RazzaCardProps) {
  // Un nome composto ("Gata-Ari") sul telefono non sta su una riga a 120px e
  // va a capo dopo il trattino: su due righe il design lo vuole a 105px. Da
  // `sm` la card aperta è larga almeno due colonne e ogni nome ci sta intero.
  const nomeComposto = /[\s-]/.test(razza.name);

  const cardRef = useRef<HTMLDivElement>(null);
  // Si centra solo la card appena aperta da un tocco: rientrando nello step con
  // la razza già scelta la pagina resta in cima, dove la porta il wizard.
  const centraAllaApertura = useRef(false);

  useEffect(() => {
    if (!selected || !centraAllaApertura.current) return;
    centraAllaApertura.current = false;
    const movimento = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    cardRef.current?.scrollIntoView({ block: "center", behavior: movimento ? "smooth" : "auto" });
  }, [selected]);

  return (
    <div
      ref={cardRef}
      className={cn(
        cardVariants({ size: selected ? "expanded" : "compact" }),
        // `scroll-mt-nav`: centrata nello spazio sotto la nav sticky, non
        // nell'intera finestra, dove la nav ne coprirebbe la cima.
        "flex scroll-mt-nav flex-col overflow-hidden border-0",
        disabled && "opacity-50",
      )}
    >
      {/*
        Il bottone è lo stesso elemento aperta e chiusa, così React lo
        riconcilia invece di rimontarlo e il focus da tastiera non si perde
        nell'istante in cui la card si apre.
      */}
      <button
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => {
          centraAllaApertura.current = !selected;
          onSelect();
        }}
        className={cn(
          "relative flex min-h-0 flex-1 overflow-hidden bg-muted text-left",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
          disabled && "cursor-not-allowed",
        )}
      >
        {media}

        {/*
          Il velo serve solo al nome: sta nei 150px in fondo, alta uguale
          aperta e chiusa, e non scurisce il resto dell'illustrazione. Parte da
          nero e non da `background`: sotto c'è sempre un'illustrazione, non la
          superficie della card, quindi il nome è bianco in entrambi i temi e il
          contrasto non deve dipendere dal tema.
        */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-black/70 to-transparent"
        />

        <span className="relative flex h-full w-full flex-col p-4">
          <span
            className={cn(
              "flex flex-1 items-end",
              selected ? "justify-center pb-4" : "justify-end",
            )}
          >
            {/* I corpi del mockup valgono su ogni schermo, telefono compreso:
                72px chiusa, 120px aperta (105px per i nomi su due righe). */}
            <span
              className={cn(
                "font-sprat uppercase leading-none tracking-[-0.08em] text-white",
                selected
                  ? cn(
                      "text-center font-extralight",
                      nomeComposto ? "text-[105px] sm:text-[120px]" : "text-[120px]",
                    )
                  : "text-right font-normal text-[72px]",
              )}
            >
              {razza.name}
            </span>
          </span>

          {/* Bianco smorzato e non `muted-foreground`: sta sopra il velo scuro,
              dove il colore del tema chiaro sparirebbe. */}
          {disabled && disabledReason && (
            <span className="text-xs text-white/80">{disabledReason}</span>
          )}
        </span>
      </button>
    </div>
  );
}
