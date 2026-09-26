import type { Metadata } from "next";

import { Nav } from "@/components/layout/nav";

/** Strumenti interni: niente indicizzazione. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * L'area staff si usa dal telefono, in piedi all'ingresso: una colonna stretta
 * e la nav con il logout in cima. Chi può entrare lo decide ogni pagina, con le
 * RPC di rysonance-db: un layout non si riesegue a ogni navigazione, quindi non
 * è il posto per un controllo di accesso.
 */
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center">
      <Nav sticky />
      <div className="flex w-full max-w-md flex-1 flex-col px-4 pt-6">{children}</div>
    </main>
  );
}
