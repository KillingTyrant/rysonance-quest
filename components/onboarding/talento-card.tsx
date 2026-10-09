import Image, { type StaticImageData } from "next/image";

import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Talento } from "@/lib/onboarding/types";

import { useCentraAllaApertura } from "./use-centra-alla-apertura";

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
 * La card di un talento a scelta, con i due stati e il comportamento della card
 * della razza: chiusa è la copertina con il nome, aperta — quando è il talento
 * scelto — prende l'altezza piena. Un tocco la apre e la porta al centro dello
 * schermo, un secondo la richiude; l'illustrazione scivola fra i due stati.
 * Senza bordo in entrambi: la scelta si legge dall'altezza della card.
 *
 * A differenza della razza il nome non si sposta e non cresce: resta in basso a
 * sinistra, allo stesso corpo, aperta o chiusa. Sotto la copertina può stare la
 * descrizione di atmosfera, dentro lo stesso bottone.
 */
export function TalentoCard({
  talento,
  selected,
  image,
  onSelect,
  hideDescription = false,
}: TalentoCardProps) {
  const { ref, segnaTocco } = useCentraAllaApertura<HTMLButtonElement>(selected);

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      onClick={() => {
        segnaTocco();
        onSelect();
      }}
      className={cn(
        cardVariants({ size: selected ? "expanded" : "compact" }),
        // Come la razza: niente bordo, e il focus da tastiera è un anello interno.
        "flex scroll-mt-nav flex-col overflow-hidden border-0 text-left uppercase",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
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
               padding e gap), aperta le prende tutte e tre. Chiusa conta anche
               l'ingrandimento di 1,1 (323px → 355px). */
            sizes={
              selected
                ? "(min-width: 1024px) 992px, 100vw"
                : "(min-width: 1024px) 355px, (min-width: 640px) 55vw, 110vw"
            }
            placeholder="blur"
            className={cn(
              /* L'arte non ha un soggetto da inquadrare come quella della
                 razza: chiusa è appena ingrandita, aperta torna a riempire la
                 card, così aprendo e chiudendo l'illustrazione scivola fra i
                 due stati invece di saltare. */
              "object-cover transition-transform duration-500 ease-in-out motion-reduce:transition-none",
              selected ? "scale-100" : "scale-110",
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
