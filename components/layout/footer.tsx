import { ThemeSwitcher } from "../theme-switcher";

export async function Footer() {
    return (
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs bg-card/60 backdrop-blur-sm gap-4">
            <p>
                Powered by Rysonance all rights reserved. 2026
            </p>
            <a
                href="https://www.iubenda.com/privacy-policy/62133351"
                className="iubenda-white iubenda-noiframe iubenda-embed hover:underline"
                title="Privacy Policy"
            >
                Privacy Policy
            </a>
            <a
                href="https://www.iubenda.com/privacy-policy/62133351/cookie-policy"
                className="iubenda-white iubenda-noiframe iubenda-embed hover:underline"
                title="Cookie Policy"
            >
                Cookie Policy
            </a>
            <ThemeSwitcher />
        </footer>
    )
}