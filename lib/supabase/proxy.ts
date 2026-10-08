import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

/** Pagine esatte aperte anche senza login. */
const PUBLIC_PAGES = new Set(["/", "/dado"]);
/** Sezioni aperte senza login, con tutto ciò che sta sotto. */
const PUBLIC_PREFIXES = ["/login", "/auth"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PAGES.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/** L'area dello staff: senza sessione si va al login, e poi si torna qui. */
function isStaffPath(pathname: string): boolean {
  return pathname === "/staff" || pathname.startsWith("/staff/");
}

/** Il wizard di creazione: la quest prevede un solo personaggio per utente. */
function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

/**
 * Redirect per chi ha una sessione: si porta dietro i cookie che getClaims può
 * aver rinnovato su `supabaseResponse` (vedi la nota in fondo a updateSession).
 */
function redirectWithSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const response = NextResponse.redirect(url);
  supabaseResponse.cookies
    .getAll()
    .forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname, search } = request.nextUrl;
  if (!user && isStaffPath(pathname)) {
    // Lo staff apre lo scanner o un pass da un link diretto: il login deve
    // riportarlo lì, non all'onboarding dei giocatori.
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (!user && !isPublicPath(pathname)) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const isHome = pathname === "/";
  if (user && request.method === "GET" && (isHome || isOnboardingPath(pathname))) {
    // Un eroe a testa. Chi è loggato salta la home: in lobby se l'eroe ce l'ha,
    // nel wizard se deve ancora crearlo; e nel wizard non rientra chi ne ha già
    // uno (ci si arriva soprattutto dal login, che senza `?next=` porta lì).
    // Solo GET: la server action del wizard fa POST su /onboarding e non va
    // dirottata. Se la query fallisce si lascia passare, è un controllo
    // ottimistico: la home rimanda comunque in lobby chi ha una sessione. Il
    // filtro per proprietario lo fa RLS.
    const { data: personaggi, error } = await supabase
      .from("personaggi")
      .select("id")
      .limit(1);

    if (!error) {
      if (personaggi.length > 0) {
        return redirectWithSession(request, supabaseResponse, "/lobby");
      }
      if (isHome) {
        return redirectWithSession(request, supabaseResponse, "/onboarding");
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
