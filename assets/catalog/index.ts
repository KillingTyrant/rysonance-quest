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

/**
 * Illustrazioni del catalogo, per chiave del DB. Import statici e non `public/`:
 * l'URL porta l'hash del contenuto, quindi la cache è `immutable` e si invalida da
 * sola quando l'arte cambia.
 *
 * Le razze vengono dal servizio Wallet (`pkpass-smanetting/assets/catalog/razze`),
 * dove `felidi.jpg` è l'arte dei Gata-Ari e `canidi.jpg` quella degli Ulu-Ari: qui i
 * file hanno il nome della chiave. Tribù e vie non hanno ancora illustrazioni.
 *
 * Indice a stringa e non union di chiavi: le chiavi vivono nel seed del DB, e una
 * chiave senza arte deve dare `undefined`, non un errore di tipo.
 */
export const CATALOG_IMAGES: {
  razze: Record<string, StaticImageData | undefined>;
} = {
  razze: { elfi, gata_ari, nani, orchi, ulu_ari, umani },
};
