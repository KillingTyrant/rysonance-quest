import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex items-center">
      Ciao, {user?.user_metadata?.full_name || user.email?.split("@")[0]}
      <LogoutButton />
    </div>
  ) : null;
}
