import { Ban, CircleCheck, Clock, SearchX, type LucideIcon } from "lucide-react";

import { Esagono } from "@/components/quest/esagono";
import { Badge } from "@/components/ui/badge";
import type { ScansionePass, StatoPass } from "@/lib/staff/types";
import { cn } from "@/lib/utils";

import { formatDataOra } from "./formato";
import { NuovaScansione, StaffMessaggio } from "./staff-messaggio";

/**
 * Colori di stato, ognuno con la sua icona e la sua parola: lo stato non si
 * legge mai dal solo colore. Stessi colori a tema chiaro e scuro, perché sono
 * fondi pieni con il loro testo.
 */
const STATI: Record<StatoPass, { icona: LucideIcon; titolo: string; classe: string }> = {
  valido: {
    icona: CircleCheck,
    titolo: "Pass valido",
    classe: "bg-emerald-700 text-white",
  },
  annullato: {
    icona: Ban,
    titolo: "Pass annullato",
    classe: "bg-red-700 text-white",
  },
  scaduto: {
    icona: Clock,
    titolo: "Pass scaduto",
    classe: "bg-amber-400 text-neutral-950",
  },
};

/**
 * La scheda di un pass scansionato, per il telefono: lo stato in cima, grande,
 * poi personaggio, quest e giocatore. Il bottone per la scansione successiva
 * resta ancorato in basso, così chi è in fila non aspetta uno scroll.
 */
export function PassDettaglio({
  scansione,
  stato,
}: {
  scansione: ScansionePass;
  stato: StatoPass;
}) {
  const { pass, personaggio, quest, utente } = scansione;

  return (
    <div className="flex flex-1 flex-col gap-8">
      <StatoBanner stato={stato} pass={pass} />

      <Sezione titolo="Personaggio">
        <p className="font-sprat text-4xl leading-none">{personaggio.nome}</p>
        <Voci
          voci={[
            ["Razza", personaggio.razza],
            ...(personaggio.tribu ? [["Tribù", personaggio.tribu] as const] : []),
            ["Via", personaggio.via],
          ]}
        />
        {personaggio.talenti.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Talenti">
            {personaggio.talenti.map((talento) => (
              <li key={talento}>
                <Badge variant="secondary" className="text-sm font-medium">
                  {talento}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nessun talento.</p>
        )}
      </Sezione>

      <Sezione titolo="Quest">
        {quest.length > 0 ? (
          <ul className="divide-y rounded-lg border bg-card">
            {quest.map((q, i) => (
              <li
                key={`${i}-${q.nome}`}
                className="flex min-h-16 items-center justify-between gap-4 px-4 py-2"
              >
                <span className="font-medium">{q.nome}</span>
                {q.numero_dado === null ? (
                  <span className="text-sm text-muted-foreground">Dado non lanciato</span>
                ) : (
                  <span className="grid shrink-0 place-items-center text-2xl [&>*]:[grid-area:1/1]">
                    <Esagono />
                    <span className="font-extrabold leading-none tabular-nums text-numero-foreground">
                      <span className="sr-only">Numero </span>
                      {q.numero_dado}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Il personaggio non partecipa a nessuna quest.
          </p>
        )}
      </Sezione>

      <Sezione titolo="Giocatore">
        {utente ? (
          <Voci
            voci={[
              ...(utente.nome ? [["Nome", utente.nome] as const] : []),
              ["Email", utente.email ?? "—"],
              ["Iscritto il", formatDataOra(utente.created_at)],
              [
                "Ultimo accesso",
                utente.last_sign_in_at ? formatDataOra(utente.last_sign_in_at) : "Mai",
              ],
            ]}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            L&apos;account del giocatore non esiste più.
          </p>
        )}
      </Sezione>

      <div className="sticky bottom-0 -mx-4 mt-auto flex justify-center border-t bg-background/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm">
        <NuovaScansione />
      </div>
    </div>
  );
}

function StatoBanner({
  stato,
  pass,
}: {
  stato: StatoPass;
  pass: ScansionePass["pass"];
}) {
  const { icona: Icona, titolo, classe } = STATI[stato];

  return (
    <section className={cn("flex flex-col gap-4 rounded-xl p-5", classe)}>
      <div className="flex items-center gap-4">
        <Icona className="size-12 shrink-0" aria-hidden />
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold leading-tight">{titolo}</h1>
          {pass.expiration_date && stato !== "annullato" && (
            <p className="text-sm opacity-90">
              {stato === "scaduto" ? "Scaduto il " : "Scade il "}
              {formatDataOra(pass.expiration_date)}
            </p>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="opacity-80">Seriale</dt>
        <dd className="font-mono [overflow-wrap:anywhere]">{pass.serial_number}</dd>
        <dt className="opacity-80">Emesso il</dt>
        <dd>{formatDataOra(pass.created_at)}</dd>
      </dl>
    </section>
  );
}

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {titolo}
      </h2>
      {children}
    </section>
  );
}

function Voci({ voci }: { voci: ReadonlyArray<readonly [string, string]> }) {
  return (
    <dl className="divide-y rounded-lg border bg-card">
      {voci.map(([etichetta, valore]) => (
        <div key={etichetta} className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="shrink-0 text-sm text-muted-foreground">{etichetta}</dt>
          <dd className="min-w-0 text-right font-medium [overflow-wrap:anywhere]">{valore}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Seriale sconosciuto: `scansiona_pass` ha restituito null. */
export function PassNonTrovato({ seriale }: { seriale: string }) {
  // Un PDF417 qualsiasi (una patente, un biglietto aereo) finisce qui: si
  // mostra solo l'inizio, il resto non aiuta nessuno.
  const mostrato = seriale.length > 64 ? `${seriale.slice(0, 64)}…` : seriale;

  return (
    <StaffMessaggio icona={SearchX} titolo="Pass non riconosciuto" azioni={<NuovaScansione />}>
      <p>Nessun pass di questo evento ha il seriale</p>
      <p className="mt-2 font-mono text-foreground [overflow-wrap:anywhere]">
        {mostrato || "(vuoto)"}
      </p>
    </StaffMessaggio>
  );
}
