import type { StaticImageData } from "next/image";
import type { Catalog } from "@/lib/onboarding/types";

// Razze
import umani from "./razze/umani.jpg";
import nani from "./razze/Nani.jpg";
import orchi from "./razze/orchi.jpg";
import elfi from "./razze/Elfi.jpg";
import ulu_ari from "./razze/Canidi.jpg";
import gata_ari from "./razze/Felidi.jpg";

// Tribù
import dramput from "./tribu/dramput.png";
import elehil from "./tribu/elehil.png";
import eruscal from "./tribu/eruscal.png";
import kajan from "./tribu/kajan.png";
import kodron from "./tribu/kodron.png";
import lurven from "./tribu/lurven.png";
import nandrein from "./tribu/nandrein.png";
import oncalynx from "./tribu/oncalynx.png";
import ruul from "./tribu/ruul.png";
import selvas from "./tribu/selvas.png";
import shakul from "./tribu/shakul.png";
import turuf from "./tribu/turuf.png";

export type CatalogImageKind = "razze" | "tribu" | "vie";

/**
 * Mappa statica delle illustrazioni di catalogo.
 * L'import statico tramite modulo garantisce l'header `immutable` sulla CDN 
 * e la generazione a build-time del blurDataURL per next/image.
 */
export const CATALOG_IMAGES: Record<
  CatalogImageKind,
  Record<string, StaticImageData | undefined>
> = {
  razze: { umani, nani, orchi, elfi, ulu_ari, gata_ari },
  tribu: {
    dramput,
    elehil,
    eruscal,
    kajan,
    kodron,
    lurven,
    nandrein,
    oncalynx,
    ruul,
    selvas,
    shakul,
    turuf,
  },
  vie: {},
};

/**
 * Verifica l'allineamento tra il DB e gli asset statici.
 * Solleva errore a build-time se il catalogo richiede un'illustrazione non mappata.
 */
export function missingCatalogImages(catalog: Catalog): string[] {
  const missing: string[] = [];
  const check = (kind: CatalogImageKind, key: string) => {
    if (!CATALOG_IMAGES[kind][key]) missing.push(`${kind}/${key}`);
  };
  
  for (const razza of catalog.razze) {
    check("razze", razza.key);
    for (const tribu of razza.tribu) check("tribu", tribu.key);
  }
  for (const via of catalog.vie) check("vie", via.key);
  
  return missing;
}