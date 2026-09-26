import Link from "next/link";
import { Suspense } from "react";

import { PassScanner } from "@/components/staff/pass-scanner";
import { SerialeForm } from "@/components/staff/seriale-form";
import { ErroreStaff, NonAutorizzato } from "@/components/staff/staff-messaggio";
import { STAFF_HOME, STAFF_SCANSIONA } from "@/lib/staff/percorsi";
import { leggiAccessoStaff, richiediSessione } from "@/lib/staff/staff";

export const metadata = {
  title: "Scansiona un pass · Staff · Rysonance",
};

/**
 * Lo scanner non legge dati, ma accende la fotocamera: a chi non è staff non
 * si mostra nemmeno. Il controllo che protegge i dati resta in `scansiona_pass`.
 */
export default function ScansionaPage() {
  return (
    <Suspense fallback={<ScansionaSkeleton />}>
      <ScansionaContent />
    </Suspense>
  );
}

async function ScansionaContent() {
  await richiediSessione(STAFF_SCANSIONA);
  const accesso = await leggiAccessoStaff();

  if (accesso === "non-autorizzato") return <NonAutorizzato />;
  if (accesso === "errore") return <ErroreStaff riprova={STAFF_SCANSIONA} />;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold">Scansiona</h1>
        <Link href={STAFF_HOME} className="text-sm font-medium underline underline-offset-4">
          Statistiche
        </Link>
      </header>
      <PassScanner />
      <SerialeForm />
    </div>
  );
}

function ScansionaSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden>
      <div className="h-9 w-40 rounded-lg bg-muted" />
      <div className="aspect-[4/5] w-full rounded-xl bg-muted" />
      <div className="h-16 rounded-lg bg-muted" />
    </div>
  );
}
