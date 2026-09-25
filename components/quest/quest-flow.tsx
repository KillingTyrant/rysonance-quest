"use client";

import { type ReactNode, useEffect, useReducer, useRef, useState } from "react";

import type { ScreenPoint } from "@/components/dice/types";
import type { Quest } from "@/lib/quest/types";
import { cn } from "@/lib/utils";

import { CartaPersonaggio } from "./carta-personaggio";
import { Confetti, type ConfettiHandle } from "./confetti";
import { QUEST_COPY } from "./copy";
import { DadoStage } from "./dado-stage";
import { PassoNumero } from "./passo-numero";
import { initialQuestState, questReducer } from "./quest-machine";

/**
 * La quest di un personaggio, dal lancio del dado alla sua card. Lo step corrente
 * lo decide il reducer; ogni schermata ne legge lo stato, gli manda eventi e anima
 * da sé la propria entrata e la propria uscita.
 *
 * Le schermate stanno sovrapposte nella stessa cella di una griglia: durante un
 * cambio quella che esce resta montata (inerte) mentre l'altra entra, senza salti
 * di layout. Quale schermata esiste in quale step:
 * - il dado, finché si lancia e mentre svanisce sul risultato;
 * - il numero, dal risultato in poi (sulla card svanisce);
 * - la card, dalle istruzioni: montata invisibile, così è pronta prima del giro.
 */
export function QuestFlow({ carta, numero }: Quest) {
  // Il numero delle props conta solo al mount. Dopo il lancio la server action
  // scrive il cookie e la pagina si ri-renderizza con il numero nelle props, ma a
  // quel punto è il reducer a sapere a che step siamo.
  const [state, dispatch] = useReducer(questReducer, numero, initialQuestState);
  const { step } = state;
  const stageRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<ConfettiHandle>(null);
  const previousStepRef = useRef(step);

  // Il punto in cui è atterrato il dado: il numero parte da lì. Vale per un solo
  // montaggio della schermata del numero, poi si azzera, così una pagina nascosta e
  // rimostrata non rifà il volo.
  const [origine, setOrigine] = useState<ScreenPoint | null>(null);
  useEffect(() => {
    if (!origine) return;
    const timer = window.setTimeout(() => setOrigine(null), 0);
    return () => window.clearTimeout(timer);
  }, [origine]);

  function atterrato(landing: ScreenPoint) {
    confettiRef.current?.burst(landing);
    setOrigine(landing);
    dispatch({ type: "atterrato" });
  }

  // A ogni cambio di step il focus va sul titolo della schermata attiva: chi usa la
  // tastiera o uno screen reader riparte da lì e non da un bottone sparito.
  useEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;
    const titolo = Array.from(
      stageRef.current?.querySelectorAll<HTMLElement>("[data-quest-titolo]") ?? [],
    ).find((element) => !element.closest("[inert]"));
    titolo?.focus({ preventScroll: true });
  }, [step]);

  const annuncio =
    state.lancio === "in-attesa" || state.lancio === "in-volo"
      ? QUEST_COPY.dado.inCorso
      : step === "risultato" && state.numero !== null
        ? QUEST_COPY.risultato.annuncio(state.numero)
        : "";

  return (
    <div className="flex flex-1 flex-col">
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {annuncio}
      </p>

      <div ref={stageRef} className="grid flex-1 [&>*]:[grid-area:1/1]">
        {(step === "dado" || step === "risultato") && (
          <Schermata attiva={step === "dado"}>
            <DadoStage
              attivo={step === "dado"}
              personaggioId={carta.personaggioId}
              state={state}
              dispatch={dispatch}
              onAtterrato={atterrato}
            />
          </Schermata>
        )}

        {step !== "dado" && state.numero !== null && (
          <Schermata attiva={step === "risultato" || step === "istruzioni"}>
            <PassoNumero
              step={step}
              numero={state.numero}
              origine={origine}
              onContinua={() => dispatch({ type: "continua" })}
              onGodi={() => dispatch({ type: "godi" })}
            />
          </Schermata>
        )}

        {(step === "istruzioni" || step === "carta") && (
          <Schermata attiva={step === "carta"}>
            {/* `-mx-3`: la card esce dal margine della colonna e arriva quasi ai bordi. */}
            <CartaPersonaggio
              carta={carta}
              numero={state.numero}
              attivo={step === "carta"}
              className="-mx-3"
            />
          </Schermata>
        )}
      </div>

      <Confetti ref={confettiRef} />
    </div>
  );
}

/** Una schermata della quest: quando non è quella attiva non riceve né focus né tocchi. */
function Schermata({ attiva, children }: { attiva: boolean; children: ReactNode }) {
  return (
    <div inert={!attiva} className={cn("flex min-w-0 flex-col", !attiva && "pointer-events-none")}>
      {children}
    </div>
  );
}
