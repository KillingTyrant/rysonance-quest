import "server-only";

/**
 * La chiave della quest servita da questo deploy (`quest.key` nel catalogo),
 * da legare a ogni personaggio creato. Viene dalla configurazione e non dal
 * codice: per un altro evento basta cambiare `QUEST_KEY`.
 *
 * Se manca restituisce `undefined` e il personaggio nasce senza quest: meglio
 * perdere il legame che bloccare la creazione durante un evento. Una chiave
 * presente ma assente dal catalogo, invece, fa fallire la RPC.
 */
export function getQuestKey(): string | undefined {
  return process.env.QUEST_KEY?.trim() || undefined;
}
