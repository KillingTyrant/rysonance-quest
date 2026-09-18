import { Button } from "@/components/ui/button";

export default function StyleguidePage() {
  return (
    <div className="min-h-screen bg-[#f4f4f4] p-12 font-sans text-[#272727]">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* HEADER */}
        <div>
          <h1 className="text-5xl font-black mb-2 uppercase tracking-tight">
            Design System: Bottoni
          </h1>
          <p className="text-gray-500 text-lg font-medium">
            Vetrina interattiva definitiva. Prova l'hover e il click per testare maschere, bordi e animazioni.
          </p>
        </div>

        {/* 1. PRIMARY TICKETS */}
        <section className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-3xl font-bold border-b pb-4">1. Primary Tickets</h2>
          <div className="flex flex-wrap items-end gap-12">
            <div className="flex flex-col items-center gap-4">
              <span className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Large (56px)</span>
              <Button variant="ticket" size="lg">Gioca ora</Button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Default / Md (48px)</span>
              <Button variant="ticket" size="md">Gioca ora</Button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Small (40px)</span>
              <Button variant="ticket" size="sm">Gioca ora</Button>
            </div>
          </div>
        </section>

        {/* 2. SECONDARY TICKETS */}
        <section className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-3xl font-bold border-b pb-4">2. Secondary Tickets</h2>
          <div className="flex flex-wrap items-end gap-12">
            <div className="flex flex-col items-center gap-4">
              <span className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Large (56px)</span>
              <Button variant="ticketSecondary" size="lg">Gioca ora</Button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Default / Md (48px)</span>
              <Button variant="ticketSecondary" size="md">Gioca ora</Button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Small (40px)</span>
              <Button variant="ticketSecondary" size="sm">Gioca ora</Button>
            </div>
          </div>
        </section>

        {/* 3. SMALL TICKETS (Forma a Pillola) */}
        <section className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-3xl font-bold border-b pb-4">3. Small Tickets</h2>
          <div className="flex flex-wrap items-end gap-12">
            <div className="flex flex-col items-center gap-4">
              <span className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Medium (40px)</span>
              <Button variant="ticketSmall" size="md">Gioca ora</Button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Small (32px)</span>
              <Button variant="ticketSmall" size="sm">Gioca ora</Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}