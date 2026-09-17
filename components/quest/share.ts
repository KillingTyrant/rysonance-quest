/**
 * Calcoli dell'immagine condivisa e della condivisione, senza DOM: il disegno vero
 * sta in `carta-immagine.ts`, qui restano le decisioni verificabili in Node.
 */

export type Ritaglio = { sx: number; sy: number; sw: number; sh: number };

/**
 * La porzione centrale della sorgente che riempie la destinazione senza deformarla,
 * come `object-fit: cover`. Da passare a `drawImage(img, sx, sy, sw, sh, 0, 0, w, h)`.
 */
export function coverCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): Ritaglio {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const sw = targetWidth / scale;
  const sh = targetHeight / scale;
  return { sx: (sourceWidth - sw) / 2, sy: (sourceHeight - sh) / 2, sw, sh };
}

/**
 * La dimensione di font più grande, fra `minSize` e `maxSize`, con cui il testo sta
 * in `maxWidth`. `measure` restituisce la larghezza del testo a una data dimensione:
 * sul canvas cresce in modo lineare, quindi basta misurare una volta.
 */
export function fitFontSize(
  measure: (size: number) => number,
  maxWidth: number,
  maxSize: number,
  minSize: number,
): number {
  const width = measure(maxSize);
  if (width <= maxWidth) return maxSize;
  return Math.max(minSize, Math.floor((maxSize * maxWidth) / width));
}

/** "Kòren il Rosso" → "koren-il-rosso-rysonance.png". */
export function nomeFileCarta(nome: string): string {
  const slug = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "eroe"}-rysonance.png`;
}

type NavigatorCondivisione = {
  share?: unknown;
  canShare?: (data: ShareData) => boolean;
};

/**
 * Condivisione nativa del file dove il browser la supporta (telefoni, Safari, Chrome
 * su Windows e ChromeOS); altrimenti l'immagine si scarica.
 */
export function modoCondivisione(
  nav: NavigatorCondivisione | undefined,
  data: ShareData,
): "file" | "download" {
  if (nav && typeof nav.share === "function" && nav.canShare?.(data)) return "file";
  return "download";
}
