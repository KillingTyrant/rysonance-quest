import { Suspense } from "react";

import { PassDettaglio, PassNonTrovato } from "@/components/staff/pass-dettaglio";
import { ErroreStaff, NonAutorizzato } from "@/components/staff/staff-messaggio";
import { percorsoPass } from "@/lib/staff/percorsi";
import { richiediSessione, scansionaPass } from "@/lib/staff/staff";

export const metadata = {
  title: "Pass · Staff · Rysonance",
};

/**
 * La scheda del pass con seriale `serial`, aperta dallo scanner o dal campo a
 * mano. Next passa il parametro già decodificato; la RPC toglie gli spazi e
 * decide se il pass esiste e se chi chiede è staff.
 */
export default function PassPage({ params }: { params: Promise<{ serial: string }> }) {
  return (
    <Suspense fallback={<PassSkeleton />}>
      <PassContent params={params} />
    </Suspense>
  );
}

async function PassContent({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const percorso = percorsoPass(serial);

  await richiediSessione(percorso);
  const risultato = await scansionaPass(serial);

  switch (risultato.esito) {
    case "non-autorizzato":
      return <NonAutorizzato />;
    case "errore":
      return <ErroreStaff riprova={percorso} conScansione />;
    case "non-trovato":
      return <PassNonTrovato seriale={serial.trim()} />;
    case "trovato":
      return <PassDettaglio scansione={risultato.scansione} stato={risultato.stato} />;
  }
}

function PassSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-hidden>
      <div className="h-36 rounded-xl bg-muted" />
      <div className="h-10 w-2/3 rounded-lg bg-muted" />
      <div className="h-36 rounded-lg bg-muted" />
      <div className="h-20 rounded-lg bg-muted" />
    </div>
  );
}
