import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

import { AuthButton } from "../auth/auth-button";
import { Suspense } from "react";

export async function Nav({
    hideAuthButton,
    sticky,
}: {
    hideAuthButton?: boolean;
    /** Tiene la nav — e quindi la sua azione — visibile mentre si scorre. */
    sticky?: boolean;
}) {
    return (
        <nav
            className={cn(
                "w-full flex justify-center bg-card/60 backdrop-blur-sm",
                sticky && "sticky top-0 z-40",
            )}
        >
            {/*
              L'altezza è un minimo, non una misura: quando nello slot c'è un
              bottone la barra cresce per contenerlo invece di tagliarlo.
            */}
            <div className="w-full min-h-8 max-w-5xl flex justify-between items-center gap-3 px-2 py-1 text-sm">
                <div className="h-full flex gap-5 items-center font-semibold">
                    <Link href={"/"} >
                        <Logo iconOnly={false} className="h-5 w-auto shrink-0" />
                    </Link>
                </div>
                <div className="w-full flex justify-end items-center gap-3">
                    {/* Slot dell'azione della schermata corrente: ci scrive
                        dentro <NavAction> (components/layout/nav-action.tsx). */}
                    <div id="nav-action" className="flex items-center" />
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
