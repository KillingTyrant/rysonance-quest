import { D12Dice } from "@/components/dice/D12Dice";

export const metadata = {
  title: "Quest · Rysonance",
};

export default async function QuestPage() {

  return (

    <div className="flex w-full flex-1 flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold">Quest</h1>
        </div>
      </header>
      <D12Dice fill className="max-w-none" />
    </div>
  );
}
