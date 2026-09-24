import Image from "next/image";

import { CATALOG_IMAGES } from "@/assets/catalog";
import { cn } from "@/lib/utils";

import { RazzaCard } from "../razza-card";
import { StepSection } from "../step-section";
import type { StepProps } from "../wizard-steps";

/**
 * Chi è il personaggio: da dove viene, cioè la razza. Il nome invece si scrive
 * nella hub, prima di creare l'eroe.
 */
export function IdentitaStep({ catalog, draft, onChange }: StepProps) {
  return (
    <StepSection>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.razze.map((item, i) => {
          const selected = draft.razza_key === item.key;
          const illustrazione = CATALOG_IMAGES.razze[item.key];

          return (
            <div key={item.key} className={selected ? "sm:col-span-2 lg:col-span-3" : undefined}>
              <RazzaCard
                razza={item}
                selected={selected}
                media={
                  illustrazione ? (
                    <Image
                      src={illustrazione}
                      // Decorativa: il nome della razza è già nel titolo della card.
                      alt=""
                      fill
                      /* La card chiusa è un terzo della griglia (max-w-5xl meno
                         padding e gap), aperta le prende tutte e tre: `sizes`
                         segue i due stati, o il browser scarica l'immagine
                         grande anche per le card piccole. */
                      sizes={
                        selected
                          ? "(min-width: 1024px) 992px, 100vw"
                          : "(min-width: 1024px) 322px, (min-width: 640px) 50vw, 100vw"
                      }
                      placeholder="blur"
                      // Solo le prime tre card stanno above the fold.
                      priority={i < 3}
                      className={cn(
                        // Aperta o chiusa l'immagine riempie la card: cambia
                        // l'inquadratura, non il ritaglio.
                        "object-cover transition-[object-position] duration-500 ease-in-out",
                        selected ? "object-top" : "object-center",
                      )}
                    />
                  ) : null
                }
                onSelect={() => onChange({ razza_key: item.key })}
              />
            </div>
          );
        })}
      </div>
    </StepSection>
  );
}
