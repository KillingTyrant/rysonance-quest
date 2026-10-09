import { Suspense } from "react";

import {
  PersonaggioList,
  PersonaggioListSkeleton,
} from "@/components/personaggi/personaggio-list";

export const metadata = {
  title: "I tuoi eroi · Rysonance",
};

/**
 * Niente CTA di creazione qui: la quest prevede un solo eroe per utente, e
 * l'invito a crearlo sta nello stato vuoto di `PersonaggioList`. Chi apre
 * `/onboarding` avendone già uno lo rimanda in lobby il proxy.
 *
 * L'intestazione la rende `PersonaggioList`, perché senza eroi cambia. `flex-1`
 * lascia allo stato vuoto tutta l'altezza sotto la nav.
 */
export default function LobbyPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Suspense fallback={<PersonaggioListSkeleton />}>
        <PersonaggioList />
      </Suspense>
    </div>
  );
}
