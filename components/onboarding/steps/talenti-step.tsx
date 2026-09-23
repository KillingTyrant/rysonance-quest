import { quantiTalenti, TALENTI_DA_SCEGLIERE } from "@/lib/onboarding/validate";

import { StepSection } from "../step-section";
import { TalentoCard } from "../talento-card";
import type { StepProps } from "../wizard-steps";

/**
 * Gli unici talenti che sceglie l'utente: li prende da tutta la lista, senza
 * vincoli.
 *
 * Quanti se ne scelgono è lo stesso numero per tutte le Vie
 * (`TALENTI_DA_SCEGLIERE`): non dipende più dalla Via e il database non lo
 * impone. Il gate di "Seleziona" legge `validateDraft`, che usa la stessa
 * costante: le due non possono divergere.
 */
export function TalentiStep({ catalog, draft, onChange }: StepProps) {
  const completo = draft.talenti.length >= TALENTI_DA_SCEGLIERE;

  function toggle(key: string) {
    onChange({
      talenti: draft.talenti.includes(key)
        ? draft.talenti.filter((scelto) => scelto !== key)
        : [...draft.talenti, key],
    });
  }

  return (
    <StepSection
      // title="Talenti"
      // description={`Scegli ${quantiTalenti(TALENTI_DA_SCEGLIERE)} fra tutti quelli disponibili. Nessuna combinazione è vietata.`}
      // Detto una volta qui invece che su ognuna delle card disabilitate, che
      // sono tutte quelle non scelte.
      hint={`Scegli ${quantiTalenti(TALENTI_DA_SCEGLIERE)} fra tutti quelli disponibili.`}
    >
      {/* Senza questo contatore il bottone della nav resterebbe disabilitato
          senza che si capisca quanti talenti mancano. */}
      <p className="text-sm font-medium" role="status" aria-live="polite">
        {draft.talenti.length} di {TALENTI_DA_SCEGLIERE} scelt
        {draft.talenti.length === 1 ? "o" : "i"}
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
                // image={CATALOG_IMAGES.talenti[talento.key]}
                selected={selected}
                disabled={completo && !selected}
                onSelect={() => toggle(talento.key)}
                hideDescription={true}
              />
            );
          })}
        </div>
      )}
    </StepSection>
  );
}
