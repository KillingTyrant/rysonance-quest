import { Check, Plus, RefreshCcw } from "lucide-react";
import Image, { type StaticImageData } from "next/image";

import { CATALOG_IMAGES } from "@/assets/catalog";
// Import relativo e non con l'alias `@/`: vedi la nota in `assets/catalog/index.ts`.
import squarcio from "../../assets/layout/squarcio.webp";

import { LogoutButton } from "@/components/auth/logout-button";
import { NavAction } from "@/components/layout/nav-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WIZARD_GROUPS, type GroupId } from "@/lib/onboarding/groups";
import { resolveDraft, type ResolvedPersonaggio } from "@/lib/onboarding/selectors";
import { cn } from "@/lib/utils";
import type { Catalog, PersonaggioDraft } from "@/lib/onboarding/types";
import { NAME_MAX_LENGTH } from "@/lib/onboarding/validate";

import { SigilloEroe } from "./sigillo-eroe";
import type { SaveError } from "./wizard-steps";

/**
 * L'etichetta spezzata in due righe: la prima parola ("Scegli") sta da sola
 * sopra, il resto scende sotto, così le righe della hub restano allineate
 * fra loro invece di andare a capo dove capita.
 */
function labelLines(label: string): [string, string] {
  const [first, ...rest] = label.split(" ");
  return [first, rest.join(" ")];
}

/**
 * Il riepilogo della riga, con i nomi del catalogo al posto delle chiavi, già
 * diviso in righe. La razza ne ha una; la Via due, "Via del" sopra il nome
 * ("Guerriero", "Sapiente", "Viandante"); i talenti sempre due, la prima
 * parola sopra e il resto sotto ("Magia / elementale", "Armi / corpo a corpo").
 */
function selectionLines(groupId: GroupId, resolved: ResolvedPersonaggio): string[] | null {
  if (groupId === "razza") return resolved.razza ? [resolved.razza.name.split(" ")[0]] : null;

  if (groupId === "via") return resolved.via ? ["Via del", resolved.via.name] : null;

  if (groupId === "talenti") {
    const { talenti } = resolved;
    return talenti.length > 0
      ? labelLines(talenti.map((talento) => talento.name).join(", "))
      : null;
  }

  return null;
}

/**
 * L'icona dentro il quadrato della riga: quella della razza, della via o del
 * talento scelto. Il talento è uno solo (`TALENTI_DA_SCEGLIERE`): se diventassero
 * di più, il quadrato mostrerebbe il primo.
 */
function selectionImage(groupId: GroupId, draft: PersonaggioDraft): StaticImageData | undefined {
  if (groupId === "razza" && draft.razza_key) return CATALOG_IMAGES.razzeIcone[draft.razza_key];
  if (groupId === "via" && draft.via_key) return CATALOG_IMAGES.vieIcone[draft.via_key];
  if (groupId === "talenti" && draft.talenti[0]) return CATALOG_IMAGES.talentiIcone[draft.talenti[0]];
  return undefined;
}

type HubScreenProps = {
  catalog: Catalog;
  draft: PersonaggioDraft;
  completed: (id: GroupId) => boolean;
  unlocked: (id: GroupId) => boolean;
  allComplete: boolean;
  /** I problemi del nome, mostrati sotto il campo. */
  nameProblems: string[];
  pending: boolean;
  saveError: SaveError | null;
  onNameChange: (name: string) => void;
  onOpenGroup: (id: GroupId) => void;
  onRandomize: () => void;
  onCreaEroe: () => void;
};

/**
 * La hub "Genesi dell'eroe": lo stato di avanzamento come lista di
 * macro-passi. Le righe bloccate si sbloccano completando le precedenti;
 * quelle completate restano cliccabili per rivedere le scelte (ripassando
 * dall'intro). Il campo del nome compare solo quando tutti i macro-passi
 * sono completi, scelti a mano o con l'eroe random; la CTA salva l'eroe e si
 * abilita quando c'è anche un nome valido.
 */
export function HubScreen({
  catalog,
  draft,
  completed,
  unlocked,
  allComplete,
  nameProblems,
  pending,
  saveError,
  onNameChange,
  onOpenGroup,
  onRandomize,
  onCreaEroe,
}: HubScreenProps) {
  const resolved = resolveDraft(catalog, draft);

  return (
    // `overflow-x-clip`: il sigillo esce dal bordo destro, e senza la pagina
    // scorrerebbe di lato. `clip` e non `hidden`, che farebbe da contenitore di scroll.
    // `pb-[54px]`: il bottone delle preferenze di iubenda è fisso in basso a
    // destra, 38×38 a 16px dai bordi (CSS di iubenda): così la CTA "Crea Eroe"
    // finisce all'altezza del suo bordo alto e non gli si accosta di fianco.
    <div className="relative isolate flex flex-1 flex-col overflow-x-clip px-gutter pt-4 pb-[54px]">
      {/*
        Arte di sfondo: lo squarcio ha la metà alta trasparente e la materia in
        basso, quindi resta ancorato al fondo. Sta prima del velo che tiene
        leggibile il testo in entrambi i temi.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src={squarcio}
          alt=""
          fill
          // La hub sta nel contenitore max-w-5xl (64rem) del layout.
          sizes="(min-width: 64rem) 64rem, 100vw"
          className="object-cover object-bottom"
        />
        <div className="absolute inset-0" />
      </div>

      {/*
        Il logout sta nello slot della nav solo qui: negli step lo slot è del
        bottone che conferma la scelta, e la nav del wizard non ha l'AuthButton.
      */}
      <NavAction>
        <LogoutButton />
      </NavAction>

      <h1 className="text-4xl font-extrabold">Genesi dell&apos;eroe</h1>

      <div className="relative mt-8">
        {/*
          Il sigillo delle scelte, dietro le righe e sotto lo squarcio (-z-20 contro
          -z-10). Come nel mockup il centro sta 122px sotto l'inizio della lista e
          66px dal bordo dello schermo, cioè 50 dentro il margine: il sigillo è
          largo 334, quindi esce di 167 - 50 = 117px e il resto lo taglia la hub.
        */}
        <SigilloEroe
          razzaKey={draft.razza_key}
          viaKey={draft.via_key}
          className="pointer-events-none absolute -right-[117px] -top-[45px] -z-20"
        />
        <ol className="flex flex-col gap-6">
          {WIZARD_GROUPS.map((group) => {
            const isDone = completed(group.id);
            const isUnlocked = unlocked(group.id);
            const selectedLines = selectionLines(group.id, resolved);
            const image = selectionImage(group.id, draft);
            const [labelHead, labelTail] = labelLines(group.label);
            return (
              <li key={group.id}>
                <button
                  type="button"
                  disabled={!isUnlocked || pending}
                  onClick={() => onOpenGroup(group.id)}
                  className={cn(
                    "relative isolate flex w-full items-center gap-4 overflow-hidden rounded-md text-left",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isDone && "text-primary-900",
                    !isUnlocked && "opacity-50",
                  )}
                >
                  {/*
                    Il quadrato dell'icona. La riga bloccata tiene la stessa
                    forma e lo stesso spessore di quella attiva, ma con il bordo
                    tratteggiato in grigio di testo: `border-primary-foreground`
                    qui era quasi invisibile (bianco su muted in chiaro, scuro su
                    muted in scuro), e il quadrato sembrava senza bordo.
                  */}
                  {/* Da completato il quadrato cresce: 56px contro i 48 di quello
                      attivo e di quello bloccato. `mx-1` fa occupare anche a questi
                      56px di larghezza: i quadrati restano centrati sullo stesso asse
                      e le etichette allineate fra loro. Quelli con il "+" hanno
                      il raggio a 8px del design (`rounded-lg`). */}
                  <span
                    className={cn(
                      "relative isolate flex shrink-0 items-center justify-center overflow-hidden",
                      isDone ? "size-14 rounded-sm" : "size-12 mx-1 rounded-lg",
                      image
                        ? isDone
                          ? "text-white"
                          : "border-primary text-white "
                        : isDone
                          ? "bg-primary text-white"
                          : isUnlocked
                            ? "bg-brand text-primary border-primary border-2"
                            : "bg-muted/60 text-muted-foreground border-2",
                    )}
                  >
                    {image && (
                      <>
                        <Image
                          src={image}
                          alt=""
                          fill
                          sizes="3.5rem"
                          // Icone quasi quadrate (60×56): il ritaglio toglie
                          // solo qualche pixel ai lati.
                          className="-z-10 object-cover rounded-xl"
                        />
                        {/*
                          Il velo tiene leggibile l'icona sopra l'illustrazione,
                          che è chiara o scura a seconda della razza.
                        */}
                        {/* <span aria-hidden className="absolute inset-0 -z-10 bg-black/35" /> */}
                      </>
                    )}
                    {!isDone ? <Plus /> : !image ? <Check /> : null}
                  </span>
                  {/* 16/16.9 extrabold come su Figma, anche sulle righe grigie
                      bloccate: le due righe dell'etichetta restano strette. */}
                  <span className="w-full text-base font-extrabold leading-[16.9px]">
                    {selectedLines ? (
                      selectedLines.map((line) => (
                        <span key={line} className="block font-bold text-xl">
                          {line}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="block">{labelHead}</span>
                        <span className="block">{labelTail}</span>
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
          {/* Crea random */}
          <li key={'create-random'} className="mt-10">
            <button
              type="button"
              onClick={onRandomize}
              className={cn(
                "relative isolate flex w-full items-center gap-4 overflow-hidden rounded-full text-left",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
            >
              {/*
                    Il quadrato dell'icona. La riga bloccata tiene la stessa
                    forma e lo stesso spessore di quella attiva, ma con il bordo
                    tratteggiato in grigio di testo: `border-primary-foreground`
                    qui era quasi invisibile (bianco su muted in chiaro, scuro su
                    muted in scuro), e il quadrato sembrava senza bordo.
                  */}
              <span
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-white"
                )}
              >
                {/* random icon */}
                <RefreshCcw />

              </span>
              <span className="w-full text-base font-extrabold leading-[16.9px]">
                <span className="block">Crea</span>
                <span className="block">un eroe random</span>
              </span>
            </button>
          </li>

        </ol>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-6 justify-center items-center">
        {allComplete && (
          <div className="flex flex-col gap-2 w-full">
            {/* Senza label visibile: il placeholder fa da invito e
                `aria-label` dà il nome al campo per gli screen reader. */}
            <Input
              id="nome-personaggio"
              value={draft.name}
              maxLength={NAME_MAX_LENGTH}
              autoComplete="off"
              placeholder="Scegli un nome"
              aria-label="Nome dell'eroe"
              disabled={pending}
              aria-invalid={draft.name.length > 0 && nameProblems.length > 0}
              aria-describedby={nameProblems.length > 0 ? "nome-personaggio-hint" : undefined}
              onChange={(event) => onNameChange(event.target.value)}
              className="w-full bg-primary text-background rounded-xl text-center"
            />
          </div>
        )}

        {saveError && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm"
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

        {/* <Button
          type="button"
          variant="ticketSecondary"
          title="Creazione casuale"
          className="flex w-full items-center gap-4 rounded-md py-2 text-left"
          disabled={pending}
          onClick={onRandomize}
          showDots
        >
        Crea un eroe random
      </Button> */}
        <Button
          variant="ticket"

          disabled={!allComplete || nameProblems.length > 0 || pending}
          onClick={onCreaEroe}
        >
          {pending ? "Creazione…" : "Crea Eroe"}
        </Button>
      </div>
    </div >
  );
}
