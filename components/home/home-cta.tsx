import Link from "next/link";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

/** Pillola scura della home: stessa forma per Google e per il rientro in lobby. */
const PILL =
  "h-14 w-full rounded-full bg-[#272727] text-base font-bold text-[#f6f6f6] hover:bg-[#3a3a3a] active:bg-[#272727] flex flex-row";

export async function HomeCta() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Chi ha già una sessione non deve rifare il sign-up: torna alla lobby.
  if (user) {
    return (
      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <Button asChild variant="default" className={PILL} showDots={false}>
          <Link href="/lobby">Vai alla Lobby</Link>
        </Button>
        <Link href="/dado" className="text-sm underline underline-offset-4 opacity-70 hover:opacity-100">
          Lancia il dado
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <GoogleSignInButton
        className="w-full"
        label="Sign up with Google"
        showLogo
        variant="default"
        buttonClassName={PILL}
      />
      <Link
        href="/auth/sign-up"
        className="text-sm underline underline-offset-4 opacity-70 hover:opacity-100"
      >
        Registrati via mail
      </Link>
    </div>
  );
}

/** Stesso ingombro del blocco vero, così la pagina non salta quando arriva la sessione. */
export function HomeCtaFallback() {
  return <div className="h-[6.25rem] w-full max-w-xs" />;
}
