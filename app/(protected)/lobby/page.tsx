import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import {
  PersonaggioList,
  PersonaggioListSkeleton,
} from "@/components/personaggi/personaggio-list";
import { HeaderAnimation } from "@/components/personaggi/header-animation";
import { Button } from "@/components/ui/button";

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

      {/* La CTA della lobby, fissa a 16px (il margine della pagina) dal bordo destro
          e da quello basso, sopra la lista mentre si scorre. `fixed` si aggancia al
          viewport solo finché nessun antenato ha un `transform`: regge perché il
          template esclude la lobby dalla transizione d'ingresso. */}
      <Button asChild variant="ticket" className="fixed bottom-gutter right-gutter z-40">
        <Link href="/onboarding">
          Crea nuovo eroe
          <Plus aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
