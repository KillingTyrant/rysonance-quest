import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getServerSnapshot = () => false;

/**
 * La preferenza "riduci movimento" del sistema, aggiornata se cambia a pagina
 * aperta. Sul server e durante l'idratazione vale `false`, così il markup
 * iniziale coincide: chi decide qualcosa al mount deve rileggerla dopo.
 *
 * Per le animazioni GSAP non serve: lì si usa `gsap.matchMedia`, che annulla
 * e rifà le animazioni da solo quando la preferenza cambia.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
