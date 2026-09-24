import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { CompassLogo } from "@/components/not-found/compass-logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pagina non trovata · Rysonance",
};

/**
 * La 404 dell'app: la mostra ogni URL che non corrisponde a una route e ogni
 * `notFound()` senza un `not-found.tsx` più vicino. Si rende sotto il solo root
 * layout, che non ha Nav né Footer: li aggiunge qui, come la home.
 *
 * Da non autenticati si vede solo sotto `/auth` e `/login`: ogni altro path
 * il proxy lo reindirizza alla home prima che il routing cerchi la pagina.
 */
export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Nav />
        <div className="flex-1 flex flex-col justify-center w-full p-5 items-center">
          <div className="flex flex-col gap-10 items-center max-w-xl w-full text-center">
            <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />

            {/*
              Il simbolo del logo fa da "0". Le cifre di Cabinet Grotesk sono
              alte 0,67em: il cerchio sta sulla baseline e le supera di 0,01em
              sopra e sotto, l'overshoot che hanno le lettere tonde. Misure in
              `em` perché valgano a entrambe le dimensioni, niente tracking
              perché si sommerebbe solo allo spazio a sinistra del simbolo.
              `top` e non `translate`: il transform lo scrive GSAP.
            */}
            <div
              aria-hidden
              className="flex items-baseline gap-[0.06em] text-8xl sm:text-9xl font-extrabold leading-none"
            >
              <span>4</span>
              <CompassLogo className="relative top-[0.01em] h-[0.69em] w-auto" />
              <span>4</span>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-bold">
                <span className="sr-only">Errore 404: </span>
                Sentiero smarrito
              </h1>
              <p className="text-balance text-lg text-muted-foreground">
                Nessuna mappa di Rysonance porta fin qui: la pagina che cerchi
                non esiste o è stata spostata.
              </p>
            </div>

            <Button asChild variant="ticket" size="lg" className="w-52">
              <Link href="/">Torna all&apos;inizio</Link>
            </Button>

            <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}
