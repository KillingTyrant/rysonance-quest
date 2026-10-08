import { Suspense } from "react";

import {
  PersonaggioList,
  PersonaggioListSkeleton,
} from "@/components/personaggi/personaggio-list";
import { HeaderAnimation } from "@/components/personaggi/header-animation";

export const metadata = {
  title: "I tuoi eroi · Rysonance",
};

/**
 * Niente CTA di creazione qui: la quest prevede un solo eroe per utente, e
 * l'invito a crearlo sta nello stato vuoto di `PersonaggioList`. Chi apre
 * `/onboarding` avendone già uno lo rimanda in lobby il proxy.
 */
export default function LobbyPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <HeaderAnimation>
        <h1 className="text-4xl font-bold">I tuoi eroi</h1>
      </HeaderAnimation>

      <Suspense fallback={<PersonaggioListSkeleton />}>
        <PersonaggioList />
      </Suspense>
    </div>
  );
}
