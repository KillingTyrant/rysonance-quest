import { isRazzaGiocabile, tribuByKey } from "@/lib/onboarding/selectors";
import { SESSI } from "@/lib/onboarding/types";

import { OptionCard } from "../option-card";
import { RazzaCard } from "../razza-card";
import { StepSection } from "../step-section";
import type { StepProps } from "../wizard-steps";
//
import Image from "next/image"; 
import { cn } from "@/lib/utils";
import { CATALOG_IMAGES } from "@/assets/catalog";

/**
 * Chi è il personaggio: sesso e da dove viene. La razza decide il talento
 * razziale e le tribù disponibili. Il nome invece si sceglie per ultimo, nel
 * riepilogo, a eroe completo.
 */
export function IdentitaStep({ catalog, draft, onChange }: StepProps) {
  const tribu = tribuByKey(catalog, draft.tribu_key);
  const hp = tribu?.base_hp ?? null;
  const mana = tribu?.base_mana ?? null;
  // La velocità mostrata nella card aperta: quella della tribù scelta, la
  // stessa che il riepilogo mostra e che la RPC scrive alla creazione.
  const speed = tribu?.base_speed ?? null;

  return (
    <>
      <StepSection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SESSI.map((item) => ( //ciclo di stampa dei sessi
            <OptionCard
              key={item.key}
              title={item.name}
              selected={draft.sesso === item.key}
              onSelect={() => onChange({ sesso: item.key })}
            />
          ))}
        </div>
      </StepSection>

      <StepSection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.razze.map((item, i) => ( //ciclo di stampa delle razza-card
            <div
              key={item.key}
              className={draft.razza_key === item.key ? "sm:col-span-2 lg:col-span-3" : undefined}
            >
              <RazzaCard
                razza={item}
                selected={draft.razza_key === item.key} //logica per espandere card al click
                tribuKey={draft.tribu_key}
                disabled={!isRazzaGiocabile(item)}
                disabledReason="Non ancora giocabile: mancano le tribù."
                hp={hp}
                mana={mana}
                speed={speed}
                media={
                  CATALOG_IMAGES.razze[item.key] ? (
                    <div className="absolute inset-0 pointer-events-none">
                      <Image
                        src={CATALOG_IMAGES.razze[item.key]!}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 214px, (min-width: 640px) 50vw, 92vw"
                        placeholder="blur"
                        // Preload esplicito solo per le prime 3 card visibili above-the-fold
                        priority={i < 3}
                        className={cn(
                          "transition-all duration-500 ease-in-out",
                          // Ora l'immagine riempie l'intera card (sfondo) in entrambi gli stati.
                          // Cambiamo solo il "fuoco" dell'inquadratura (top da aperta, center da chiusa).
                          draft.razza_key === item.key
                            ? "object-cover object-top"
                            : "object-cover object-center"
                        )}
                      />
                    </div>
                  ) : null
                }
                onSelect={() => onChange({ razza_key: item.key })} //al click imposta razza_key alla card cliccata riga50
                onSelectTribu={(key) => onChange({ tribu_key: key })}
              />
            </div>
          ))}
        </div>
      </StepSection>
    </>
  );
}
