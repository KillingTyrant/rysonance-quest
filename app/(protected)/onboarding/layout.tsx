import { Nav } from "@/components/layout/nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <Nav hideAuthButton={true} sticky />
        <div className="flex-1 w-full flex flex-col max-w-5xl p-4">
          {children}
        </div>

      </div>
    </main>
  );
}
