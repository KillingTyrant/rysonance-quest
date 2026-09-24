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
import armi_a_distanza from "./talenti/armi-a-distanza.svg";
import armi_corpo_a_corpo from "./talenti/armi-corpo-a-corpo.svg";
import magia_ancestrale from "./talenti/magia-ancestrale.svg";
import magia_bianca from "./talenti/magia-bianca.svg";
import magia_elementale from "./talenti/magia-elementale.svg";
import combattente_icon from "./vie/combattente_icon.png";
import sapiente_icon from "./vie/sapiente_icon.png";
import viandante_icon from "./vie/viandante_icon.png";

/**
 * Illustrazioni del catalogo, per chiave del DB. Import statici e non `public/`:
 * l'URL porta l'hash del contenuto, quindi la cache è `immutable` e si invalida da
 * sola quando l'arte cambia.
 *
 * Le razze vengono dal servizio Wallet (`pkpass-smanetting/assets/catalog/razze`),
 * dove `felidi.jpg` è l'arte dei Gata-Ari e `canidi.jpg` quella degli Ulu-Ari: qui i
 * file hanno il nome della chiave. Tribù e vie non hanno ancora illustrazioni.
 *
 * Razze e vie hanno anche un'icona quadrata (60×56), mostrata nel riepilogo della hub
 * quando sono scelte, con il nome della chiave come le altre.
 *
 * I talenti a scelta hanno per ora illustrazioni SVG segnaposto, disegnate a mano
 * (640×360). Per sostituirle con l'arte definitiva basta cambiare l'import: la card
 * le ritaglia con `object-cover`, quindi va bene qualunque formato ~16:9.
 *
 * Indice a stringa e non union di chiavi: le chiavi vivono nel seed del DB, e una
 * chiave senza arte deve dare `undefined`, non un errore di tipo.
 */
export const CATALOG_IMAGES: {
  razze: Record<string, StaticImageData | undefined>;
  razzeIcone: Record<string, StaticImageData | undefined>;
  vieIcone: Record<string, StaticImageData | undefined>;
  talenti: Record<string, StaticImageData | undefined>;
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
  // Le chiavi dei talenti hanno il trattino: qui vanno scritte fra virgolette.
  talenti: {
    "magia-elementale": magia_elementale,
    "magia-ancestrale": magia_ancestrale,
    "magia-bianca": magia_bianca,
    "armi-a-distanza": armi_a_distanza,
    "armi-corpo-a-corpo": armi_corpo_a_corpo,
  },
};
