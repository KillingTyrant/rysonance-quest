/**
 * Le date del DB arrivano in UTC e il server gira in UTC: senza fuso esplicito
 * lo staff leggerebbe l'orario sbagliato di una o due ore.
 */
const DATA_ORA = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

const ORA = new Intl.DateTimeFormat("it-IT", {
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

export function formatDataOra(iso: string): string {
  return DATA_ORA.format(new Date(iso));
}

export function formatOra(data: Date): string {
  return ORA.format(data);
}

/** La quota di `parte` su `totale`, intera; 0 se non c'è ancora nessun personaggio. */
export function percentuale(parte: number, totale: number): number {
  return totale > 0 ? Math.round((parte / totale) * 100) : 0;
}
