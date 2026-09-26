"use client";

import { CameraOff, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { percorsoPass } from "@/lib/staff/percorsi";

type Stato =
  | { tipo: "avvio" }
  | { tipo: "attivo" }
  | { tipo: "letto" }
  | { tipo: "errore"; messaggio: string };

const VINCOLI: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    // Il PDF417 è largo e fitto: a 640×480 i moduli sottili si impastano.
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};

/** Pausa fra una lettura e la successiva: 5-6 frame al secondo bastano. */
const INTERVALLO_MS = 150;

const SENZA_HTTPS =
  "Il browser dà la fotocamera solo alle pagine in HTTPS. Scrivi il seriale qui sotto.";
const LETTORE_NON_CARICATO =
  "Il lettore dei codici non si è caricato. Controlla la connessione e tocca Riprova.";

/**
 * Il lettore è `barcode-detector` in modalità ponyfill: l'API standard
 * BarcodeDetector sopra zxing-cpp compilato in WASM, uguale su ogni browser.
 * Quello nativo non basta: su Safari iOS manca, e dove c'è non sempre legge il
 * PDF417 del pass Wallet. Si carica solo qui, dal browser, alla prima apertura.
 */
async function creaLettore() {
  const { BarcodeDetector, prepareZXingModule } = await import(
    "barcode-detector/ponyfill"
  );
  // Scarica e compila subito il WASM (~1 MB, da jsDelivr). Così un errore di
  // rete esce qui, invece di far fallire in silenzio la lettura di ogni frame.
  await prepareZXingModule({ fireImmediately: true });
  return new BarcodeDetector({ formats: ["pdf417"] });
}

function messaggioCamera(errore: unknown): string {
  const nome =
    typeof errore === "object" && errore !== null && "name" in errore
      ? String(errore.name)
      : "";
  switch (nome) {
    case "NotAllowedError":
    case "SecurityError":
      return "Il permesso per la fotocamera è negato. Abilitalo nelle impostazioni del browser e tocca Riprova.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Su questo dispositivo non c'è una fotocamera utilizzabile.";
    case "NotReadableError":
      return "La fotocamera è occupata da un'altra app. Chiudila e tocca Riprova.";
    default:
      return "Non riusciamo ad accendere la fotocamera. Tocca Riprova.";
  }
}

/**
 * Fotocamera posteriore e lettura continua del PDF417. Al primo codice letto
 * spegne la fotocamera e apre la scheda del pass.
 *
 * Lo stream si rilascia sempre: uscendo dalla pagina (cleanup dell'effetto),
 * dopo una lettura, e quando la pagina va in background. Al ritorno in primo
 * piano si riaccende, perché iOS nel frattempo la chiude e lascerebbe un video
 * nero.
 */
export function PassScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stato, setStato] = useState<Stato>({ tipo: "avvio" });
  const [inPrimoPiano, setInPrimoPiano] = useState(true);
  /** Cambiarla riaccende la fotocamera: è il "Riprova". */
  const [sessione, setSessione] = useState(0);

  useEffect(() => {
    const aggiorna = () => {
      const visibile = document.visibilityState === "visible";
      setInPrimoPiano(visibile);
      if (visibile) setStato({ tipo: "avvio" });
    };
    document.addEventListener("visibilitychange", aggiorna);
    return () => document.removeEventListener("visibilitychange", aggiorna);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!inPrimoPiano || !video) return;

    let chiuso = false;
    let stream: MediaStream | undefined;
    let timer: number | undefined;

    const ferma = () => {
      chiuso = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      stream = undefined;
      video.srcObject = null;
    };

    const avvia = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStato({ tipo: "errore", messaggio: SENZA_HTTPS });
        return;
      }

      // In parallelo, ma senza Promise.all: se uno dei due fallisce l'altro va
      // comunque atteso, o uno stream arrivato dopo resterebbe acceso.
      const [lettore, camera] = await Promise.allSettled([
        creaLettore(),
        navigator.mediaDevices.getUserMedia(VINCOLI),
      ]);
      if (camera.status === "fulfilled") stream = camera.value;

      // Pagina lasciata mentre si aspettava il permesso: lo stream va spento qui.
      if (chiuso) return ferma();
      if (camera.status === "rejected") {
        setStato({ tipo: "errore", messaggio: messaggioCamera(camera.reason) });
        return;
      }
      if (lettore.status === "rejected") {
        ferma();
        setStato({ tipo: "errore", messaggio: LETTORE_NON_CARICATO });
        return;
      }

      video.srcObject = stream ?? null;
      try {
        await video.play();
      } catch {
        // `muted` + `playsInline` bastano all'autoplay; un play interrotto da
        // un nuovo srcObject non è un errore.
      }
      if (chiuso) return;
      setStato({ tipo: "attivo" });

      const detector = lettore.value;
      const leggi = async () => {
        if (chiuso) return;
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          try {
            const codici = await detector.detect(video);
            const valore = codici
              .map((codice) => codice.rawValue.trim())
              .find((testo) => testo !== "");
            if (valore && !chiuso) {
              ferma();
              setStato({ tipo: "letto" });
              navigator.vibrate?.(80);
              router.push(percorsoPass(valore));
              return;
            }
          } catch {
            // Un frame che non si decodifica non è un errore: si prova il prossimo.
          }
        }
        if (!chiuso) timer = window.setTimeout(leggi, INTERVALLO_MS);
      };
      void leggi();
    };

    void avvia();
    return ferma;
  }, [inPrimoPiano, sessione, router]);

  const riprova = () => {
    setStato({ tipo: "avvio" });
    setSessione((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label="Anteprima della fotocamera"
          className="size-full object-cover"
        />

        {/* Mirino: il PDF417 del pass Wallet è un rettangolo basso e largo.
            L'ombra enorme scurisce tutto ciò che sta fuori. */}
        {stato.tipo === "attivo" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-1/2 aspect-[3/1] -translate-y-1/2 rounded-lg border-2 border-white/90 shadow-[0_0_0_100vmax_rgba(0,0,0,0.4)]"
          />
        )}

        {stato.tipo !== "attivo" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            {stato.tipo === "errore" ? (
              <CameraOff className="size-10" aria-hidden />
            ) : (
              <ScanLine className="size-10 animate-pulse" aria-hidden />
            )}
          </div>
        )}
      </div>

      <p role="status" aria-live="polite" className="text-center text-sm text-muted-foreground">
        {stato.tipo === "avvio" && "Accendo la fotocamera…"}
        {stato.tipo === "attivo" && "Inquadra il codice del pass dentro il riquadro."}
        {stato.tipo === "letto" && "Codice letto, apro il pass…"}
        {stato.tipo === "errore" && stato.messaggio}
      </p>

      {stato.tipo === "errore" && (
        <Button
          type="button"
          variant="outline"
          size="default"
          className="self-center"
          onClick={riprova}
        >
          Riprova
        </Button>
      )}
    </div>
  );
}
