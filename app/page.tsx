import { Hero, HeroFallback } from "@/components/hero";
import { HomeBackground } from "@/components/home/home-background";
import { HomeTagline } from "@/components/home/home-intro";
// import { ResonanceBackdrop } from "@/components/home/resonance-backdrop";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { LogoEntrance } from "@/components/logo-entrance";
import { QuestStamp } from "@/components/quest-stamp";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center overflow-x-clip">
      <HomeBackground />
      <div className="flex-1 w-full flex flex-col items-center">
        <Nav />
        <div className="flex-1 flex flex-col justify-center w-full px-5 py-16 items-center">
          <div className="flex flex-col gap-10 items-center max-w-4xl w-full text-center">
            <div className="relative isolate w-full max-w-2xl">
              {/* <ResonanceBackdrop className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2 sm:w-[115%]" /> */}
              <h1 className="relative">
                <LogoEntrance className="h-auto w-full fill-primary" />
                <QuestStamp className="absolute -bottom-5 right-0 px-4 py-1 text-xl font-black uppercase tracking-[0.35em] text-primary-foreground sm:-bottom-8 sm:px-6 sm:py-1.5 sm:text-4xl" />
              </h1>
            </div>
            <HomeTagline />
            <Suspense fallback={<HeroFallback />}>
              <Hero />
            </Suspense>
            {/* <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent mt-6" />
            <HomeSteps /> */}
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}
