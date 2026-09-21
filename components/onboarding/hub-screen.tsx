import { Check, Plus } from "lucide-react";
import Image, { type StaticImageData } from "next/image";

import { CATALOG_IMAGES } from "@/assets/catalog";

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
    const values = [resolved.sesso, resolved.razza?.name, resolved.tribu?.name].filter(
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
 * Lo sfondo della riga: l'illustrazione della razza scelta, la stessa della
 * card della quest. Le vie non hanno ancora arte, quindi per ora solo la razza.
 */
function selectionImage(groupId: GroupId, draft: PersonaggioDraft): StaticImageData | undefined {
  if (groupId === "razza" && draft.razza_key) return CATALOG_IMAGES.razze[draft.razza_key];
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
 * La hub "Creazione dell'eroe": lo stato di avanzamento come lista di
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
    <div className="relative isolate flex flex-1 flex-col">
      {/*
        Slot per l'arte di sfondo (silhouette dell'eroe + bussola): l'asset non
        esiste ancora. Quando arriverà va importato staticamente da `assets/`
        (vedi docs/immagini_catalogo.md) e inserito qui, prima del velo che
        tiene leggibile il testo in entrambi i temi.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/25 to-transparent" />
      </div>

      <h1 className="text-4xl font-bold">Creazione dell&apos;eroe</h1>

      <ol className="flex flex-col gap-4">
        {WIZARD_GROUPS.map((group) => {
          const isDone = completed(group.id);
          const isUnlocked = unlocked(group.id);
          const selectedValue = selectionValue(group.id, resolved);
          const image = selectionImage(group.id, draft);
          return (
            <li key={group.id}>
              <button
                type="button"
                disabled={!isUnlocked || pending}
                onClick={() => onOpenGroup(group.id)}
                className={cn(
                  "relative isolate flex w-full items-center gap-4 overflow-hidden rounded-md p-2 text-left",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isDone && "bg-emerald-100/70 text-emerald-900",
                  image && "min-h-24",
                  !isUnlocked && "opacity-50",
                )}
              >
                {image && (
                  <>
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 60rem, 100vw"
                      className="-z-10 object-cover"
                    />
                    {/*
                      Come nella card della razza, il velo tiene leggibile il
                      testo: qui va da sinistra, dove stanno icona ed etichetta,
                      e prende il colore della riga completata.
                    */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-0 -z-10 bg-gradient-to-r to-transparent",
                        isDone
                          ? "from-emerald-100/95 via-emerald-100/70"
                          : "from-background/90 via-background/60",
                      )}
                    />
                  </>
                )}
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-sm",
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isUnlocked
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? <Check /> : <Plus />}

                </span>
                <span className={cn("w-full font-medium leading-snug", isDone && "text-emerald-900")}>
                  <span className="block">{group.label}</span>
                  {selectedValue && (
                    <span
                      className={cn(
                        "mt-1 block text-sm font-normal text-muted-foreground",
                        isDone && "text-emerald-800/90",
                      )}
                    >
                      {selectedValue}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nome-personaggio">Nome dell&apos;eroe</Label>
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
          />
          {nameProblems.length > 0 && (
            <p id="nome-personaggio-hint" className="text-sm text-muted-foreground">
              {nameProblems.join(" ")}
            </p>
          )}
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

        <Button
          type="button"
          variant="ticketSecondary"
          title="Creazione casuale"
          className="flex w-full items-center gap-4 rounded-md py-2 text-left"
          disabled={pending}
          onClick={onRandomize}
          showDots
        >
          {/* <Shuffle /> */}
          Crea un eroe random
        </Button>
        <Button
          variant="ticket"
          size="lg"
          className="w-full"
          disabled={!allComplete || nameProblems.length > 0 || pending}
          onClick={onCreaEroe}
        >
          {pending ? "Creazione…" : "Crea Eroe"}
        </Button>
      </div>
    </div>
  );
}
