import { createClient } from "@/lib/supabase/server";
// import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";


export async function Hero() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return (
    <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
      <Button asChild variant="ticket" size="lg" className="h-12 text-base sm:flex-1">
        <Link href={user ? "/lobby" : "/auth/login"}>
          {user ? "Vai alla Lobby" : "Inizia la quest"}
          {/* <ArrowRight className="transition-transform group-hover:translate-x-0.5" /> */}
        </Link>
      </Button>
      <Button asChild variant="ticketSmall" size="lg" className="h-12 text-base sm:flex-1">
        <Link href="/dado">Lancia il dado</Link>
      </Button>
    </div>
  );
}

/** Stesso ingombro dei bottoni, così la pagina non salta quando arriva la sessione. */
export function HeroFallback() {
  return <div className="h-[6.75rem] w-full max-w-lg sm:h-12" />;
}
