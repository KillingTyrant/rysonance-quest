import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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

const cabinetGrotesk = localFont({
  src: "./fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-cabinet",
  display: "swap",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${cabinetGrotesk.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
