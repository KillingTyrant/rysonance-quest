import Image from "next/image";

import { Logo } from "@/components/layout/logo";

// Import relativo e non con l'alias `@/`: vedi la nota in `assets/catalog/index.ts`.
import voidMonster from "../../assets/layout/VoidMonster.webp";

/**
 * Apertura della home: l'artwork a tutta larghezza con il logo sopra.
 *
 * Import statico e non `public/`: l'URL porta l'hash del contenuto, quindi la
 * cache è `immutable`. `preload` perché è l'LCP della pagina; il blur arriva
 * dall'import statico e copre il caricamento.
 *
 * Niente fondo né sfumatura: il bordo frastagliato dei denti è trasparente e si
 * apre direttamente sul fondo chiaro della pagina, quindi l'immagine è ancorata
 * in basso e il ritaglio mangia la parte alta.
 */
export function HomeArtwork() {
  return (
    <div className="relative h-[46svh] min-h-[280px] w-full overflow-hidden sm:h-[52svh]">
      <Image
        src={voidMonster}
        alt=""
        fill
        preload
        placeholder="blur"
        sizes="100vw"
        className="object-cover object-bottom"
      />

      <Logo
        iconOnly={false}
        className="absolute left-1/2 top-8 h-5 w-auto -translate-x-1/2 text-white sm:top-10 sm:h-6"
      />
    </div>
  );
}
