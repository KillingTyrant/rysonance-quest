import { Nav } from "@/components/layout/nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `min-h-dvh` e non `min-h-screen`: su iOS `100vh` è il viewport con le
    // barre del browser nascoste, e le CTA ancorate in fondo (hub, intro,
    // conferma) finivano sotto la toolbar. Stesso schema del layout della quest.
    <main className="min-h-dvh flex flex-col items-center pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 w-full flex flex-col items-center">
        <Nav hideAuthButton={true} sticky />
        <div className="flex-1 w-full flex flex-col max-w-5xl">
          {children}
        </div>

      </div>
    </main>
  );
}
