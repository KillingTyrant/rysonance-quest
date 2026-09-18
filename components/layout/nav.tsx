import Link from "next/link";
import { Logo } from "@/components/layout/logo";

import { AuthButton } from "../auth/auth-button";
import { Suspense } from "react";


export async function Nav() {
    return (
        <nav className="w-full flex justify-center border-b border-b-foreground/10 bg-card/60 backdrop-blur-sm">
            <div className="w-full h-8 max-w-5xl flex justify-between items-center px-4 text-sm">
                <div className="h-full flex gap-5 items-center font-semibold">
                    <Link
                        href={"/"}
                    >
                        <Logo className="h-5 w-auto shrink-0" />
                    </Link>

                </div>
                <div className="w-full flex justify-end items-center gap-5">
                    <Suspense>
                        <AuthButton />
                    </Suspense>

                </div>
            </div>
        </nav>
    );
}