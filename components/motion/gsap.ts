import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { SplitText } from "gsap/SplitText";

/**
 * GSAP con i plugin dell'app, registrati una volta sola. Va importato da qui e
 * non da "gsap" direttamente, così nessun componente usa un plugin non
 * registrato.
 *
 * Importarlo durante il prerender non rompe nulla: finché non trova `window`,
 * gsap mette i plugin in coda e li registra al primo uso nel browser.
 */
gsap.registerPlugin(useGSAP, SplitText, Physics2DPlugin);

export { gsap, SplitText, useGSAP };
