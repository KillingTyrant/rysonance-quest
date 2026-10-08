import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

import { AuthButton } from "../auth/auth-button";
import { Suspense } from "react";

export async function Nav({
    hideAuthButton,
    sticky,
    disableLogoLink,
}: {
    hideAuthButton?: boolean;
    /** Tiene la nav — e quindi la sua azione — visibile mentre si scorre. */
    sticky?: boolean;
    /**
     * Logo senza link. Nel wizard `/` riporterebbe comunque all'onboarding (il
     * proxy ci rimanda chi non ha ancora un eroe): il link non porterebbe da
     * nessuna parte.
     */
    disableLogoLink?: boolean;
}) {
    const logo = <Logo iconOnly={false} className="h-7 w-auto shrink-0" />;

    return (
        <nav
            className={cn(
                "w-full flex justify-center bg-white",
                sticky && "sticky top-0 z-40",
            )}
        >
            {/*
              Alta sempre 60px, con o senza bottone: la CTA dello slot (40px)
              ci sta dentro. I margini laterali sono quelli della pagina.
            */}
            <div className="w-full h-nav max-w-5xl flex justify-between items-center gap-3 px-gutter text-sm">
                <div className="h-full flex shrink-0 gap-5 items-center font-semibold">
                    {disableLogoLink ? logo : <Link href={"/"} >{logo}</Link>}
                </div>
                {/* `min-w-0`: sui telefoni stretti la CTA può restringersi invece
                    di spingere fuori il logo. */}
                <div className="min-w-0 flex-1 flex justify-end items-center gap-3">
                    {/* Slot dell'azione della schermata corrente: ci scrive
                        dentro <NavAction> (components/layout/nav-action.tsx). */}
                    <div id="nav-action" className="flex min-w-0 items-center" />
                    {!hideAuthButton && (
                        <Suspense>
                            <AuthButton />
                        </Suspense>
                    )}
                </div>
            </div>
        </nav>
    );
}
