import type { Database } from "@/lib/supabase/database.types";

// ──────────────────────────────── Scansione ─────────────────────────────────

/**
 * Il jsonb di `scansiona_pass` (rysonance-db, 21_rpc.sql). I tipi generati lo
 * vedono solo come `Json`: la forma è il contratto della RPC, riscritto qui
 * con i nomi del DB. Un cambio là è un cambio di API da riportare qui.
 */
export type ScansionePass = {
  pass: {
    serial_number: string;
    voided: boolean;
    /** ISO 8601; null = il pass non scade. */
    expiration_date: string | null;
    created_at: string;
  };
  personaggio: {
    id: string;
    nome: string;
    razza: string;
    /** La tribù è facoltativa: il percorso quest non la sceglie. */
    tribu: string | null;
    via: string;
    talenti: string[];
  };
  /** Tutte le quest del personaggio, non solo quella di questo deploy. */
  quest: {
    nome: string;
    /** null finché il giocatore non ha lanciato il dado. */
    numero_dado: number | null;
  }[];
  /** null solo se l'utente è stato cancellato da auth.users. */
  utente: {
    id: string;
    email: string | null;
    /** Da `raw_user_meta_data`: lo scrive il login Google, l'email no. */
    nome: string | null;
    created_at: string;
    last_sign_in_at: string | null;
  } | null;
};

/** Cosa lo staff deve fare con il pass: farlo passare o fermarlo. */
export type StatoPass = "valido" | "annullato" | "scaduto";

export type EsitoScansione =
  | { esito: "trovato"; scansione: ScansionePass; stato: StatoPass }
  /** Seriale vuoto, troppo lungo o sconosciuto: per la RPC sono la stessa cosa. */
  | { esito: "non-trovato" }
  | { esito: "non-autorizzato" }
  | { esito: "errore" };

// ─────────────────────────────── Statistiche ────────────────────────────────

/** La riga di `conta_personaggi`: qui i tipi generati bastano. */
export type StatistichePersonaggi =
  Database["public"]["Functions"]["conta_personaggi"]["Returns"][number];

export type EsitoStatistiche =
  | { esito: "ok"; statistiche: StatistichePersonaggi }
  | { esito: "non-autorizzato" }
  | { esito: "errore" };

/** Se chi chiama è staff: lo decide `is_staff()`, sulla tabella `staff`. */
export type AccessoStaff = "staff" | "non-autorizzato" | "errore";
