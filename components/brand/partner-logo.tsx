/**
 * Logo di Prince Doji, il partner della quest.
 *
 * ⚠️ Segnaposto: corona e lettering disegnati qui, in attesa dell'SVG ufficiale.
 * Quando arriva va sostituito il contenuto dell'`<svg>`, tenendo `fill` a
 * `currentColor` (così segue il colore del testo e il tema scuro) e l'`aria-label`.
 */
export function PartnerLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 64"
      fill="currentColor"
      role="img"
      aria-label="Prince Doji"
      className={className}
    >
      <path d="M40 38 37 12l12 11 11-17 11 17 12-11-3 26Z" />
      <rect x="40" y="40.5" width="40" height="4" rx="1" />
      <circle cx="37" cy="10" r="2.6" />
      <circle cx="60" cy="4.5" r="2.6" />
      <circle cx="83" cy="10" r="2.6" />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="800"
        letterSpacing="2.4"
      >
        PRINCE DOJI
      </text>
    </svg>
  );
}
