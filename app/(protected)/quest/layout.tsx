import type { Viewport } from "next";

/**
 * La quest è un'esperienza a schermo intero da telefono: niente Nav, una colonna
 * stretta al centro, e i margini che rispettano notch e barra di sistema
 * (`viewportFit: "cover"` fa arrivare la pagina fino ai bordi, le safe area la
 * tengono leggibile). `--quest-top` è il padding in alto: lo legge QuestHeader
 * per annullarlo e partire dal bordo dello schermo. `--quest-bottom` è quello in
 * basso: lo legge PassoNumero per mettere i suoi bottoni a una distanza fissa dal
 * bordo dello schermo.
 */
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function QuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-gutter pb-[var(--quest-bottom)] pt-[var(--quest-top)] [--quest-bottom:max(1.25rem,env(safe-area-inset-bottom))] [--quest-top:max(1.25rem,env(safe-area-inset-top))]">
      {children}
    </main>
  );
}
