import Link from "next/link";
import { Suspense } from "react";

import { formatOra } from "@/components/staff/formato";
import { ErroreStaff, NonAutorizzato } from "@/components/staff/staff-messaggio";
import { Statistiche } from "@/components/staff/statistiche";
import { Button } from "@/components/ui/button";
import { STAFF_HOME, STAFF_SCANSIONA } from "@/lib/staff/percorsi";
import { contaPersonaggi, richiediSessione } from "@/lib/staff/staff";

export const metadata = {
  title: "Staff · Rysonance",
};

/**
 * La home dello staff: quanti personaggi ci sono e quanti hanno il pass, e
 * l'ingresso allo scanner. Tutto dentro Suspense, anche l'intestazione: chi non
 * è staff deve vedere solo il messaggio, non il bottone dello scanner.
 */
export default function StaffPage() {
  return (
    <Suspense fallback={<StaffSkeleton />}>
      <StaffContent />
    </Suspense>
  );
}

async function StaffContent() {
  await richiediSessione(STAFF_HOME);
  const risultato = await contaPersonaggi();

  switch (risultato.esito) {
    case "non-autorizzato":
      return <NonAutorizzato />;
    case "errore":
      return <ErroreStaff riprova={STAFF_HOME} />;
    case "ok":
      return (
        <div className="flex flex-col gap-8 pb-8">
          <header className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold">Staff</h1>
              <p className="text-muted-foreground">
                Scansiona i pass dei giocatori e tieni d&apos;occhio i numeri
                dell&apos;evento.
              </p>
            </div>
            <Button asChild variant="ticket">
              <Link href={STAFF_SCANSIONA}>Scansiona un pass</Link>
            </Button>
          </header>

          <Statistiche
            statistiche={risultato.statistiche}
            aggiornatoAlle={formatOra(new Date())}
          />
        </div>
      );
  }
}

function StaffSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-hidden>
      <div className="mx-auto h-24 w-full max-w-xs rounded-lg bg-muted" />
      <div className="h-28 rounded-xl bg-muted" />
      <div className="h-40 rounded-xl bg-muted" />
      <div className="h-40 rounded-xl bg-muted" />
    </div>
  );
}
