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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                         grande anche per le card piccole. Chiusa conta anche
                         l'ingrandimento di 1,65 (322px → 531px). */
                      sizes={
                        selected
                          ? "(min-width: 1024px) 992px, 100vw"
                          : "(min-width: 1024px) 531px, (min-width: 640px) 83vw, 165vw"
                      }
                      placeholder="blur"
                      // Solo le prime tre card stanno above the fold.
                      priority={i < 3}
                      className={cn(
                        /* Dal mockup: chiusa l'illustrazione è ingrandita e
                           spostata di lato, con il teschio (al centro dell'arte
                           in orizzontale, verso il 55% in verticale) a un terzo
                           della card da sinistra; aperta torna a riempire la
                           card, centrata. Chiusa `object-[50%_57%]` mette il
                           teschio a metà altezza, e la scala 1,65 attorno al
                           75% della larghezza ne porta il centro a
                           75% − 1,65 × 25% ≈ 34%. L'origine è la stessa nei
                           due stati, così la transizione è uno scivolamento e
                           non un salto. Il ritaglio resta quello della card
                           (`overflow-hidden`): l'immagine non ne esce. */
                        "origin-[75%_50%] object-cover transition-[object-position,transform] duration-500 ease-in-out motion-reduce:transition-none",
                        selected ? "scale-100 object-top" : "scale-[1.65] object-[50%_57%]",
                      )}
                    />
                  ) : null
                }
                // Toccare la card aperta la richiude, e la razza torna da scegliere.
                onSelect={() => onChange({ razza_key: selected ? null : item.key })}
              />
            </div>
          );
        })}
      </div>
    </StepSection>
  );
}
