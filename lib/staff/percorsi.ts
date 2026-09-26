export const STAFF_HOME = "/staff";
export const STAFF_SCANSIONA = "/staff/scansiona";

/**
 * La scheda di un pass. Il valore arriva da un lettore o da una tastiera: si
 * toglie lo spazio in coda e si codifica, perché finisce in un segmento di URL.
 */
export function percorsoPass(seriale: string): string {
  return `/staff/pass/${encodeURIComponent(seriale.trim())}`;
}
