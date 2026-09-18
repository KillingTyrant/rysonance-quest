import { Hero } from "@/components/hero";
import { HeroAnimations } from "@/components/hero-animations";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Nav />
        <div className="flex-1 flex flex-col justify-center w-full p-5 items-center">
          <Suspense fallback={<div>Loading...</div>}>
          <HeroAnimations>
            <Hero />
          </HeroAnimations>
          </Suspense>
        </div>
        <Footer />
      </div>
    </main>
  );
}
