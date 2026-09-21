import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedPersonaggio } from "@/lib/onboarding/selectors";

export type SheetVariant =
  /** Colonna laterale del wizard: si aggiorna a ogni scelta. */
  | "aside"
  /** Scheda completa, a tutta larghezza. */
  | "full"
  /** Scheda di un personaggio salvato, nella lobby. */
  | "card";

type PersonaggioSheetProps = {
  resolved: ResolvedPersonaggio;
  variant?: SheetVariant;
  title?: string;
  /** Riga in fondo alla scheda (es. la data di creazione). */
  footer?: ReactNode;
  className?: string;
};

/**
 * L'unico renderer di un personaggio (oggi non montato da nessuna parte):
 * tutte le varianti partono da `ResolvedPersonaggio`, quindi la differenza fra "sto scegliendo" e "ho
 * scelto" sta nei selettori, non qui.
 */
export function PersonaggioSheet({
  resolved,
  variant = "full",
  title,
  footer,
  className,
}: PersonaggioSheetProps) {
  const { name, sesso, razza, tribu, via, talenti, hp, mana, speed } = resolved;
  const compact = variant === "aside";
  const origini = [razza?.name, tribu?.name, sesso].filter(Boolean).join(" · ");

  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border bg-card text-card-foreground shadow",
        compact ? "gap-4 p-5" : "gap-5 p-6",
        className,
      )}
    >
      <header className="flex flex-col gap-1">
        {title && (
          <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        )}
        <p className={cn("font-semibold", compact ? "text-lg" : "text-xl")}>
          {name.trim() || <span className="text-muted-foreground">Senza nome</span>}
        </p>
        <p className="text-sm text-muted-foreground">
          {origini || "Origini non ancora scelte"}
        </p>
      </header>

      <Blocco title="Via">
        <p className={cn("text-sm", !via && "text-muted-foreground")}>
          {via?.name ?? "Non ancora scelta"}
        </p>
      </Blocco>

      <Blocco title="Statistiche">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>
            Vita <Stat value={hp} />
          </span>
          <span>
            Mana <Stat value={mana} />
          </span>
          <span>
            Velocità <Stat value={speed} />
          </span>
        </div>
      </Blocco>

      <Blocco title="Talenti">
        {talenti.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessun talento scelto.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {talenti.map((talento) => (
              <Badge key={talento.key} variant="outline">
                {talento.name}
              </Badge>
            ))}
          </div>
        )}
      </Blocco>

      {footer && <div className="mt-auto pt-1">{footer}</div>}
    </section>
  );
}

function Blocco({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t pt-3 first-of-type:border-t-0 first-of-type:pt-0">
      <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({ value }: { value: number | null | undefined }) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        value === null ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {value ?? "—"}
    </span>
  );
}
