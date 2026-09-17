import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SplashFrame } from "@/components/quest/splash-frame";
import { getUltimoPersonaggioId } from "@/lib/onboarding/personaggi";

export const metadata = {
  title: "Quest · Rysonance",
};

/**
 * `/quest` senza id porta alla quest del personaggio più recente, o a crearne
 * uno se l'utente non ne ha.
 */
export default function QuestIndexPage() {
  return (
    <Suspense fallback={<SplashFrame />}>
      <VaiAllaQuest />
    </Suspense>
  );
}

async function VaiAllaQuest() {
  const id = await getUltimoPersonaggioId();
  return redirect(id ? `/quest/${id}` : "/onboarding");
}
