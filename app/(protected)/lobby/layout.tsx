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
        {/* <Footer /> */}
      </div>
    </main>
  );
}
