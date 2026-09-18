import { Hero } from "@/components/hero";
import { Footer } from "@/components/layout/footer";
import { Logo } from "@/components/layout/logo";
import { Nav } from "@/components/layout/nav";
import { QuestStamp } from "@/components/quest-stamp";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Nav />
        <div className="flex-1 flex flex-col justify-center w-full p-5 items-center">

          <div className="flex flex-col gap-8 items-center max-w-4xl w-full text-center">

            <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
            <h1 className="relative w-full max-w-2xl">
              <Logo className="h-auto w-full fill-primary" iconOnly={false} />
              <QuestStamp className="absolute -bottom-5 right-0 px-4 py-1 text-xl font-black uppercase tracking-[0.35em] text-primary-foreground sm:-bottom-8 sm:px-6 sm:py-1.5 sm:text-4xl" />
            </h1>
            <Suspense fallback={<div>Loading...</div>}>
              <Hero />
            </Suspense>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}
