"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";

import { salvaPersonaggio } from "@/app/(protected)/onboarding/actions";
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
  isRazzaGiocabile,
  razzaByKey,
  talentiDaScegliere,
  viaByKey,
} from "@/lib/onboarding/selectors";
import {
  problemsForStep,
  stepIndex,
  WIZARD_STEPS,
  type StepId,
} from "@/lib/onboarding/steps";
import type { Catalog, PersonaggioDraft } from "@/lib/onboarding/types";
import { emptyDraft, validateDraft } from "@/lib/onboarding/validate";

import { GroupIntro } from "./group-intro";
import { HubScreen } from "./hub-screen";
import { StepAnimation } from "./step-animation";
import { STEP_COMPONENTS, type SaveError } from "./wizard-steps";

/**
 * La vista corrente del wizard. La hub è il punto di partenza e di ritorno:
 * in un macro-passo si entra sempre passando dalla sua intro. Nella hub si
 * scrive anche il nome, e la sua CTA salva l'eroe.
 */
type WizardView =
  | { mode: "hub" }
  | { mode: "intro"; group: GroupId }
  | { mode: "step"; step: StepId };

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
  const [saved, setSaved] = useState<{ id: string; name: string } | null>(null);
  const [pending, startTransition] = useTransition();

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

  useEffect(() => {
    if (saved) window.scrollTo({ top: 0 });
  }, [saved]);

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
   * L'unico punto in cui il draft cambia, e quindi l'unico posto in cui vivono
   * gli invarianti fra campi. Sono tutti della stessa forma: una scelta fatta
   * prima ne invalida una fatta dopo, e invece di bloccare il cambio si toglie
   * ciò che non è più valido e lo si dice.
   */
  function handleChange(patch: Partial<PersonaggioDraft>) {
    const next = { ...draft, ...patch };
    const avvisi: string[] = [];

    if (patch.razza_key !== undefined) {
      const razza = razzaByKey(catalog, next.razza_key);

      // Una tribù di un'altra razza non ha senso: il DB non lo vieta (la razza
      // la ricava dalla tribù), quindi l'invariante lo tiene la UI.
      if (next.tribu_key && !razza?.tribu.some((t) => t.key === next.tribu_key)) {
        next.tribu_key = null;
        avvisi.push("Cambiando razza la tribù non era più valida: l'ho tolta.");
      }
    }

    // Il Viandante dà tre talenti a scelta, le altre vie due: cambiando Via
    // quelli in eccesso vanno tolti, a partire dagli ultimi scelti.
    if (patch.via_key !== undefined) {
      const quanti = talentiDaScegliere(viaByKey(catalog, next.via_key));
      if (next.talenti.length > quanti) {
        next.talenti = next.talenti.slice(0, quanti);
        avvisi.push(`Questa Via dà ${quanti} talenti a scelta: ho tolto quelli in più.`);
      }
    }

    setDraft(next);
    setNotice(avvisi.join(" ") || null);
  }

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      try {
        const result = await salvaPersonaggio(draft);
        if (result.ok) setSaved({ id: result.id, name: draft.name.trim() });
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
    const razza = pickRandom(catalog.razze.filter(isRazzaGiocabile));
    const tribu = razza ? pickRandom(razza.tribu) : null;
    const via = pickRandom(catalog.vie);
    const quantiTalenti = talentiDaScegliere(via);
    const talenti = sampleUnique(
      catalog.talentiScelta.map((talento) => talento.key),
      quantiTalenti,
    );

    const randomDraft: PersonaggioDraft = {
      ...emptyDraft(),
      name: `Eroe ${Math.floor(1000 + Math.random() * 9000)}`,
      razza_key: razza?.key ?? null,
      tribu_key: tribu?.key ?? null,
      via_key: via?.key ?? null,
      talenti,
    };

    setDraft(randomDraft);
    setSaveError(null);
    setIsBackward(false);
    setView({ mode: "hub" });

    if (!via || !razza || !tribu || talenti.length !== quantiTalenti) {
      setNotice("Scelte casuali parziali: completa i campi mancanti.");
      return;
    }

    setNotice("Eroe random generato: puoi rivedere le scelte o procedere.");
  }

  if (saved) {
    return (
      <StepAnimation key="saved">
        <div className="flex w-full max-w-xl flex-col gap-6 self-center rounded-xl border bg-card p-8 text-center shadow">
          <h1 className="text-2xl font-semibold">Personaggio salvato</h1>
          <p className="text-muted-foreground">
            <strong className="font-semibold text-foreground">{saved.name}</strong> è pronto: lo trovi fra i tuoi personaggi.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center w-full">
            <Button asChild variant="ticket" className="w-full">
              <Link href={`/quest/${saved.id}`}>Vai alla quest</Link>
            </Button>
            {/* <Button asChild variant="outline">
              <Link href="/lobby">Vai alla lobby</Link>
            </Button> */}
            {/* <Button
              variant="outline"
              onClick={() => {
                setSaved(null);
                setDraft(emptyDraft());
                setView({ mode: "hub" });
                setNotice(null);
                setSaveError(null);
              }}
            >
              Creane un altro
            </Button> */}
          </div>
        </div>
      </StepAnimation>
    );
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
            onCreaEroe={handleSave}
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

  const step = view.step;
  const Step = STEP_COMPONENTS[step];
  const position = stepPositionInGroup(step);
  const missing = problemsForStep(problems, step).map((problem) => problem.label);

  return (
    <StepAnimation key={viewKey} isBackward={isBackward}>
      <div
        ref={viewRef}
        tabIndex={-1}
        className="flex w-full flex-col outline-none"
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
        <div className="flex flex-col">
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

          <nav className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            <Button
              className="w-52"
              type="button"
              variant="ticketSecondary"
              disabled={pending}
              onClick={() => {
                if (!position || position.index === 0) go({ mode: "hub" }, true);
                else
                  go(
                    { mode: "step", step: position.group.steps[position.index - 1] },
                    true,
                  );
              }}
            >
              {/* <ArrowLeft /> */}
              Indietro
            </Button>

            {position && (
              <div className="flex flex-wrap items-center justify-end gap-3">
                {missing.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Manca: {missing.join(", ")}
                  </span>
                )}
                <Button
                  className="w-52"
                  type="button"
                  variant="ticket"
                  disabled={missing.length > 0 || pending}
                  onClick={() => {
                    if (position.index === position.count - 1) go({ mode: "hub" });
                    else
                      go({
                        mode: "step",
                        step: position.group.steps[position.index + 1],
                      });
                  }}
                >
                  Avanti
                  {/* <ArrowRight /> */}
                </Button>
              </div>
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
