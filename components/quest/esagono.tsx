import { cn } from "@/lib/utils";

const PUNTI = "50,14 86,34.8 86,76.4 50,97.1 14,76.4 14,34.8";
/** Tratto che arrotonda i vertici: metà sporge fuori dal poligono, che è rientrato di 14. */
const TRATTO = 28;
/** Spessore del bordo bianco, in unità del `viewBox` (100 = larghezza dell'esagono). */
const BORDO = 2;

/**
 * L'esagono a punta in alto dietro al numero della quest, largo quanto il testo che
 * contiene (misure in `em`, così cresce con il numero). Il poligono è rientrato di
 * metà tratto e il tratto, con `linejoin` tondo, ne ridisegna i vertici come
 * raccordi: angoli arrotondati senza scrivere gli archi a mano.
 *
 * Con `bordo` sotto c'è un secondo esagono bianco della stessa forma e quello colorato
 * ha il tratto più sottile, così il bordo sta dentro la sagoma e l'ingombro non cambia.
 */
export function Esagono({ className, bordo = false }: { className?: string; bordo?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 111.1"
      className={cn("h-auto w-[1.94em] overflow-visible text-numero", className)}
      aria-hidden
    >
      {bordo && (
        <polygon
          points={PUNTI}
          fill="white"
          stroke="white"
          strokeWidth={TRATTO}
          strokeLinejoin="round"
        />
      )}
      <polygon
        points={PUNTI}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={bordo ? TRATTO - 2 * BORDO : TRATTO}
        strokeLinejoin="round"
      />
    </svg>
  );
}
