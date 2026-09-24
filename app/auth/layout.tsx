import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex flex-col items-center pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 w-full flex flex-col items-center">
        <Nav />
        <div className="flex-1 w-full flex flex-col max-w-5xl p-4">
          {children}
        </div>
        <Footer />
      </div>
    </main>
  );
}
