import Link from "next/link";

import { CartaPersonaggio } from "@/components/quest/carta-personaggio";
import { Button } from "@/components/ui/button";
import type { Catalog, Personaggio } from "@/lib/onboarding/types";
import { toQuestCarta } from "@/lib/quest/carta";

const DATE_FORMAT = new Intl.DateTimeFormat("it-IT", { dateStyle: "long" });

/**
 * Un personaggio salvato nella lobby: la stessa card olografica che chiude la quest,
 * con "Condividi Personaggio" e il wallet, più il link alla quest e la data.
 *
 * La card è montata già attiva: niente giro d'entrata, che in una lista di card
 * partirebbe per tutte insieme a ogni visita.
 */
export function PersonaggioCard({
  personaggio,
  catalog,
}: {
  personaggio: Personaggio;
  catalog: Catalog;
}) {
  return (
    <article className="flex flex-col gap-4">
      <CartaPersonaggio
        carta={toQuestCarta(catalog, personaggio)}
        attivo
        titolo="h2"
        className="aspect-[5/8] min-h-0 flex-none"
      />
      <div className="flex flex-col gap-2">
        <Button asChild variant="ticket" className="w-full">
          <Link href={`/quest/${personaggio.id}`}>Vai alla quest</Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Creato il {DATE_FORMAT.format(new Date(personaggio.created_at))}
        </p>
      </div>
    </article>
  );
}
