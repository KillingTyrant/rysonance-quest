import Link from "next/link";
import { CircleAlert, ShieldX, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STAFF_SCANSIONA } from "@/lib/staff/percorsi";

/**
 * Gli stati dell'area staff che non hanno dati da mostrare: un'icona, un
 * titolo, due righe e le azioni per uscirne. Pensato per il telefono, al
 * centro dello schermo.
 */
export function StaffMessaggio({
  icona: Icona,
  titolo,
  children,
  azioni,
}: {
  icona: LucideIcon;
  titolo: string;
  children: React.ReactNode;
  azioni?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center"
    >
      <Icona className="size-12 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold">{titolo}</h1>
      <div className="max-w-xs text-balance text-muted-foreground">{children}</div>
      {azioni && <div className="flex flex-col items-center gap-4 pt-2">{azioni}</div>}
    </div>
  );
}

/** Il bottone per tornare subito allo scanner, uguale in ogni schermata. */
export function NuovaScansione() {
  return (
    <Button asChild variant="ticket">
      <Link href={STAFF_SCANSIONA}>Nuova scansione</Link>
    </Button>
  );
}

/** Loggato ma non nello staff (`is_staff()` falso, o 42501 da una RPC). */
export function NonAutorizzato() {
  return (
    <StaffMessaggio
      icona={ShieldX}
      titolo="Area riservata allo staff"
      azioni={
        <Link href="/" className="font-medium underline underline-offset-4">
          Torna alla home
        </Link>
      }
    >
      Il tuo account non fa parte dello staff dell&apos;evento. Se dovresti
      esserci, chiedi agli organizzatori di aggiungerti.
    </StaffMessaggio>
  );
}

/** Il DB non ha risposto: rete, stack giù o app e DB disallineati. */
export function ErroreStaff({
  riprova,
  conScansione = false,
}: {
  /** La pagina da ricaricare. */
  riprova: string;
  /** Mostra anche il ritorno allo scanner: serve a chi è in fila. */
  conScansione?: boolean;
}) {
  return (
    <StaffMessaggio
      icona={CircleAlert}
      titolo="Non riusciamo a rispondere"
      azioni={
        <>
          {conScansione && <NuovaScansione />}
          {/* `<a>` e non `<Link>`: serve una richiesta nuova, non la pagina in cache. */}
          <a href={riprova} className="font-medium underline underline-offset-4">
            Riprova
          </a>
        </>
      }
    >
      Controlla la connessione e riprova tra poco. Se non passa, avvisa chi
      gestisce l&apos;app.
    </StaffMessaggio>
  );
}
