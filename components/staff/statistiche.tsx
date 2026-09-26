import { STAFF_HOME } from "@/lib/staff/percorsi";
import type { StatistichePersonaggi } from "@/lib/staff/types";

import { percentuale } from "./formato";

/**
 * I numeri dell'evento come tile, non come grafico: sono tre valori, e i due
 * del Wallet contano come quota dei personaggi. La barra è ridondante con la
 * percentuale scritta, quindi è nascosta agli screen reader.
 */
export function Statistiche({
  statistiche,
  aggiornatoAlle,
}: {
  statistiche: StatistichePersonaggi;
  /** Ora già formattata: la pagina è dinamica, l'orario dice quanto è fresca. */
  aggiornatoAlle: string;
}) {
  const totale = statistiche.personaggi_totali;

  return (
    <div className="flex flex-col gap-4">
      <Tile etichetta="Personaggi creati">
        <p className="text-6xl font-extrabold leading-none tabular-nums">{totale}</p>
      </Tile>

      <TileQuota
        etichetta="Con il pass scaricato"
        nota="Hanno generato il pass Apple Wallet almeno una volta."
        valore={statistiche.personaggi_con_pass}
        totale={totale}
      />

      <TileQuota
        etichetta="Con il pass nel Wallet"
        nota="Hanno il pass installato su un telefono in questo momento."
        valore={statistiche.personaggi_nel_wallet}
        totale={totale}
      />

      <p className="text-sm text-muted-foreground">
        Aggiornato alle {aggiornatoAlle} ·{" "}
        {/* `<a>` e non `<Link>`: serve una richiesta nuova, non la pagina in cache. */}
        <a href={STAFF_HOME} className="font-medium text-foreground underline underline-offset-4">
          Aggiorna
        </a>
      </p>
    </div>
  );
}

function Tile({ etichetta, children }: { etichetta: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground">
      <h2 className="text-sm font-medium text-muted-foreground">{etichetta}</h2>
      {children}
    </section>
  );
}

function TileQuota({
  etichetta,
  nota,
  valore,
  totale,
}: {
  etichetta: string;
  nota: string;
  valore: number;
  totale: number;
}) {
  const quota = percentuale(valore, totale);

  return (
    <Tile etichetta={etichetta}>
      <p className="flex items-baseline gap-3">
        <span className="text-4xl font-extrabold leading-none tabular-nums">{valore}</span>
        <span className="text-lg tabular-nums text-muted-foreground">
          {quota}% dei personaggi
        </span>
      </p>
      {/* Meter: traccia e riempimento dalla stessa tinta, estremità arrotondate. */}
      <div aria-hidden className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-foreground/80" style={{ width: `${quota}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">{nota}</p>
    </Tile>
  );
}
