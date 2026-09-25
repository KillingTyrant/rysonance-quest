import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// Dominio di produzione, non l'URL del singolo deploy (VERCEL_URL): serve ai link assoluti dei metadata.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const defaultUrl = productionHost ? `https://${productionHost}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Rysonance",
  description: "Rysonance RPG, un gioco di ruolo immersivo",
  keywords: ["Rysonance", "RPG", "gioco di ruolo", "immersivo"],
  authors: [{ name: "Rysonance Team" }],
  openGraph: {
    title: "Rysonance",
    description: "Rysonance RPG, un gioco di ruolo immersivo",
    url: defaultUrl,
    siteName: "Rysonance",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rysonance",
    description: "Rysonance RPG, un gioco di ruolo immersivo",
    site: "@RysonanceTeam",
  },
  // Icone: le genera Next dai file app/favicon.ico, app/icon.svg e app/apple-icon.tsx.
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

/**
 * Cabinet Grotesk, il font dell'intera app (utility `font-sans`, default del body).
 */
const cabinetGrotesk = localFont({
  src: "./fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-cabinet",
  display: "swap",
  weight: "100 900",
});

/**
 * Sprat Condensed, il serif display (utility `font-sprat`): solo sui titoli
 * aspirazionali e sui nomi di lore nelle card (razze, vie, talenti).
 * Light sta su 200 perché è il peso "extralight" del design delle card razza.
 */
const sprat = localFont({
  src: [
    { path: "./fonts/Sprat-CondensedThin.woff2", weight: "100", style: "normal" },
    { path: "./fonts/Sprat-CondensedLight.woff2", weight: "200", style: "normal" },
    { path: "./fonts/Sprat-CondensedRegular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Sprat-CondensedMedium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-sprat",
  display: "swap",
  // Il fallback metrico di default è Arial: per un serif condensed il salto di
  // layout è più contenuto partendo da Times New Roman.
  adjustFontFallback: "Times New Roman",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${cabinetGrotesk.variable} ${sprat.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          // Per ora solo tema chiaro: il dark resta definito ma non selezionabile.
          // Per riattivarlo togliere forcedTheme e rimettere <ThemeSwitcher /> nel footer.
          forcedTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Script
          src="https://cdn.iubenda.com/iubenda.js"
          strategy="lazyOnload"
        />
        <Script
          src="https://embeds.iubenda.com/widgets/a13a51f6-135d-4b0b-baf3-4237d7b5a213.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
