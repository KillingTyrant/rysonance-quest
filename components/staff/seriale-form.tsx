"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { percorsoPass } from "@/lib/staff/percorsi";

/**
 * Il seriale scritto a mano: quando la fotocamera non c'è, non ha il permesso
 * o il codice sullo schermo del giocatore non si legge.
 */
export function SerialeForm() {
  const router = useRouter();
  const [seriale, setSeriale] = useState("");
  const valore = seriale.trim();

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (valore) router.push(percorsoPass(valore));
      }}
    >
      <Label htmlFor="seriale">Oppure scrivi il seriale del pass</Label>
      <div className="flex gap-2">
        <Input
          id="seriale"
          value={seriale}
          onChange={(event) => setSeriale(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          className="font-mono"
        />
        <Button type="submit" variant="outline" size="default" disabled={!valore}>
          Cerca
        </Button>
      </div>
    </form>
  );
}
