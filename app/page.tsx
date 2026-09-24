import { Suspense } from "react";

import { HomeArtwork } from "@/components/home/home-artwork";
import { HomeCta, HomeCtaFallback } from "@/components/home/home-cta";
import { Footer } from "@/components/layout/footer";

/**
 * Home: artwork a tutta larghezza con il logo sopra, poi il claim e il sign-up.
 *
 * Niente nav (il logo sta sull'immagine) e niente griglia di esagoni: il fondo è
 * piatto, #F6F6F6. La home resta chiara anche a tema scuro — l'artwork fa già da
 * parte scura — quindi invece di colori fissi ridefinisce qui i token: così anche
 * i figli che li usano (il footer) restano coerenti senza casi speciali.
 */
export default function Home() {
  return (
    <main
      className="flex min-h-dvh flex-col overflow-x-clip bg-background text-foreground [--background:0_0%_96.5%] [--border:0_0%_88%] [--card-foreground:0_0%_15%] [--card:0_0%_96.5%] [--foreground:0_0%_15%] [--muted-foreground:0_0%_45%]"
    >
      <HomeArtwork />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
        <h1 className="max-w-md text-balance text-3xl font-bold leading-tight sm:text-4xl">
          Che il gioco abbia inizio.
        </h1>
        <Suspense fallback={<HomeCtaFallback />}>
          <HomeCta />
        </Suspense>
      </div>

      <Footer />
    </main>
  );
}
