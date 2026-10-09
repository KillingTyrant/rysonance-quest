import { cn } from "@/lib/utils";

/**
 * Le misure dell'esagono, in unità del `viewBox` (100 = larghezza): le usa anche
 * `carta-immagine.ts`, che lo ridisegna sul canvas dell'immagine condivisa.
 */
export const ESAGONO_ALTEZZA = 111.1;
export const ESAGONO_PUNTI = "50,14 86,34.8 86,76.4 50,97.1 14,76.4 14,34.8";
/** Tratto che arrotonda i vertici: metà sporge fuori dal poligono, che è rientrato di 14. */
export const ESAGONO_TRATTO = 28;
/** Spessore del bordo bianco. */
export const ESAGONO_BORDO = 2;

/**
 * L'esagono a punta in alto dietro al numero della quest, largo quanto il testo che
 * contiene (misure in `em`, così cresce con il numero). Il poligono è rientrato di
 * metà tratto e il tratto, con `linejoin` tondo, ne ridisegna i vertici come
 * raccordi: angoli arrotondati senza scrivere gli archi a mano.
 *
 * Con `bordo` sotto c'è un secondo esagono bianco della stessa forma e quello colorato
 * ha il tratto più sottile, così il bordo sta dentro la sagoma e l'ingombro non cambia.
 *
 * `colore` sostituisce il blu notte di `--numero` (la card lo dà nel colore della razza);
 * se manca resta `--numero`.
 */
export function Esagono({
  className,
  bordo = false,
  colore,
}: {
  className?: string;
  bordo?: boolean;
  colore?: string;
}) {
  return (
    <svg
      viewBox={`0 0 100 ${ESAGONO_ALTEZZA}`}
      style={{ color: colore }}
      className={cn("h-auto w-[1.94em] overflow-visible text-numero", className)}
      aria-hidden
    >
      {bordo && (
        <polygon
          points={ESAGONO_PUNTI}
          fill="white"
          stroke="white"
          strokeWidth={ESAGONO_TRATTO}
          strokeLinejoin="round"
        />
      )}
      <polygon
        points={ESAGONO_PUNTI}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={bordo ? ESAGONO_TRATTO - 2 * ESAGONO_BORDO : ESAGONO_TRATTO}
        strokeLinejoin="round"
      />
    </svg>
  );
}
