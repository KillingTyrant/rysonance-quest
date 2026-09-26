import type { ScansionePass, StatoPass } from "./types";

/**
 * Lo stato che lo staff vede in cima alla scheda. L'annullamento vince sulla
 * scadenza: un pass annullato non torna buono, uno scaduto a volte sì (basta
 * spostare la data). La scadenza è esclusiva: all'istante indicato il pass è
 * già scaduto, come per Apple Wallet.
 */
export function statoPass(
  pass: Pick<ScansionePass["pass"], "voided" | "expiration_date">,
  adesso: Date,
): StatoPass {
  if (pass.voided) return "annullato";
  if (
    pass.expiration_date !== null &&
    Date.parse(pass.expiration_date) <= adesso.getTime()
  ) {
    return "scaduto";
  }
  return "valido";
}
