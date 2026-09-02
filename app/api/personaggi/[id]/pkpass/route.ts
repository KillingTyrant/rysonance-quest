import { createClient } from "@/lib/supabase/server";

const PKPASS_CONTENT_TYPE = "application/vnd.apple.pkpass";

/**
 * Il `.pkpass` del personaggio, dietro il bottone "Aggiungi ad Apple Wallet".
 *
 * È un proxy verso il servizio pkpass e non un link diretto per due motivi: le
 * rotte `/admin/*` di quel servizio vogliono `Authorization: Bearer
 * <WALLET_ADMIN_TOKEN>`, che non deve arrivare al browser, e nessuno
 * verificherebbe che il personaggio sia di chi lo chiede.
 *
 * L'emissione è un effetto collaterale di una GET: è deliberato, perché su iOS
 * la schermata "Aggiungi" si apre solo da una navigazione vera verso una
 * risposta `application/vnd.apple.pkpass` — un fetch + blob non basta.
 *
 * ⚠️ Oggi ogni click emette un pass NUOVO (serial diverso, quindi un secondo
 * pass nel Wallet): `POST /admin/passes` non è ancora idempotente per
 * personaggio. Da risolvere lato servizio (unique index su
 * `wallet.passes (personaggio_id, pass_type_identifier)` + `on conflict`),
 * non qui: il ruolo `authenticated` non ha alcun grant sullo schema `wallet`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const baseUrl = process.env.WALLET_SERVICE_URL;
  const adminToken = process.env.WALLET_ADMIN_TOKEN;
  if (!baseUrl || !adminToken) {
    return new Response("Wallet non configurato su questo ambiente.", {
      status: 503,
    });
  }

  const { id } = await params;
  const supabase = await createClient();

  // Il controllo di proprietà lo fa RLS: il personaggio di un altro utente non
  // esiste per questa query. `name` serve solo al nome del file scaricato.
  const { data: personaggio } = await supabase
    .from("personaggi")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!personaggio) {
    return new Response("Personaggio non trovato.", { status: 404 });
  }

  // L'email non è derivabile dal servizio (vive in `auth.users`, su cui
  // `wallet_service` non ha grant): passarla qui è l'unico modo di farla
  // finire in `payload_json`, e da lì nello `userInfo` del pass.
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = claimsData?.claims.email;

  const authorization = { Authorization: `Bearer ${adminToken}` };

  try {
    const issued = await fetch(`${baseUrl}/admin/passes`, {
      method: "POST",
      headers: { ...authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ personaggioId: id, ...(email ? { email } : {}) }),
      cache: "no-store",
    });
    if (!issued.ok) {
      console.error(
        `wallet: emissione fallita per ${id} (${issued.status} ${await issued.text()})`,
      );
      return new Response("Non è stato possibile creare il pass.", { status: 502 });
    }

    // Path relativo costruito dal servizio: verificato prima di rimetterlo in
    // una URL, così una risposta anomala non diventa una richiesta arbitraria.
    const { downloadUrl } = (await issued.json()) as { downloadUrl?: string };
    if (!downloadUrl?.startsWith("/admin/passes/")) {
      console.error(`wallet: downloadUrl inatteso per ${id}: ${downloadUrl}`);
      return new Response("Non è stato possibile creare il pass.", { status: 502 });
    }

    const pkpass = await fetch(`${baseUrl}${downloadUrl}`, {
      headers: authorization,
      cache: "no-store",
    });
    if (!pkpass.ok || !pkpass.body) {
      console.error(`wallet: download fallito per ${id} (${pkpass.status})`);
      return new Response("Non è stato possibile creare il pass.", { status: 502 });
    }

    return new Response(pkpass.body, {
      headers: {
        "Content-Type": PKPASS_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${filename(personaggio.name)}"`,
        // Il pass va rigenerato a ogni richiesta: contiene i dati correnti
        // della scheda e un token di autenticazione.
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Tipicamente: servizio pkpass non in esecuzione (ECONNREFUSED).
    console.error(`wallet: servizio irraggiungibile su ${baseUrl}`, error);
    return new Response("Servizio Wallet non raggiungibile.", { status: 502 });
  }
}

/** Nome del file scaricato: ASCII, perché finisce in un header HTTP. */
function filename(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${slug || "personaggio"}.pkpass`;
}
