import localFont from "next/font/local";

import { Nav } from "@/components/layout/nav";

/**
 * Sprat Condensed, il serif display dei titoli delle card razza.
 *
 * Sta qui e non nel root layout di proposito: `next/font` fa il preload solo
 * sulle rotte coperte dal file che dichiara il font, e oggi Sprat serve solo al
 * wizard. Se servirà anche a quest o lobby si sposta in `app/layout.tsx` e non
 * cambia nient'altro — la utility `font-sprat` legge la CSS variable, non il
 * nome della famiglia.
 *
 * Solo i due pesi che il design usa davvero (200 sulla card aperta, 400 su
 * quella chiusa): ogni file elencato qui è un preload in più nell'head. Thin e
 * Medium sono già in `app/fonts/`, basta aggiungerli all'array quando servono.
 */
const sprat = localFont({
  src: [
    { path: "../../fonts/Sprat-CondensedLight.woff2", weight: "200", style: "normal" },
    { path: "../../fonts/Sprat-CondensedRegular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-sprat",
  display: "swap",
  // Il fallback metrico di default è Arial: per un serif condensed il salto di
  // layout è più contenuto partendo da Times New Roman.
  adjustFontFallback: "Times New Roman",
});

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className={`${sprat.variable} min-h-screen flex flex-col items-center`}>
      <div className="flex-1 w-full flex flex-col items-center">
        <Nav hideAuthButton={true} sticky />
        <div className="flex-1 w-full flex flex-col max-w-5xl p-4">
          {children}
        </div>

      </div>
    </main>
  );
}
