"use client";

import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import type { QuestCarta } from "@/lib/quest/types";

import { creaImmagineCarta } from "./carta-immagine";
import { QUEST_COPY } from "./copy";
import { modoCondivisione, nomeFileCarta } from "./share";

function scarica(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

type CondividiCartaProps = {
  carta: QuestCarta;
  /** URL dell'illustrazione, della stessa origine. */
  illustrazione: string | null;
  className?: string;
};

/**
 * "Condividi Personaggio": condivide un PNG della card con il pannello nativo del
 * telefono; dove non si può (per esempio Firefox desktop) lo scarica.
 *
 * L'immagine si prepara appena la card viene montata, non al tocco: su iOS
 * `navigator.share` va chiamato dentro il gesto, e un'attesa asincrona in mezzo lo
 * farebbe rifiutare. Nel frattempo il bottone resta disabilitato.
 */
export function CondividiCarta({ carta, illustrazione, className }: CondividiCartaProps) {
  const logoRef = useRef<SVGSVGElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fallita, setFallita] = useState(false);

  useEffect(() => {
    let annullato = false;
    creaImmagineCarta({
      carta,
      illustrazione,
      // Il nome della famiglia generato da next/font sta nella variabile che il
      // root layout mette sul body.
      fontFamily: getComputedStyle(document.body).getPropertyValue("--font-sprat").trim(),
      logo: logoRef.current,
    })
      .then((blob) => {
        if (annullato) return;
        setFile(new File([blob], nomeFileCarta(carta.nome), { type: "image/png" }));
      })
      .catch(() => {
        if (!annullato) setFallita(true);
      });
    return () => {
      annullato = true;
    };
  }, [carta, illustrazione]);

  function condividi() {
    const title = QUEST_COPY.carta.condividiTitolo(carta.nome);
    const text = QUEST_COPY.carta.condividiTesto;

    if (!file) {
      // Senza immagine resta la condivisione del solo testo, dove esiste.
      if (typeof navigator.share === "function") {
        navigator.share({ title, text }).catch(() => { });
      }
      return;
    }

    const data: ShareData = { files: [file], title, text };
    if (modoCondivisione(navigator, data) === "download") {
      scarica(file);
      return;
    }
    navigator.share(data).catch((error: unknown) => {
      // Chiudere il pannello non è un errore; un rifiuto del browser sì: si scarica.
      if (error instanceof DOMException && error.name === "AbortError") return;
      scarica(file);
    });
  }

  const inPreparazione = !file && !fallita;

  return (
    <>
      <Button
        type="button"
        variant="ticket"
        size="sm"
        className={className}
        disabled={inPreparazione}
        aria-busy={inPreparazione}
        onClick={condividi}
      >
        {QUEST_COPY.carta.condividi}
      </Button>
      {/* Il logo da disegnare nell'immagine: si serializza questo SVG, mai mostrato. */}
      <Logo ref={logoRef} iconOnly={false} className="hidden" />
    </>
  );
}
