import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

import type { SaveError } from "./wizard-steps";

/**
 * Gli otto punti sull'anello interno del sigillo. Calcolati una volta sola a
 * modulo e non a ogni render: sono valori deterministici, quindi il markup del
 * server e quello del client coincidono e l'idratazione non se ne accorge.
 */
const PUNTI = Array.from({ length: 8 }, (_, index) => {
  const angolo = (Math.PI / 4) * index - Math.PI / 2;
  return {
    cx: 100 + 84 * Math.cos(angolo),
    cy: 100 + 84 * Math.sin(angolo),
  };
});

/**
 * Il sigillo dietro al testo: il simbolo del logo dentro due anelli
 * concentrici, tutto in `currentColor` a bassissima opacità — così vale sia sul
 * fondo chiaro che su quello scuro senza due asset diversi (stesso motivo per
 * cui il logo è SVG inline, vedi `components/layout/logo.tsx`).
 *
 * L'anello esterno gira lentissimo: è decorazione, quindi `motion-reduce` lo
 * ferma del tutto invece di rallentarlo.
 */
function Sigillo({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="relative aspect-square w-full">
        <svg
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          className="absolute inset-0 h-full w-full animate-[spin_90s_linear_infinite] text-foreground/10 motion-reduce:animate-none"
        >
          {/* Anello esterno, con i due fermagli a ore 12 e a ore 6. */}
          <circle cx="100" cy="100" r="96" strokeWidth="1" />
          <circle cx="100" cy="100" r="90" strokeWidth="0.75" opacity="0.6" />
          <g fill="currentColor" stroke="none">
            <path d="M100 86l8 14-8 14-8-14z" transform="translate(0 -86)" />
            <path d="M100 86l8 14-8 14-8-14z" transform="translate(0 86)" />
          </g>

          {/* Anello interno punteggiato: dà il passo di lettura al simbolo. */}
          <circle cx="100" cy="100" r="84" strokeWidth="0.75" strokeDasharray="2 10" />
          {PUNTI.map((punto) => (
            <circle
              key={`${punto.cx}-${punto.cy}`}
              cx={punto.cx}
              cy={punto.cy}
              r="2.5"
              fill="currentColor"
              stroke="none"
            />
          ))}
        </svg>

        <Logo
          iconOnly
          className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 text-foreground/10"
        />
      </div>
    </div>
  );
}

type ConfirmScreenProps = {
  /** Il nome scritto nella hub: è il protagonista della schermata. */
  name: string;
  pending: boolean;
  saveError: SaveError | null;
  onConfirm: () => void;
  onBack: () => void;
};

/**
 * L'ultimo passo prima della nascita dell'eroe: niente da scegliere, solo il
 * nome, il sigillo e le due uscite. Serve a rendere il salvataggio un gesto
 * deliberato — dalla hub la CTA non salva più, porta qui — e a ricordare che
 * si è ancora in tempo per tornare sulle scelte.
 *
 * Il salvataggio vive qui, quindi qui compare anche il suo errore: sulla hub
 * resterebbe orfano del gesto che lo ha causato.
 */
export function ConfirmScreen({
  name,
  pending,
  saveError,
  onConfirm,
  onBack,
}: ConfirmScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="my-auto flex w-full max-w-md flex-col items-center gap-10 py-6 text-center">
        <Sigillo className="w-[min(68vw,17rem)]" />

        <div className="flex flex-col gap-2">
          <h1 className="font-sprat text-3xl font-normal leading-tight sm:text-4xl">
            Stai per far nascere
            <span className="block">{name}</span>
          </h1>
          <p className="text-muted-foreground">
            Sei ancora in tempo per modificarne i valori.
          </p>
        </div>
      </div>

      {saveError && (
        <div
          role="alert"
          className="mb-4 flex w-full max-w-md flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <p className="font-medium">{saveError.message}</p>
          {saveError.problems && saveError.problems.length > 0 && (
            <ul className="flex list-inside list-disc flex-col gap-1 text-muted-foreground">
              {saveError.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex w-full flex-col items-center gap-3">
        <Button variant="ticket" disabled={pending} onClick={onConfirm}>
          {pending ? "Creazione…" : "Crea e gioca"}
        </Button>

        {/*
          Stessa coppia CTA + link delle altre schermate del wizard (intro e
          step): il ritorno indietro non è un bottone, così non compete con la
          CTA. Durante il salvataggio è inerte, altrimenti si potrebbe tornare
          sulla hub con la server action ancora in volo.
        */}
        <Link
          href="#"
          aria-disabled={pending}
          className="w-full text-center text-muted-foreground underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
          onClick={(event) => {
            event.preventDefault();
            if (!pending) onBack();
          }}
        >
          Torna indietro
        </Link>
      </div>
    </div>
  );
}
