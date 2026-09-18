import { ThemeSwitcher } from "../theme-switcher";

export async function Footer() {
    return (
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs">
            <p>
                Powered by Rysonance all rights reserved. 2026
            </p>
            <ThemeSwitcher />
        </footer>
    )
}