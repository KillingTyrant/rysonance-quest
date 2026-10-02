import { TALENTI_DA_SCEGLIERE } from "@/lib/onboarding/validate";

import { StepSection } from "../step-section";
import { TalentoCard } from "../talento-card";
import type { StepProps } from "../wizard-steps";

/**
 * Gli unici talenti che sceglie l'utente: li prende da tutta la lista, senza
 * vincoli.
 *
 * Si sceglie come la razza: si tocca una card e quella si apre, e toccarne
 * un'altra sposta la scelta invece di aggiungerla. Non c'è niente da
 * deselezionare né card disabilitate: oltre `TALENTI_DA_SCEGLIERE` esce il
 * talento scelto per primo.
 *
 * Quanti se ne scelgono è lo stesso numero per tutte le Vie
 * (`TALENTI_DA_SCEGLIERE`): non dipende più dalla Via e il database non lo
 * impone. Il gate di "Seleziona" legge `validateDraft`, che usa la stessa
 * costante: le due non possono divergere.
 */
export function TalentiStep({ catalog, draft, onChange }: StepProps) {
  function scegli(key: string) {
    onChange({
      talenti: [...draft.talenti.filter((scelto) => scelto !== key), key].slice(
        -TALENTI_DA_SCEGLIERE,
      ),
    });
  }

  return (
    <StepSection>
      {catalog.talentiScelta.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun talento disponibile.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.talentiScelta.map((talento) => {
            const selected = draft.talenti.includes(talento.key);
            return (
              <div
                key={talento.key}
                className={selected ? "sm:col-span-2 lg:col-span-3" : undefined}
              >
                <TalentoCard
                  talento={talento}
                  // image={CATALOG_IMAGES.talenti[talento.key]}
                  selected={selected}
                  onSelect={() => scegli(talento.key)}
                  hideDescription={true}
                />
              </div>
            );
          })}
        </div>
      )}
    </StepSection>
  );
}
