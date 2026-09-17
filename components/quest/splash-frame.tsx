import { PartnerLogo } from "@/components/brand/partner-logo";

import { QUEST_COPY } from "./copy";

/**
 * L'ultimo fotogramma del caricamento: logo del partner e barra piena. È statico
 * (nessun "use client") perché fa due lavori: chiude la sequenza di nascita
 * dell'eroe e fa da fallback della quest mentre il server la prepara. Essendo
 * identici, il passaggio da una pagina all'altra non si vede.
 */
export function SplashFrame() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center">
        <PartnerLogo className="h-auto w-44" />
      </div>
      <div className="flex flex-col gap-3">
        <p role="status" className="text-center text-xs text-muted-foreground">
          {QUEST_COPY.caricamento}
        </p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full bg-foreground" />
        </div>
      </div>
    </div>
  );
}
