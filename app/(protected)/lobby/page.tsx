import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import {
  PersonaggioList,
  PersonaggioListSkeleton,
} from "@/components/personaggi/personaggio-list";
import { HeaderAnimation } from "@/components/personaggi/header-animation";

export const metadata = {
  title: "I tuoi eroi · Rysonance",
};

export default function LobbyPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <HeaderAnimation>
        <h1 className="text-4xl font-bold">I tuoi eroi</h1>
      </HeaderAnimation>

      <Suspense fallback={<PersonaggioListSkeleton />}>
        <PersonaggioList />
      </Suspense>

      {/* Fisso a 8px dal bordo destro e da quello basso, sopra la lista mentre si
          scorre. `fixed` si aggancia al viewport solo finché nessun antenato ha un
          `transform`: regge perché il template esclude la lobby dalla transizione
          d'ingresso. Lo spazio per non coprire il footer lo lascia il layout. */}
      <Link
        href="/onboarding"
        className="fixed bottom-2 right-2 z-40 inline-flex h-8 items-center gap-2 rounded-full border border-foreground bg-background px-6 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Crea nuovo eroe
        <Plus aria-hidden className="size-3.5" />
      </Link>
    </div>
  );
}
