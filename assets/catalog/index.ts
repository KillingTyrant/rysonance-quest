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
import armi_a_distanza from "./talenti/armi-a-distanza.svg";
import armi_corpo_a_corpo from "./talenti/armi-corpo-a-corpo.svg";
import magia_ancestrale from "./talenti/magia-ancestrale.svg";
import magia_bianca from "./talenti/magia-bianca.svg";
import magia_elementale from "./talenti/magia-elementale.svg";

/**
 * Illustrazioni del catalogo, per chiave del DB. Import statici e non `public/`:
 * l'URL porta l'hash del contenuto, quindi la cache è `immutable` e si invalida da
 * sola quando l'arte cambia.
 *
 * Le razze vengono dal servizio Wallet (`pkpass-smanetting/assets/catalog/razze`),
 * dove `felidi.jpg` è l'arte dei Gata-Ari e `canidi.jpg` quella degli Ulu-Ari: qui i
 * file hanno il nome della chiave. Tribù e vie non hanno ancora illustrazioni.
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
  talenti: Record<string, StaticImageData | undefined>;
} = {
  razze: { elfi, gata_ari, nani, orchi, ulu_ari, umani },
  // Le chiavi dei talenti hanno il trattino: qui vanno scritte fra virgolette.
  talenti: {
    "magia-elementale": magia_elementale,
    "magia-ancestrale": magia_ancestrale,
    "magia-bianca": magia_bianca,
    "armi-a-distanza": armi_a_distanza,
    "armi-corpo-a-corpo": armi_corpo_a_corpo,
  },
};
