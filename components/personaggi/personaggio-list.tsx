import { getCatalog } from "@/lib/onboarding/catalog";
import { listPersonaggi } from "@/lib/onboarding/personaggi";
import { getNumeri } from "@/lib/quest/quest";

import { CardAnimation } from "./card-animation";
import { HeaderAnimation } from "./header-animation";
import { LobbyVuota } from "./lobby-vuota";
import { PersonaggioCard } from "./personaggio-card";

/** L'intestazione della lobby quando c'è qualcosa da mostrare. */
function LobbyTitolo() {
  return (
    <HeaderAnimation>
      <h1 className="text-4xl font-bold">I tuoi eroi</h1>
    </HeaderAnimation>
  );
}

/**
 * Lista dei personaggi dell'utente. Legge i cookie (sessione), quindi va
 * renderizzata dentro un `<Suspense>`: resta fuori dalla shell statica.
 *
 * L'intestazione sta qui e non nella pagina: senza personaggi la sostituisce
 * il titolo di `LobbyVuota`.
 */
export async function PersonaggioList() {
  const catalog = await getCatalog();

  let personaggi, numeri;
  try {
    [personaggi, numeri] = await Promise.all([listPersonaggi(), getNumeri()]);
  } catch {
    return (
      <div className="flex flex-col gap-8">
        <LobbyTitolo />
        <p className="text-sm text-destructive">
          Non è stato possibile caricare i personaggi. Ricarica la pagina.
        </p>
      </div>
    );
  }

  if (personaggi.length === 0) {
    return <LobbyVuota />;
  }

  return (
    <div className="flex flex-col gap-8">
      <LobbyTitolo />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {personaggi.map((personaggio, index) => (
          <CardAnimation key={personaggio.id} index={index}>
            <PersonaggioCard
              personaggio={personaggio}
              catalog={catalog}
              numero={numeri.get(personaggio.id) ?? null}
            />
          </CardAnimation>
        ))}
      </div>
    </div>
  );
}

/**
 * Segnaposto mostrato mentre la lista viene caricata. Il titolo è una barra
 * neutra: finché la lista non arriva non si sa se sarà "I tuoi eroi" o lo
 * stato vuoto.
 */
export function PersonaggioListSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden>
      <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="aspect-[5/8] animate-pulse rounded-2xl bg-muted shadow"
          />
        ))}
      </div>
    </div>
  );
}
