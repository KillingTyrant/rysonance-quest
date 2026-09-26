import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { statoPass } from "./stato-pass";
import type {
  AccessoStaff,
  EsitoScansione,
  EsitoStatistiche,
  ScansionePass,
} from "./types";

/**
 * Le letture dell'area staff. Passano tutte da RPC `security definer` di
 * rysonance-db, chiamate con la sessione dell'utente (cookie), mai con la
 * service role: chi è staff lo decide il DB, con `is_staff()` come prima
 * istruzione di ogni funzione. L'app non tocca `wallet` né `auth`.
 */

/**
 * Senza sessione si va al login, e poi si torna a `percorso`. Il proxy lo fa
 * già per ogni richiesta sotto /staff: questa è la seconda serratura, accanto
 * ai dati.
 */
export async function richiediSessione(percorso: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect(`/auth/login?next=${encodeURIComponent(percorso)}`);
  }
}

/**
 * Serve solo a decidere se mostrare lo scanner, che di suo non legge dati. Le
 * pagine che leggono dati non la chiamano: la loro RPC risponde 42501 da sé.
 */
export async function leggiAccessoStaff(): Promise<AccessoStaff> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_staff");

  if (error) {
    logErrore("is_staff", error);
    return "errore";
  }
  return data ? "staff" : "non-autorizzato";
}

/** Il pass con quel seriale, con personaggio, quest e utente. */
export async function scansionaPass(seriale: string): Promise<EsitoScansione> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("scansiona_pass", {
    p_serial: seriale,
  });

  if (error) {
    if (error.code === "42501") return { esito: "non-autorizzato" };
    logErrore("scansiona_pass", error);
    return { esito: "errore" };
  }
  if (data === null) return { esito: "non-trovato" };

  // I tipi generati vedono un `Json` qualunque: la forma è il contratto della
  // RPC, descritto da ScansionePass.
  const scansione = data as unknown as ScansionePass;
  return {
    esito: "trovato",
    scansione,
    stato: statoPass(scansione.pass, new Date()),
  };
}

/** Quanti personaggi ci sono e quanti hanno il pass, scaricato o nel Wallet. */
export async function contaPersonaggi(): Promise<EsitoStatistiche> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("conta_personaggi").single();

  if (error) {
    if (error.code === "42501") return { esito: "non-autorizzato" };
    logErrore("conta_personaggi", error);
    return { esito: "errore" };
  }
  return { esito: "ok", statistiche: data };
}

/**
 * `PGRST202` qui vuol dire app e DB disallineati (RPC non ancora applicata con
 * `db push`), non un errore dello staff: finisce nei log, non a schermo.
 */
function logErrore(rpc: string, error: PostgrestError) {
  console.error(`staff: ${rpc} fallita (${error.code} ${error.message})`);
}
