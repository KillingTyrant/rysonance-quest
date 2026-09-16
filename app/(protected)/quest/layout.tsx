import { Nav } from "@/components/layout/nav";

export default function QuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <Nav />
        <div className="flex-1 w-full flex flex-col max-w-5xl p-5">
          {children}
        </div>

      </div>
    </main>
  );
}
