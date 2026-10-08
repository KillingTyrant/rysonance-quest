import Image, { type StaticImageData } from "next/image";

import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Talento } from "@/lib/onboarding/types";

type TalentoCardProps = {
  talento: Talento;
  selected: boolean;
  /** L'illustrazione del talento (vedi `CATALOG_IMAGES.talenti`). */
  image?: StaticImageData;
  onSelect: () => void;
  /** Nasconde la descrizione del talento sotto l'immagine. */
  hideDescription?: boolean;
};

/**
 * La card di un talento a scelta, con i due stati della card della razza:
 * chiusa è la copertina con il nome, aperta — quando è il talento scelto —
 * prende l'altezza piena. A differenza della razza il nome non si sposta e non
 * cresce: resta in basso a sinistra, allo stesso corpo, aperta o chiusa.
 *
 * Sotto la copertina può stare la descrizione di atmosfera. È un solo bottone,
 * e lo stato scelto si legge dall'altezza e dal bordo, non solo dal colore.
 */
export function TalentoCard({
  talento,
  selected,
  image,
  onSelect,
  hideDescription = false,
}: TalentoCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        cardVariants({ size: selected ? "expanded" : "compact" }),
        "group flex flex-col overflow-hidden text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      <span className="relative flex min-h-0 w-full flex-1 flex-col justify-end overflow-hidden bg-muted p-2 font-sprat">
        {image && (
          <Image
            src={image}
            // Decorativa: il nome del talento è già sulla copertina.
            alt=""
            fill
            /* Come la razza: chiusa è un terzo della griglia (max-w-5xl meno
               padding e gap), aperta le prende tutte e tre. */
            sizes={
              selected
                ? "(min-width: 1024px) 992px, 100vw"
                : "(min-width: 1024px) 323px, (min-width: 640px) 50vw, 100vw"
            }
            placeholder="blur"
            className={cn(
              "object-cover transition-transform duration-500",
              "motion-safe:group-hover:scale-105",
            )}
          />
        )}

        {/* Come nella card della razza: il velo sta solo in fondo, sotto il
            nome, e parte da nero e non da `card`. L'arte è fitta e colorata,
            quindi il nome è bianco in entrambi i temi e il contrasto non deve
            dipendere dal tema. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-black/70 to-transparent"
        />

        {/* <span
          aria-hidden
          className={cn(
            "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 transition",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-white/80 bg-black/30 text-transparent",
          )}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </span> */}

        {/* <span className="absolute inset-x-0 bottom-0 px-4 pb-2 text-2xl font-medium uppercase leading-none tracking-tight">
          {talento.name}
        </span> */}
        {/* Aperta o chiusa, le stesse classi: il nome resta ancorato in basso a
            sinistra e non cambia corpo (la razza invece lo centra e lo ingrandisce). */}
        <span className="relative block text-5xl text-white">{talento.name.split(" ")[0]}</span>
        <span className="relative block text-5xl text-white">{talento.name.split(" ").slice(1).join(" ")}</span>

      </span>

      {!hideDescription && talento.description && (
        <span className="px-4 pb-4 pt-2 text-sm leading-relaxed text-muted-foreground">
          {talento.description}
        </span>
      )}
    </button>
  );
}
