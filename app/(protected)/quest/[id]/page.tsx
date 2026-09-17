import { notFound } from "next/navigation";
import { Suspense } from "react";

import { QuestFlow } from "@/components/quest/quest-flow";
import { SplashFrame } from "@/components/quest/splash-frame";
import { getQuest } from "@/lib/quest/quest";
import type { Quest } from "@/lib/quest/types";

export const metadata = {
  title: "Quest · Rysonance",
};

/**
 * La quest del personaggio `id`. L'id nell'URL è ciò che tiene il legame con il
 * personaggio appena creato: sopravvive a ricarica, avanti/indietro e cambi di
 * pagina. Chi apre l'id di un altro utente trova un 404: lo decide RLS.
 *
 * Senza `generateStaticParams` l'id è un dato di runtime: si legge dentro
 * Suspense, e intanto si vede l'ultimo fotogramma del caricamento.
 */
export default function QuestPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<SplashFrame />}>
      <QuestContent params={params} />
    </Suspense>
  );
}

async function QuestContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let quest: Quest | null;
  try {
    quest = await getQuest(id);
  } catch {
    return <QuestErrore id={id} />;
  }

  // Fuori dal try: notFound() funziona lanciando un'eccezione.
  if (!quest) notFound();

  return <QuestFlow carta={quest.carta} numero={quest.numero} />;
}

function QuestErrore({ id }: { id: string }) {
  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg font-semibold">Non riusciamo a caricare la quest.</p>
      <p className="text-muted-foreground">Controlla la connessione e riprova.</p>
      {/* `<a>` e non `<Link>`: serve una richiesta nuova, non la pagina in cache. */}
      <a href={`/quest/${id}`} className="font-medium underline underline-offset-4">
        Riprova
      </a>
    </div>
  );
}
