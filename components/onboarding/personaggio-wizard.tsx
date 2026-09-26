"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { salvaPersonaggio } from "@/app/(protected)/onboarding/actions";
import { NavAction } from "@/components/layout/nav-action";
import { Button } from "@/components/ui/button";
import {
  allGroupsComplete,
  groupById,
  isGroupComplete,
  isGroupUnlocked,
  stepPositionInGroup,
  type GroupId,
} from "@/lib/onboarding/groups";
import {
  problemsForStep,
  stepIndex,
  WIZARD_STEPS,
  type StepDef,
  type StepId,
} from "@/lib/onboarding/steps";
import type { Catalog, PersonaggioDraft } from "@/lib/onboarding/types";
import {
  emptyDraft,
  TALENTI_DA_SCEGLIERE,
  validateDraft,
} from "@/lib/onboarding/validate";
import { cn } from "@/lib/utils";

import { ConfirmScreen } from "./confirm-screen";
import { GroupIntro } from "./group-intro";
import { HubScreen } from "./hub-screen";
import { StepAnimation } from "./step-animation";
import { STEP_COMPONENTS, type SaveError } from "./wizard-steps";

/**
 * La vista corrente del wizard. La hub è il punto di partenza e di ritorno:
 * in un macro-passo si entra sempre passando dalla sua intro. Nella hub si
 * scrive anche il nome, e la sua CTA porta alla conferma, che è l'unico punto
 * in cui l'eroe viene davvero salvato.
 */
type WizardView =
  | { mode: "hub" }
  | { mode: "intro"; group: GroupId }
  | { mode: "step"; step: StepId }
  | { mode: "confirm" };

function pickRandom<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function sampleUnique(items: readonly string[], count: number): string[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/**
 * Wizard di creazione personaggio. Il catalogo arriva già risolto dal server
 * (prerenderizzato); qui vive solo il draft delle scelte, che è anche il
 * payload mandato alla server action — non c'è nessuna conversione in mezzo.
 */
export function PersonaggioWizard({ catalog }: { catalog: Catalog }) {
  const [draft, setDraft] = useState<PersonaggioDraft>(emptyDraft);
  const [view, setView] = useState<WizardView>({ mode: "hub" });
  // Direzione dell'ultima transizione: la vista nuova entra da sinistra se si
  // va avanti, da destra se si torna indietro.
  const [isBackward, setIsBackward] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<SaveError | null>(null);
  const [pending, startTransition] = useTransition();

  const router = useRouter();

  const viewRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Una chiave per vista: guida l'effect di scroll/focus e fa da `key` dello
  // StepAnimation, così ogni transizione rimonta il contenuto che si guarda.
  const viewKey =
    view.mode === "step"
      ? `step:${view.step}`
      : view.mode === "intro"
        ? `intro:${view.group}`
        : view.mode;

  // Cambiando vista la pagina resterebbe scrollata dov'era e il focus andrebbe
  // perso sul bottone appena disabilitato: lo riportiamo all'inizio.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    viewRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [viewKey]);

  // Una sola valutazione per render, da cui derivano il gate di "Avanti",
  // l'elenco di cosa manca, lo stato delle righe della hub e il gate della CTA.
  const problems = validateDraft(catalog, draft);

  function go(next: WizardView, backward = false) {
    setNotice(null);
    setIsBackward(backward);
    // Un errore di salvataggio riguarda il tentativo appena fallito: lasciarlo
    // in giro dopo aver cambiato vista lo farebbe sembrare ancora attuale al
    // ritorno sulla hub.
    setSaveError(null);
    setView(next);
  }

  /**
   * L'unico punto in cui il draft cambia. Oggi non ci sono invarianti fra
   * campi: nessuna scelta ne invalida un'altra (cambiare Via non tocca i
   * talenti, il loro numero è `TALENTI_DA_SCEGLIERE` per tutte).
   */
  function handleChange(patch: Partial<PersonaggioDraft>) {
    setDraft({ ...draft, ...patch });
    setNotice(null);
  }

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      try {
        const result = await salvaPersonaggio(draft);
        // "Crea e gioca": salvato l'eroe si va dritti alla sua quest. La push
        // sta dentro la transizione, quindi `pending` resta vero finché la
        // pagina nuova non è pronta e la conferma non torna cliccabile in mezzo.
        if (result.ok) router.push(`/quest/${result.id}`);
        else setSaveError({ message: result.message, problems: result.problems });
      } catch {
        // Rete caduta, 500, deploy nel frattempo: senza questo catch la promise
        // rifiutata dentro la transizione smonterebbe il wizard e butterebbe
        // via tutte le scelte.
        setSaveError({ message: "Non è stato possibile contattare il server. Riprova." });
      }
    });
  }

  function handleRandomize() {
    const razza = pickRandom(catalog.razze);
    const via = pickRandom(catalog.vie);
    const talenti = sampleUnique(
      catalog.talentiScelta.map((talento) => talento.key),
      TALENTI_DA_SCEGLIERE,
    );

    const randomDraft: PersonaggioDraft = {
      ...emptyDraft(),
      name: `Eroe ${Math.floor(1000 + Math.random() * 9000)}`,
      razza_key: razza?.key ?? null,
      via_key: via?.key ?? null,
      talenti,
    };

    setDraft(randomDraft);
    setSaveError(null);
    setIsBackward(false);
    setView({ mode: "hub" });

    if (!via || !razza || talenti.length !== TALENTI_DA_SCEGLIERE) {
      setNotice("Scelte casuali parziali: completa i campi mancanti.");
      return;
    }

    setNotice("Eroe random generato: puoi rivedere le scelte o procedere.");
  }

  if (view.mode === "hub") {
    return (
      <StepAnimation key={viewKey} isBackward={isBackward}>
        <div
          ref={viewRef}
          tabIndex={-1}
          className="flex w-full flex-1 flex-col outline-none"
        >
          <HubScreen
            catalog={catalog}
            completed={(id) => isGroupComplete(problems, id)}
            unlocked={(id) => isGroupUnlocked(problems, id)}
            allComplete={allGroupsComplete(problems)}
            nameProblems={problems
              .filter((problem) => problem.field === "name")
              .map((problem) => problem.message)}
            draft={draft}
            pending={pending}
            saveError={saveError}
            onNameChange={(name) => handleChange({ name })}
            onOpenGroup={(id) => go({ mode: "intro", group: id })}
            onRandomize={handleRandomize}
            onCreaEroe={() => go({ mode: "confirm" })}
          />
        </div>
      </StepAnimation>
    );
  }

  if (view.mode === "intro") {
    const group = groupById(view.group);
    return (
      <StepAnimation key={viewKey} isBackward={isBackward}>
        <div
          ref={viewRef}
          tabIndex={-1}
          className="flex w-full flex-1 flex-col outline-none"
        >
          <GroupIntro
            group={group}
            disabled={pending}
            onContinue={() => go({ mode: "step", step: group.steps[0] })}
            onBack={() => go({ mode: "hub" }, true)}
          />
        </div>
      </StepAnimation>
    );
  }

  if (view.mode === "confirm") {
    return (
      <StepAnimation key={viewKey} isBackward={isBackward}>
        <div
          ref={viewRef}
          tabIndex={-1}
          className="flex w-full flex-1 flex-col outline-none"
        >
          <ConfirmScreen
            name={draft.name.trim()}
            pending={pending}
            saveError={saveError}
            onConfirm={handleSave}
            onBack={() => go({ mode: "hub" }, true)}
          />
        </div>
      </StepAnimation>
    );
  }

  const step = view.step;
  const Step = STEP_COMPONENTS[step];
  const { schermoIntero }: StepDef = WIZARD_STEPS[stepIndex(step)];
  const position = stepPositionInGroup(step);
  const missing = problemsForStep(problems, step).map((problem) => problem.label);

  /** Conferma le scelte dello step e passa al successivo, o torna alla hub. */
  function avanti() {
    if (!position) return;
    if (position.index === position.count - 1) go({ mode: "hub" });
    else go({ mode: "step", step: position.group.steps[position.index + 1] });
  }

  function indietro() {
    if (!position || position.index === 0) go({ mode: "hub" }, true);
    else go({ mode: "step", step: position.group.steps[position.index - 1] }, true);
  }

  return (
    <StepAnimation key={viewKey} isBackward={isBackward}>
      <div
        ref={viewRef}
        tabIndex={-1}
        className={cn("flex w-full flex-col outline-none", schermoIntero && "flex-1")}
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold">
            {position?.group.introTitle ?? WIZARD_STEPS[stepIndex(step)].title}
          </h1>
          {position && position.count > 1 && (
            <p className="text-sm text-muted-foreground">
              Passo {position.index + 1} di {position.count} —{" "}
              {WIZARD_STEPS[stepIndex(step)].title}
            </p>
          )}
        </header>

        {/* <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]"> */}
        {/*
          A schermo intero lo step prende l'altezza che resta sotto l'header e
          "Indietro" scende in fondo. L'altezza viene da `min-h-dvh` del layout:
          su iOS è quella visibile, barre di Safari escluse.
        */}
        <div className={cn("flex flex-col", schermoIntero && "flex-1")}>
          <div role="status" aria-live="polite">
            {notice && (
              <p className="rounded-xl border bg-secondary/40 p-3 text-sm text-muted-foreground">
                {notice}
              </p>
            )}
          </div>

          <Step
            catalog={catalog}
            draft={draft}
            problems={problems}
            onChange={handleChange}
          />

          {/*
            Il bottone che manda avanti sta nella nav, in alto: le schermate di
            scelta sono lunghe e su telefono il fondo pagina è lontano. Qui
            resta solo il ritorno indietro.
          */}
          {position && (
            <NavAction>
              <Button
                type="button"
                variant="ticket"
                size="nav"
                disabled={missing.length > 0 || pending}
                onClick={avanti}
              >
                Seleziona
              </Button>
            </NavAction>
          )}

          <nav
            className={cn(
              "flex flex-wrap items-center justify-center gap-3 border-t pt-6",
              schermoIntero && "mt-auto pb-4",
            )}
          >
            {position && (
              <Link
                href="#"
                className="self-center w-full text-center text-muted-foreground underline"
                onClick={(e) => {
                  e.preventDefault();
                  indietro();
                }}
              >
                Indietro
              </Link>
            )}
          </nav>
        </div>

        {/* <PersonaggioSheet
            resolved={resolveDraft(catalog, draft)}
            variant="aside"
            title="Il tuo personaggio"
            className="h-fit lg:sticky lg:top-6"
          /> */}
        {/* </div> */}
      </div>
    </StepAnimation>
  );
}
