import { useEffect, useRef } from "react";

/**
 * Porta al centro dello schermo la card di scelta appena aperta da un tocco:
 * è il comportamento comune alle card di razza e talento. Rientrando nello
 * step con la card già aperta la pagina resta in cima, dove la porta il
 * wizard, perché si centra solo la card aperta dopo `segnaTocco`.
 *
 * La card che riceve `ref` deve avere `scroll-mt-nav`: così è centrata nello
 * spazio sotto la nav sticky, non nell'intera finestra, dove la nav ne
 * coprirebbe la cima.
 */
export function useCentraAllaApertura<T extends HTMLElement>(selected: boolean) {
  const ref = useRef<T>(null);
  const centraAllaApertura = useRef(false);

  useEffect(() => {
    if (!selected || !centraAllaApertura.current) return;
    centraAllaApertura.current = false;
    const movimento = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    ref.current?.scrollIntoView({ block: "center", behavior: movimento ? "smooth" : "auto" });
  }, [selected]);

  /** Da chiamare nel click, prima di `onSelect`: centra la card se il tocco la apre. */
  function segnaTocco() {
    centraAllaApertura.current = !selected;
  }

  return { ref, segnaTocco };
}
