import Image from "next/image";

import { CATALOG_IMAGES } from "@/assets/catalog";
import { isRazzaGiocabile, tribuByKey } from "@/lib/onboarding/selectors";
import { cn } from "@/lib/utils";

import { RazzaCard } from "../razza-card";
import { StepSection } from "../step-section";
import type { StepProps } from "../wizard-steps";

/**
 * Chi è il personaggio: da dove viene. La razza decide il talento razziale e
 * le tribù disponibili. Il nome invece si scrive nella hub, prima di creare
 * l'eroe.
 */
export function IdentitaStep({ catalog, draft, onChange }: StepProps) {
  const tribu = tribuByKey(catalog, draft.tribu_key);
  const hp = tribu?.base_hp ?? null;
  const mana = tribu?.base_mana ?? null;
  // La velocità mostrata nella card aperta: quella della tribù scelta, la
  // stessa che la RPC scrive alla creazione.
  const speed = tribu?.base_speed ?? null;

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
                tribuKey={draft.tribu_key}
                disabled={!isRazzaGiocabile(item)}
                disabledReason="Non ancora giocabile: mancano le tribù."
                hp={hp}
                mana={mana}
                speed={speed}
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
                onSelectTribu={(key) => onChange({ tribu_key: key })}
              />
            </div>
          );
        })}
      </div>
    </StepSection>
  );
}
