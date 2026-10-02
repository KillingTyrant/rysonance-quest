import Link from "next/link";

import { Button } from "@/components/ui/button";

import { SigilloEroe } from "./sigillo-eroe";
import type { SaveError } from "./wizard-steps";

type ConfirmScreenProps = {
  /** Il nome scritto nella hub: è il protagonista della schermata. */
  name: string;
  /** Le scelte che riempiono il sigillo, lo stesso della hub. */
  razzaKey: string | null;
  viaKey: string | null;
  pending: boolean;
  saveError: SaveError | null;
  onConfirm: () => void;
  onBack: () => void;
};

/**
 * L'ultimo passo prima della nascita dell'eroe: niente da scegliere, solo il
 * nome, il sigillo delle scelte e le due uscite. Serve a rendere il salvataggio un gesto
 * deliberato — dalla hub la CTA non salva più, porta qui — e a ricordare che
 * si è ancora in tempo per tornare sulle scelte.
 *
 * Il salvataggio vive qui, quindi qui compare anche il suo errore: sulla hub
 * resterebbe orfano del gesto che lo ha causato.
 */
export function ConfirmScreen({
  name,
  razzaKey,
  viaKey,
  pending,
  saveError,
  onConfirm,
  onBack,
}: ConfirmScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="my-auto flex w-full max-w-md flex-col items-center gap-10 py-6 text-center">
        {/*
          Lo stesso sigillo della hub, con razza e via: qui intero e ridotto
          alla larghezza dello schermo (il disegno è 334px a misura piena).
        */}
        <SigilloEroe
          razzaKey={razzaKey}
          viaKey={viaKey}
          className="h-auto w-[min(80vw,20.875rem)]"
        />

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Stai per far evocare
            <span className="block">{name}</span>
          </h1>
          {/* <p className="text-muted-foreground">
            Sei ancora in tempo per modificarne i valori.
          </p> */}
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
          Voglio modificarlo
        </Link>
      </div>
    </div>
  );
}
