import { CATALOG_IMAGES } from "@/assets/catalog";
import { talentiDaScegliere, viaByKey } from "@/lib/onboarding/selectors";

import { StepSection } from "../step-section";
import { TalentoCard } from "../talento-card";
import type { StepProps } from "../wizard-steps";

/**
 * Gli unici talenti che sceglie l'utente: li prende da tutta la lista, senza
 * vincoli.
 *
 * Quanti se ne scelgono lo decide la Via: due, tre per il Viandante, che apre
 * con "giusta scelta". Il numero non è scritto qui.
 */
export function TalentiStep({ catalog, draft, onChange }: StepProps) {
  const quanti = talentiDaScegliere(viaByKey(catalog, draft.via_key));
  const completo = draft.talenti.length >= quanti;

  function toggle(key: string) {
    onChange({
      talenti: draft.talenti.includes(key)
        ? draft.talenti.filter((scelto) => scelto !== key)
        : [...draft.talenti, key],
    });
  }

  return (
    <StepSection
      title="Talenti"
      description={`Scegline ${quanti} fra tutti quelli disponibili. Nessuna combinazione è vietata: gli altri talenti del personaggio arrivano già da razza, tribù e Via.`}
      // Detto una volta qui invece che su ognuna delle card disabilitate, che
      // sono tutte quelle non scelte.
      hint={undefined}
    >
      <p className="text-sm font-medium" role="status" aria-live="polite">
        {draft.talenti.length} di {quanti} scelti
      </p>

      {catalog.talentiScelta.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun talento disponibile.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.talentiScelta.map((talento) => {
            const selected = draft.talenti.includes(talento.key);
            return (
              <TalentoCard
                key={talento.key}
                talento={talento}
                image={CATALOG_IMAGES.talenti[talento.key]}
                selected={selected}
                disabled={completo && !selected}
                onSelect={() => toggle(talento.key)}
              />
            );
          })}
        </div>
      )}
    </StepSection>
  );
}
