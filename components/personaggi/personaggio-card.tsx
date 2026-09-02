import Image from "next/image";

import { resolveRow } from "@/lib/onboarding/selectors";
import type { Catalog, Personaggio } from "@/lib/onboarding/types";

import { PersonaggioSheet } from "./personaggio-sheet";

const DATE_FORMAT = new Intl.DateTimeFormat("it-IT", { dateStyle: "long" });

/**
 * Un personaggio salvato nella lobby. Le chiavi vengono risolte sul catalogo e
 * il disegno lo fa `PersonaggioSheet`, lo stesso del wizard.
 *
 * L'"Aggiungi ad Apple Wallet" sta qui e non nella scheda perché il pass ha una
 * foreign key su `personaggi`: nel riepilogo del wizard il personaggio non
 * esiste ancora.
 */
export function PersonaggioCard({
  personaggio,
  catalog,
}: {
  personaggio: Personaggio;
  catalog: Catalog;
}) {
  return (
    <PersonaggioSheet
      resolved={resolveRow(catalog, personaggio)}
      variant="card"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Creato il {DATE_FORMAT.format(new Date(personaggio.created_at))}
          </p>
          {/* `<a>` e non `<Link>`: la risposta è un download `.pkpass`, non una
              navigazione dell'app. L'artwork è quello ufficiale Apple, che le
              linee guida non permettono di ridisegnare né di deformare. */}
          <a
            href={`/api/personaggi/${personaggio.id}/pkpass`}
            aria-label={`Aggiungi ${personaggio.name} ad Apple Wallet`}
            className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Image
              src="/IT_Add_to_Apple_Wallet_RGB_101821.svg"
              alt="Aggiungi ad Apple Wallet"
              width={111}
              height={35}
              unoptimized
            />
          </a>
        </div>
      }
    />
  );
}
