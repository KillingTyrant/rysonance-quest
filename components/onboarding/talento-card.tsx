import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Talento } from "@/lib/onboarding/types";

type TalentoCardProps = {
  talento: Talento;
  selected: boolean;
  disabled?: boolean;
  /** L'illustrazione del talento (vedi `CATALOG_IMAGES.talenti`). */
  // image?: StaticImageData;
  onSelect: () => void;
  /** Nasconde la descrizione del talento sotto l'immagine. */
  hideDescription?: boolean;
};

/**
 * La card di un talento a scelta: copertina illustrata con il nome sopra, e
 * sotto la descrizione di atmosfera. È un solo bottone — non ha scelte annidate
 * come la card della razza — e lo stato scelto si legge dal bordo e dal segno
 * di spunta nell'angolo, non solo dal colore.
 */
export function TalentoCard({
  talento,
  selected,
  disabled = false,
  // image = undefined,
  onSelect,
  hideDescription = false,
}: TalentoCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        cardVariants(),
        "group flex h-full flex-col overflow-hidden text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary ring-2 ring-primary"
          : "hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md",
        disabled && "cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow",
      )}
    >
      <span className="relative flex flex-col align-bottom h-52 w-full shrink-0 overflow-hidden bg-muted justify-end p-2">
        {/* {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
            className={cn(
              "object-cover transition-transform duration-500",
              !disabled && "motion-safe:group-hover:scale-105",
            )}
          />
        ) : (
          <Sparkles
            aria-hidden
            className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
          />
        )} */}

        {/* Come nella card della razza: il velo parte da `card`, il colore
            sotto la copertina, così il nome resta leggibile in entrambi i temi
            e l'immagine sfuma nel corpo della card senza uno stacco netto. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-card via-card/20 to-transparent"
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
        <span className="block text-5xl">{talento.name.split(" ")[0]}</span>
        <span className="block text-5xl">{talento.name.split(" ").slice(1).join(" ")}</span>

      </span>

      {!hideDescription && talento.description && (
        <span className="px-4 pb-4 pt-2 text-sm leading-relaxed text-muted-foreground">
          {talento.description}
        </span>
      )}
    </button>
  );
}
