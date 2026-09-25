import type { QuestCarta } from "@/lib/quest/types";

import { coverCrop, fitFontSize } from "./share";

/** Formato delle storie (9:16): la card è alta come lo schermo del telefono. */
const LARGHEZZA = 1080;
const ALTEZZA = 1920;
const MARGINE = 88;

function caricaImmagine(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  return image.decode().then(() => image);
}

/**
 * Il logo come immagine: si serializza l'SVG già presente nella pagina, bianco e
 * con dimensioni esplicite (senza, Firefox non lo rasterizza).
 */
function caricaLogo(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const [, , width, height] = (clone.getAttribute("viewBox") ?? "0 0 1 1")
    .split(/\s+/)
    .map(Number);
  clone.setAttribute("width", String(width * 10));
  clone.setAttribute("height", String(height * 10));
  clone.setAttribute("fill", "#ffffff");
  clone.removeAttribute("class");
  const xml = new XMLSerializer().serializeToString(clone);
  return caricaImmagine(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`);
}

function velo(
  context: CanvasRenderingContext2D,
  from: number,
  to: number,
  alphaFrom: number,
  alphaTo: number,
) {
  const gradient = context.createLinearGradient(0, from, 0, to);
  gradient.addColorStop(0, `rgba(0, 0, 0, ${alphaFrom})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${alphaTo})`);
  context.fillStyle = gradient;
  context.fillRect(0, from, LARGHEZZA, to - from);
}

type ImmagineCartaOptions = {
  carta: QuestCarta;
  /** URL della stessa origine (il canvas altrimenti si "sporca" e non esporta). */
  illustrazione: string | null;
  /** La `font-family` di Sprat (`--font-sprat`): il canvas usa lo stesso font della card. */
  fontFamily: string;
  logo: SVGSVGElement | null;
};

/**
 * Disegna la card del personaggio in un PNG da condividere. Lo fa il browser e non
 * il server: così usa Sprat Condensed, che la pagina ha già caricato, invece del
 * font di ripiego del generatore di immagini lato server.
 */
export async function creaImmagineCarta({
  carta,
  illustrazione,
  fontFamily,
  logo,
}: ImmagineCartaOptions): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = LARGHEZZA;
  canvas.height = ALTEZZA;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D non disponibile");

  await Promise.all([
    document.fonts.load(`400 200px ${fontFamily}`),
    document.fonts.load(`400 60px ${fontFamily}`),
  ]);

  context.fillStyle = "#57534e";
  context.fillRect(0, 0, LARGHEZZA, ALTEZZA);

  if (illustrazione) {
    const image = await caricaImmagine(illustrazione);
    const crop = coverCrop(image.naturalWidth, image.naturalHeight, LARGHEZZA, ALTEZZA);
    context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, LARGHEZZA, ALTEZZA);
  }

  // Veli scuri in alto e in basso: il testo bianco resta leggibile su qualunque arte.
  velo(context, 0, ALTEZZA * 0.5, 0.72, 0);
  velo(context, ALTEZZA * 0.6, ALTEZZA, 0, 0.82);

  context.fillStyle = "#ffffff";
  context.textBaseline = "alphabetic";

  const nome = carta.nome.toUpperCase();
  const larghezzaUtile = LARGHEZZA - MARGINE * 2;
  const nomeSize = fitFontSize(
    (size) => {
      context.font = `400 ${size}px ${fontFamily}`;
      return context.measureText(nome).width;
    },
    larghezzaUtile,
    260,
    96,
  );
  context.font = `400 ${nomeSize}px ${fontFamily}`;
  context.textAlign = "center";
  let y = MARGINE + nomeSize * 0.8;
  context.fillText(nome, LARGHEZZA / 2, y, larghezzaUtile);

  context.textAlign = "left";
  y += 110;
  if (carta.razza) {
    context.font = `400 76px ${fontFamily}`;
    context.fillText(carta.razza, MARGINE, y, larghezzaUtile);
    y += 96;
  }

  if (logo) {
    const image = await caricaLogo(logo);
    const width = 420;
    const height = (width * image.naturalHeight) / image.naturalWidth;
    context.drawImage(image, (LARGHEZZA - width) / 2, ALTEZZA - MARGINE - height, width, height);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Esportazione del PNG fallita"))),
      "image/png",
    ),
  );
}
