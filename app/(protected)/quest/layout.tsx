import type { Viewport } from "next";

/**
 * La quest è un'esperienza a schermo intero da telefono: niente Nav, una colonna
 * stretta al centro, e i margini che rispettano notch e barra di sistema
 * (`viewportFit: "cover"` fa arrivare la pagina fino ai bordi, le safe area la
 * tengono leggibile).
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      {children}
    </main>
  );
}
