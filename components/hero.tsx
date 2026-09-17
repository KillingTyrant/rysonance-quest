import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/button";
import Link from "next/link";


export async function Hero() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return (
    <>
      {user ? (
        <div className="flex items-center gap-4">
          <Button asChild variant="ticket" className="w-52">
            <Link href="/lobby">Lobby</Link>
          </Button>
        </div>
      ) : (
        <Button asChild variant="ticket" className="w-full">
          <Link href="/auth/login">Accedi</Link>
        </Button>
      )}
      <Button asChild variant="ticketSecondary" className="w-52">
        <Link href="/dado">Lancia il dado</Link>
      </Button>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </>
  );
}
