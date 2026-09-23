import { Logo } from "@/components/layout/logo";

/**
 * Apertura della home: l'artwork a tutta larghezza con il logo sopra.
 *
 * L'illustrazione definitiva non c'è ancora, quindi al suo posto c'è un
 * segnaposto. Quando arriva, basta mettere il file in `public/home/` e
 * sostituire il blocco marcato "segnaposto" con:
 *
 *   <Image src="/home/artwork.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
 *
 * (il resto — altezza, logo, sfumatura — resta com'è).
 */
export function HomeArtwork() {
  return (
    <div className="relative h-[46svh] min-h-[280px] w-full overflow-hidden bg-[#272727] sm:h-[52svh]">
      {/* segnaposto: via quando arriva l'immagine */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#2f2f2f_0px,#2f2f2f_14px,#272727_14px,#272727_28px)]"
      >
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
          Immagine segnaposto
        </span>
      </div>

      {/* Sfumatura in basso: stacca l'artwork dal fondo chiaro della pagina. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/40"
      />

      <Logo
        iconOnly={false}
        className="absolute left-1/2 top-8 h-5 w-auto -translate-x-1/2 text-white sm:top-10 sm:h-6"
      />
    </div>
  );
}
