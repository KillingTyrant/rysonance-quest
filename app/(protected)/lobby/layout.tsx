import { Nav } from "@/components/layout/nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex flex-col items-center pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 w-full flex flex-col items-center">
        <Nav />
        <div className="flex-1 w-full flex flex-col max-w-5xl px-gutter py-4">
          {children}
        </div>
        {/* Il footer si allunga sotto i link (`box-content`: la riga resta h-6) per
            fare posto al bottone flottante "Crea nuovo eroe" (40px a 16px dal bordo):
            a fine pagina il bottone sta nel footer e non copre privacy e cookie. */}
        {/* <Footer className="box-content pb-16" /> */}
      </div>
    </main>
  );
}
