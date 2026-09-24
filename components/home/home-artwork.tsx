import Image from "next/image";

import { Logo } from "@/components/layout/logo";

// Import relativo e non con l'alias `@/`: vedi la nota in `assets/catalog/index.ts`.
import voidMonster from "../../assets/layout/VoidMonster.webp";

/**
 * Apertura della home: l'artwork a tutta larghezza con il logo sopra.
 *
 * Import statico e non `public/`: l'URL porta l'hash del contenuto, quindi la
 * cache è `immutable`. `preload` perché è l'LCP della pagina.
 *
 * Niente `placeholder="blur"`: il filtro SVG di Next rende opachi i pixel
 * trasparenti riempiendoli di nero, e qui il bordo dei denti è trasparente, quindi
 * durante il caricamento compariva un blocco nero. Si passa invece la miniatura
 * dell'import statico come placeholder diretto, che conserva la trasparenza; in
 * dev la miniatura è un URL e non un data URL, e lì si resta senza placeholder.
 * `objectPosition` va in `style` e non in classe perché Next lo riusa come
 * `background-position` del placeholder, così la miniatura è ritagliata come l'immagine.
 *
 * Niente fondo né sfumatura: il bordo frastagliato dei denti è trasparente e si
 * apre direttamente sul fondo chiaro della pagina, quindi l'immagine è ancorata
 * in basso e il ritaglio mangia la parte alta.
 */
// const placeholder = voidMonster.blurDataURL?.startsWith("data:image/")
//   ? (voidMonster.blurDataURL as `data:image/${string}`)
//   : "empty";

export function HomeArtwork() {
  return (
    <div className="relative h-[46svh] min-h-[280px] w-full overflow-hidden sm:h-[52svh]">
      <Image
        src={voidMonster}
        alt=""
        fill
        preload
        // placeholder={placeholder}
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: "bottom" }}
      />

      <Logo
        iconOnly={false}
        className="absolute left-1/2 top-8 h-10 w-auto -translate-x-1/2 text-white sm:top-10 sm:h-10"
      />
    </div>
  );
}
