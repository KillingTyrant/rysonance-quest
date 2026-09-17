import type { Metadata, Viewport } from "next";

import { DadoLibero } from "@/components/dado-libero/dado-libero";
import { QuestHeader } from "@/components/quest/quest-header";

const DESCRIZIONE = "Lancia il d12 di Rysonance: nessun account, solo un tiro di dado.";

export const metadata: Metadata = {
  title: "Lancia il dado · Rysonance",
  description: DESCRIZIONE,
  openGraph: {
    title: "Lancia il dado · Rysonance",
    description: DESCRIZIONE,
    type: "website",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

/**
 * Il dado pubblico: si apre senza login (il proxy lo lascia passare) e non
 * legge né scrive nulla sul database, quindi la pagina è tutta statica.
 */
export default function DadoPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <QuestHeader />
      <DadoLibero />
    </main>
  );
}
