import { Logo } from "@/components/layout/logo";

/**
 * Il logo in cima alle schermate della quest. Ogni schermata ha il suo, nella
 * stessa posizione: durante un cambio la nuova copre la vecchia e il logo sembra
 * restare fermo.
 */
export function QuestHeader() {
  return (
    <div className="flex justify-center pb-6">
      <Logo iconOnly={false} className="h-auto w-28" />
    </div>
  );
}
