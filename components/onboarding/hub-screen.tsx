import { Check, Plus, RefreshCcw } from "lucide-react";
import Image, { type StaticImageData } from "next/image";

import { CATALOG_IMAGES } from "@/assets/catalog";
// Import relativo e non con l'alias `@/`: vedi la nota in `assets/catalog/index.ts`.
import squarcio from "../../assets/layout/squarcio.webp";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WIZARD_GROUPS, type GroupId } from "@/lib/onboarding/groups";
import { resolveDraft, type ResolvedPersonaggio } from "@/lib/onboarding/selectors";
import { cn } from "@/lib/utils";
import type { Catalog, PersonaggioDraft } from "@/lib/onboarding/types";
import { NAME_MAX_LENGTH } from "@/lib/onboarding/validate";

import type { SaveError } from "./wizard-steps";

/** Il riepilogo della riga, con i nomi del catalogo al posto delle chiavi. */
function selectionValue(groupId: GroupId, resolved: ResolvedPersonaggio): string | null {
  if (groupId === "razza") {
    const values = [resolved.razza?.name, resolved.tribu?.name].filter(
      (value): value is string => Boolean(value),
    );
    return values.length > 0 ? values.join(" • ") : null;
  }

  if (groupId === "via") return resolved.via?.name ?? null;

  if (groupId === "talenti") {
    const { talenti } = resolved;
    return talenti.length > 0 ? talenti.map((talento) => talento.name).join(", ") : null;
  }

  return null;
}

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
 * L'icona dentro il quadrato della riga: quella della razza o della via
 * scelta. I talenti non hanno icona e tengono la spunta.
 */
function selectionImage(groupId: GroupId, draft: PersonaggioDraft): StaticImageData | undefined {
  if (groupId === "razza" && draft.razza_key) return CATALOG_IMAGES.razzeIcone[draft.razza_key];
  if (groupId === "via" && draft.via_key) return CATALOG_IMAGES.vieIcone[draft.via_key];
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
 * dall'intro). Qui si scrive anche il nome, e la CTA salva l'eroe: si
 * abilita solo quando tutti i macro-passi sono completi e il nome è valido.
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
    <div className="relative isolate flex flex-1 flex-col p-4">
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

      <h1 className="text-4xl font-bold">Genesi dell&apos;eroe</h1>

      <ol className="flex flex-col gap-8 mt-4">
        {WIZARD_GROUPS.map((group) => {
          const isDone = completed(group.id);
          const isUnlocked = unlocked(group.id);
          const selectedValue = selectionValue(group.id, resolved);
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
                <span
                  className={cn(
                    "relative isolate flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm",
                    image
                      ? isDone
                        ? "text-white"
                        : "border-primary text-white "
                      : isDone
                        ? "bg-primary text-white"
                        : isUnlocked
                          ? "bg-brand text-primary border-primary rounded-sm border-2"
                          : "bg-muted/60 text-muted-foreground rounded-sm border-2",
                  )}
                >
                  {image && (
                    <>
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="3rem"
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
                <span className={cn("w-full font-medium leading-snug", isDone && "")}>
                  {!selectedValue && <span className="block">{labelHead}</span>}
                  {!selectedValue && <span className="block">{labelTail}</span>}
                  {selectedValue && group.id === 'razza' ? (
                    <>
                      <span className="block font-bold text-xl"> {selectedValue.split(" ")[0]} </span>
                      {/* <span className="block"> {selectedValue.split(" ")[1]} </span> */}
                    </>
                  ) : (
                    <span className="block font-bold text-xl"> {selectedValue} </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
        {/* Crea random */}
        <li key={'create-random'}>
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
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-white"
              )}
            >
              {/* random icon */}
              <RefreshCcw />

            </span>
            <span className={cn("w-full font-medium leading-snug ")}>
              <span className="block">Crea</span>
              <span className="block">un eroe random</span>
            </span>
          </button>
        </li>

      </ol>

      <div className="mt-auto flex flex-col gap-3 pt-6 justify-center items-center">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="nome-personaggio" className="text-white font-bold text-xl">Nome dell&apos;eroe</Label>
          <Input
            id="nome-personaggio"
            value={draft.name}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            placeholder="Es. Aurel"
            disabled={pending}
            aria-invalid={draft.name.length > 0 && nameProblems.length > 0}
            aria-describedby={nameProblems.length > 0 ? "nome-personaggio-hint" : undefined}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full bg-primary text-background rounded-md"
          />
        </div>

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
