/** Dove si va dopo il login quando nessuno chiede altro. */
export const DEFAULT_NEXT = "/onboarding";

/**
 * Il `?next=` di una pagina di auth, ammesso solo se è un path di questo sito:
 * così un link manipolato non diventa un open redirect. `//host` e `/\host`
 * sono esclusi perché il browser li legge come URL di un altro dominio.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_NEXT,
): string {
  if (!value || !value.startsWith("/")) return fallback;
  if (value[1] === "/" || value[1] === "\\") return fallback;
  return value;
}

/**
 * Il `?next=` dell'URL corrente, letto al momento del click e non al render:
 * le form di auth sono prerenderizzate e non vedono la query string.
 */
export function nextFromLocation(): string {
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}
