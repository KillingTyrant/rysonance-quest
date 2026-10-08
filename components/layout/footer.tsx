import Script from "next/script";

import { cn } from "@/lib/utils";

export async function Footer({ className }: { className?: string }) {
    return (
        <footer className={cn("w-full flex items-center justify-center border-t mx-auto text-center text-xs bg-card/60 backdrop-blur-sm gap-4 h-6", className)}>
            <p>&copy; Rysonance 2026</p>
            <a
                href="https://www.iubenda.com/privacy-policy/62133351"
                className="iubenda-white iubenda-noiframe iubenda-embed hover:underline"
                title="Privacy Policy"
            >Privacy Policy</a>
            <a
                href="https://www.iubenda.com/privacy-policy/62133351/cookie-policy"
                className="iubenda-white iubenda-noiframe iubenda-embed hover:underline"
                title="Cookie Policy"
            >Cookie Policy</a>
            {/*
              iubenda.js riscrive i link `.iubenda-embed` (stili inline, script del
              badge inserito accanto). Caricato da qui parte solo dopo che il footer
              è stato idratato: dal root layout poteva arrivare prima e far fallire
              l'hydration. next/script lo carica una volta sola per sessione.
            */}
            <Script src="https://cdn.iubenda.com/iubenda.js" strategy="lazyOnload" />
        </footer>
    )
}
