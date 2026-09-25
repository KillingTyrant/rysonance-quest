import type { ReactNode } from "react";

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
 */
export function RazzaCard({
  razza,
  selected,
  disabled = false,
  disabledReason,
  media,
  onSelect,
}: RazzaCardProps) {
  return (
    <div
      className={cn(
        cardVariants({ size: selected ? "expanded" : "compact" }),
        "flex flex-col overflow-hidden",
        selected && "border-primary ring-1 ring-primary",
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
        onClick={onSelect}
        className={cn(
          "relative flex min-h-0 flex-1 overflow-hidden bg-muted text-left",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
          disabled && "cursor-not-allowed",
        )}
      >
        {media}

        {/*
          Il velo parte da nero e non da `background`: sotto c'è sempre
          un'illustrazione, non la superficie della card, quindi il nome è bianco
          in entrambi i temi e il contrasto non deve dipendere dal tema.
        */}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        />

        <span className="relative flex h-full w-full flex-col p-4">
          <span
            className={cn(
              "flex flex-1 items-end",
              selected ? "justify-center pb-4" : "justify-end",
            )}
          >
            {/* I corpi del mockup — 72px chiusa, 120px aperta
                — valgono da `lg` in su: sotto scalano, altrimenti il nome di una
                razza lunga esce dalla card sul telefono. */}
            <span
              className={cn(
                "font-sprat uppercase leading-none tracking-[-0.08em] text-white",
                selected
                  ? "font-extralight text-6xl sm:text-8xl lg:text-[120px]"
                  : "text-right font-normal text-4xl sm:text-5xl lg:text-[72px]",
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
