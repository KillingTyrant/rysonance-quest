import type { QuestCarta } from "@/lib/quest/types";

import { QUEST_COPY } from "./copy";
import { ESAGONO_ALTEZZA, ESAGONO_BORDO, ESAGONO_PUNTI, ESAGONO_TRATTO } from "./esagono";
import { coverCrop, fitFontSize } from "./share";

/** Formato delle storie (9:16): la card è alta come lo schermo del telefono. */
const LARGHEZZA = 1080;
const ALTEZZA = 1920;
const MARGINE = 88;

/** Una riga sotto il nome: etichetta piccola in Cabinet, valore in Sprat. */
const ETICHETTA_SIZE = 30;
const VALORE_SIZE = 72;
const RIGA_VALORE = 80;
const RIGA_SPAZIO = 40;

/** L'esagono del numero, in alto a destra accanto alle righe. */
const ESAGONO_LARGHEZZA = 220;
const ESAGONO_ALTEZZA_PX = (ESAGONO_LARGHEZZA * ESAGONO_ALTEZZA) / 100;
/** Il blu notte di `--numero` nel tema chiaro (#1C1C31): l'immagine non ha un tema. */
const COLORE_NUMERO = "#1c1c31";

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

/**
 * L'esagono con il bordo bianco e il numero al centro, come `<Esagono bordo />` sulla
 * card. `x` e `y` sono l'angolo in alto a sinistra del suo riquadro.
 */
function esagonoNumero(
  context: CanvasRenderingContext2D,
  numero: number,
  x: number,
  y: number,
  fontSans: string,
) {
  const scala = ESAGONO_LARGHEZZA / 100;
  const sagoma = new Path2D(`M${ESAGONO_PUNTI}Z`);

  context.save();
  context.translate(x, y);
  context.scale(scala, scala);
  context.lineJoin = "round";
  context.fillStyle = context.strokeStyle = "#ffffff";
  context.lineWidth = ESAGONO_TRATTO;
  context.fill(sagoma);
  context.stroke(sagoma);
  context.fillStyle = context.strokeStyle = COLORE_NUMERO;
  context.lineWidth = ESAGONO_TRATTO - 2 * ESAGONO_BORDO;
  context.fill(sagoma);
  context.stroke(sagoma);
  context.restore();

  // Sulla card l'esagono è largo 1,94em: lo stesso rapporto fra numero ed esagono.
  const testo = String(numero);
  context.font = `800 ${ESAGONO_LARGHEZZA / 1.94}px ${fontSans}`;
  context.textAlign = "center";
  context.fillStyle = "#ffffff";
  // Centrato sulle cifre vere, non sulla scatola del font.
  const misura = context.measureText(testo);
  const centroY = y + ESAGONO_ALTEZZA_PX / 2;
  context.fillText(
    testo,
    x + ESAGONO_LARGHEZZA / 2,
    centroY + (misura.actualBoundingBoxAscent - misura.actualBoundingBoxDescent) / 2,
  );
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
  /** Il numero estratto nella quest, nell'esagono; `null` se il dado non è ancora stato lanciato. */
  numero: number | null;
  /** La `font-family` di Sprat (`--font-sprat`): il canvas usa lo stesso font della card. */
  fontFamily: string;
  /** La `font-family` di Cabinet Grotesk (`--font-cabinet`): etichette e numero. */
  fontSans: string;
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
  numero,
  fontFamily,
  fontSans,
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
    document.fonts.load(`600 ${ETICHETTA_SIZE}px ${fontSans}`),
    document.fonts.load(`800 100px ${fontSans}`),
  ]);

  context.fillStyle = "#57534e";
  context.fillRect(0, 0, LARGHEZZA, ALTEZZA);

  if (illustrazione) {
    const image = await caricaImmagine(illustrazione);
    const crop = coverCrop(image.naturalWidth, image.naturalHeight, LARGHEZZA, ALTEZZA);
    context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, LARGHEZZA, ALTEZZA);
  }

  // Le misure del nome servono prima di disegnare: il velo in alto scende fin sotto
  // l'ultima riga di testo.
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
  const nomeY = MARGINE + nomeSize * 0.8;

  const { etichette } = QUEST_COPY.carta;
  const righe = [
    { etichetta: etichette.razza, valore: carta.razza },
    { etichetta: etichette.via, valore: carta.via },
    { etichetta: etichette.talento, valore: carta.talento },
  ].flatMap(({ etichetta, valore }) => (valore ? [{ etichetta, valore }] : []));
  const altezzaRiga = ETICHETTA_SIZE + RIGA_VALORE + RIGA_SPAZIO;
  const bloccoY = nomeY + 90;
  const fineTesto = Math.max(
    bloccoY + righe.length * altezzaRiga - RIGA_SPAZIO,
    numero !== null ? bloccoY + ESAGONO_ALTEZZA_PX : 0,
  );

  // Veli scuri in alto e in basso: il testo bianco resta leggibile su qualunque arte.
  velo(context, 0, fineTesto, 0.72, 0.5);
  velo(context, fineTesto, fineTesto + 320, 0.5, 0);
  velo(context, ALTEZZA * 0.6, ALTEZZA, 0, 0.82);

  context.fillStyle = "#ffffff";
  context.textBaseline = "alphabetic";

  context.font = `400 ${nomeSize}px ${fontFamily}`;
  context.textAlign = "center";
  context.fillText(nome, LARGHEZZA / 2, nomeY, larghezzaUtile);

  // Razza, via e talento a sinistra; il numero, se c'è, a destra accanto a loro.
  const larghezzaRighe =
    numero !== null ? larghezzaUtile - ESAGONO_LARGHEZZA - 48 : larghezzaUtile;
  context.textAlign = "left";
  let y = bloccoY;
  for (const { etichetta, valore } of righe) {
    context.font = `600 ${ETICHETTA_SIZE}px ${fontSans}`;
    context.fillStyle = "rgba(255, 255, 255, 0.75)";
    context.fillText(etichetta.toUpperCase(), MARGINE, y + ETICHETTA_SIZE, larghezzaRighe);
    context.font = `400 ${VALORE_SIZE}px ${fontFamily}`;
    context.fillStyle = "#ffffff";
    context.fillText(valore, MARGINE, y + ETICHETTA_SIZE + RIGA_VALORE, larghezzaRighe);
    y += altezzaRiga;
  }

  if (numero !== null) {
    esagonoNumero(context, numero, LARGHEZZA - MARGINE - ESAGONO_LARGHEZZA, bloccoY, fontSans);
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
