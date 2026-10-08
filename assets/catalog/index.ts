import type { StaticImageData } from "next/image";

// Import relativi e non con l'alias `@/`: la dichiarazione `declare module "*.jpg"` di
// `next/image-types/global` è un match sullo specificatore, e con `paths` TypeScript
// prova prima a risolvere il file davvero.
import elfi from "./razze/elfi.jpg";
import gata_ari from "./razze/gata_ari.jpg";
import nani from "./razze/nani.jpg";
import orchi from "./razze/orchi.jpg";
import ulu_ari from "./razze/ulu_ari.jpg";
import umani from "./razze/umani.jpg";
import elfi_icon from "./razze/elfi_icon.png";
import gata_ari_icon from "./razze/gata_ari_icon.png";
import nani_icon from "./razze/nani_icon.png";
import orchi_icon from "./razze/orchi_icon.png";
import ulu_ari_icon from "./razze/ulu_ari_icon.png";
import umani_icon from "./razze/umani_icon.png";
import elfi_bg from "./razze/elfi_bg.svg";
import gata_ari_bg from "./razze/gata_ari_bg.svg";
import nani_bg from "./razze/nani_bg.svg";
import orchi_bg from "./razze/orchi_bg.svg";
import ulu_ari_bg from "./razze/ulu_ari_bg.svg";
import umani_bg from "./razze/umani_bg.svg";
import armi_a_distanza from "./talenti/armi-a-distanza.jpg";
import armi_corpo_a_corpo from "./talenti/armi-corpo-a-corpo.jpg";
import magia_ancestrale from "./talenti/magia-ancestrale.jpg";
import magia_bianca from "./talenti/magia-bianca.jpg";
import magia_elementale from "./talenti/magia-elementale.jpg";
import armi_a_distanza_icon from "./talenti/armi-a-distanza_icon.png";
import armi_corpo_a_corpo_icon from "./talenti/armi-corpo-a-corpo_icon.png";
import magia_ancestrale_icon from "./talenti/magia-ancestrale_icon.png";
import magia_bianca_icon from "./talenti/magia-bianca_icon.png";
import magia_elementale_icon from "./talenti/magia-elementale_icon.png";
import combattente_icon from "./vie/combattente_icon.png";
import sapiente_icon from "./vie/sapiente_icon.png";
import viandante_icon from "./vie/viandante_icon.png";
import combattente_bg from "./vie/combattente_bg.svg";
import sapiente_bg from "./vie/sapiente_bg.svg";
import viandante_bg from "./vie/viandante_bg.svg";

/**
 * Illustrazioni del catalogo, per chiave del DB. Import statici e non `public/`:
 * l'URL porta l'hash del contenuto, quindi la cache è `immutable` e si invalida da
 * sola quando l'arte cambia.
 *
 * Le razze vengono dal servizio Wallet (`pkpass-smanetting/assets/catalog/razze`),
 * dove `felidi.jpg` è l'arte dei Gata-Ari e `canidi.jpg` quella degli Ulu-Ari: qui i
 * file hanno il nome della chiave. Tribù e vie non hanno ancora illustrazioni.
 *
 * Razze, vie e talenti hanno anche un'icona quadrata (60×56; quelle dei talenti a 3×,
 * 179×166), mostrata nel riepilogo della hub quando sono scelti, con il nome
 * `<chiave>_icon` come le altre.
 *
 * Razze e vie hanno poi un emblema SVG monocromo (`<chiave>_bg.svg`), la sagoma che
 * riempie il sigillo sul fondo della hub: conta solo la forma, il colore lo decide chi
 * lo disegna (vedi `components/onboarding/sigillo-eroe.tsx`).
 *
 * I talenti a scelta hanno l'arte definitiva (2114×1920), con il nome della chiave:
 * `armi-corpo-a-corpo.jpg` è l'arte consegnata come "Armi da Mischia". La card le
 * ritaglia con `object-cover`, quindi il formato non deve seguire quello della card.
 *
 * Indice a stringa e non union di chiavi: le chiavi vivono nel seed del DB, e una
 * chiave senza arte deve dare `undefined`, non un errore di tipo.
 */
export const CATALOG_IMAGES: {
  razze: Record<string, StaticImageData | undefined>;
  razzeIcone: Record<string, StaticImageData | undefined>;
  vieIcone: Record<string, StaticImageData | undefined>;
  razzeEmblemi: Record<string, StaticImageData | undefined>;
  vieEmblemi: Record<string, StaticImageData | undefined>;
  talenti: Record<string, StaticImageData | undefined>;
  talentiIcone: Record<string, StaticImageData | undefined>;
} = {
  razze: { elfi, gata_ari, nani, orchi, ulu_ari, umani },
  razzeIcone: {
    elfi: elfi_icon,
    gata_ari: gata_ari_icon,
    nani: nani_icon,
    orchi: orchi_icon,
    ulu_ari: ulu_ari_icon,
    umani: umani_icon,
  },
  vieIcone: {
    combattente: combattente_icon,
    sapiente: sapiente_icon,
    viandante: viandante_icon,
  },
  razzeEmblemi: {
    elfi: elfi_bg,
    gata_ari: gata_ari_bg,
    nani: nani_bg,
    orchi: orchi_bg,
    ulu_ari: ulu_ari_bg,
    umani: umani_bg,
  },
  vieEmblemi: {
    combattente: combattente_bg,
    sapiente: sapiente_bg,
    viandante: viandante_bg,
  },
  // Le chiavi dei talenti hanno il trattino: qui vanno scritte fra virgolette.
  talenti: {
    "magia-elementale": magia_elementale,
    "magia-ancestrale": magia_ancestrale,
    "magia-bianca": magia_bianca,
    "armi-a-distanza": armi_a_distanza,
    "armi-corpo-a-corpo": armi_corpo_a_corpo,
  },
  talentiIcone: {
    "magia-elementale": magia_elementale_icon,
    "magia-ancestrale": magia_ancestrale_icon,
    "magia-bianca": magia_bianca_icon,
    "armi-a-distanza": armi_a_distanza_icon,
    "armi-corpo-a-corpo": armi_corpo_a_corpo_icon,
  },
};
