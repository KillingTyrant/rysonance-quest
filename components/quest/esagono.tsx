import { cn } from "@/lib/utils";

/**
 * L'esagono a punta in alto dietro al numero della quest, largo quanto il testo che
 * contiene (misure in `em`, così cresce con il numero). Il poligono è rientrato di
 * metà tratto e il tratto, con `linejoin` tondo, ne ridisegna i vertici come
 * raccordi: angoli arrotondati senza scrivere gli archi a mano.
 */
export function Esagono({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 111.1"
      className={cn("h-auto w-[1.94em] overflow-visible text-numero", className)}
      aria-hidden
    >
      <polygon
        points="50,14 86,34.8 86,76.4 50,97.1 14,76.4 14,34.8"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="28"
        strokeLinejoin="round"
      />
    </svg>
  );
}
