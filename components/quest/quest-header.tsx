import { Logo } from "@/components/layout/logo";

/**
 * La barra con il logo in cima alle schermate della quest: la stessa della Nav,
 * alta 60px su fondo bianco. Ogni schermata ha la sua, nella stessa posizione:
 * durante un cambio la nuova copre la vecchia e la barra sembra restare ferma.
 *
 * Esce dai margini della colonna (`-mx-gutter`) e dal suo padding in alto
 * (`--quest-top`, definito dal <main> che la contiene): così parte dal bordo
 * dello schermo, e con `viewportFit: "cover"` il bianco copre anche la zona
 * del notch, mentre i 60px restano sotto.
 */
export function QuestHeader() {
  return (
    <div className="-mx-gutter -mt-[var(--quest-top)] mb-6 box-content flex h-nav items-center justify-center pt-[env(safe-area-inset-top)]">
      <Logo iconOnly={false} className="h-auto w-28" />
    </div>
  );
}
