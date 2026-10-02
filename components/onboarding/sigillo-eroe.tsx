import { useId } from "react";

import { CATALOG_IMAGES } from "@/assets/catalog";
import { cn } from "@/lib/utils";

/*
 * Le misure del mockup, in px: il sigillo si disegna 1:1 con il centro
 * nell'origine, quindi ogni valore è una distanza dal centro.
 */
/** Il disco: l'emblema della razza o, finché non c'è, il segnaposto pieno. */
const R_DISCO = 109;
/** L'anello sottile con i tre rombi. */
const R_ANELLO_INTERNO = 124.5;
/** L'anello spesso: la via spunta solo da qui in fuori. */
const R_ANELLO_SPESSO = 137.5;
const SPESSORE_ANELLO_SPESSO = 5;
/** L'anello a filo con i sei puntini. */
const R_ANELLO_ESTERNO = 152.5;
/** Il riquadro di ciascuna copia della via e quanto lontano dal centro arriva la punta. */
const VIA_LATO = 100;
const VIA_PUNTA = 166;
/** Metà del lato del disegno: quanto basta a contenere la punta della via. */
const MEZZO = 167;
const LATO = MEZZO * 2;

/** Angoli in gradi, in senso orario dalle ore 12. */
const ROMBI = [0, 120, 240];
const PUNTINI = [30, 90, 150, 210, 270, 330];

/**
 * Il sigillo dietro alle righe della hub, che si riempie con le scelte: senza
 * razza il disco è pieno, con la razza diventa il suo emblema; con la via, due
 * copie dell'emblema della via stanno dietro al sigillo (quella in alto
 * capovolta) e ne spunta solo la coda, sopra l'anello spesso.
 *
 * Gli SVG del catalogo sono neri: qui fanno da maschera (`mask-type: alpha`) a
 * un riempimento in `currentColor`, così il colore lo decide la classe e non il
 * file. Tutto è dello stesso grigio, come nel mockup.
 */
export function SigilloEroe({
  razzaKey,
  viaKey,
  className,
}: {
  razzaKey: string | null;
  viaKey: string | null;
  className?: string;
}) {
  // Gli id delle maschere devono essere unici nella pagina.
  const id = useId();
  const razza = razzaKey ? CATALOG_IMAGES.razzeEmblemi[razzaKey] : undefined;
  const via = viaKey ? CATALOG_IMAGES.vieEmblemi[viaKey] : undefined;

  const area = { x: -MEZZO, y: -MEZZO, width: LATO, height: LATO };

  return (
    <svg
      aria-hidden
      viewBox={`${-MEZZO} ${-MEZZO} ${LATO} ${LATO}`}
      width={LATO}
      height={LATO}
      fill="currentColor"
      className={cn("text-[#E2E2E2]", className)}
    >
      <defs>
        {via && (
          <>
            <mask id={`${id}-via`} maskUnits="userSpaceOnUse" {...area} style={{ maskType: "alpha" }}>
              {[0, 180].map((angolo) => (
                <image
                  key={angolo}
                  href={via.src}
                  x={-VIA_LATO / 2}
                  y={VIA_PUNTA - VIA_LATO}
                  width={VIA_LATO}
                  height={VIA_LATO}
                  // La coda dell'emblema tocca il bordo del riquadro, qualunque sia la via.
                  preserveAspectRatio="xMidYMax meet"
                  transform={`rotate(${angolo})`}
                />
              ))}
            </mask>
            {/* Nasconde la via dentro l'anello spesso: fra gli anelli resta il fondo. */}
            <mask id={`${id}-foro`} maskUnits="userSpaceOnUse" {...area}>
              <rect {...area} fill="white" />
              <circle r={R_ANELLO_SPESSO + SPESSORE_ANELLO_SPESSO / 2} fill="black" />
            </mask>
          </>
        )}
        {razza && (
          <mask id={`${id}-razza`} maskUnits="userSpaceOnUse" {...area} style={{ maskType: "alpha" }}>
            <image
              href={razza.src}
              x={-R_DISCO}
              y={-R_DISCO}
              width={R_DISCO * 2}
              height={R_DISCO * 2}
            />
          </mask>
        )}
      </defs>

      {via && (
        <g mask={`url(#${id}-foro)`}>
          <rect {...area} mask={`url(#${id}-via)`} />
        </g>
      )}

      <g fill="none" stroke="currentColor">
        <circle r={R_ANELLO_INTERNO} strokeWidth={3} />
        <circle r={R_ANELLO_SPESSO} strokeWidth={SPESSORE_ANELLO_SPESSO} />
        <circle r={R_ANELLO_ESTERNO} strokeWidth={1.5} />
      </g>
      {ROMBI.map((angolo) => (
        <path
          key={angolo}
          d="M0 -6.5L6.5 0L0 6.5L-6.5 0Z"
          transform={`rotate(${angolo}) translate(0 ${-R_ANELLO_INTERNO})`}
        />
      ))}
      {PUNTINI.map((angolo) => (
        <circle key={angolo} r={3} cy={-R_ANELLO_ESTERNO} transform={`rotate(${angolo})`} />
      ))}

      {razza ? (
        <rect
          x={-R_DISCO}
          y={-R_DISCO}
          width={R_DISCO * 2}
          height={R_DISCO * 2}
          mask={`url(#${id}-razza)`}
        />
      ) : (
        <circle r={R_DISCO} />
      )}
    </svg>
  );
}
