/**
 * I titoli della quest hanno l'interlinea più bassa del corpo (20px su 24px nel
 * numero, 21px su 32px nel dado): le maschere di SplitText, alte una riga,
 * taglierebbero discendenti e accenti. Si allargano di 0.2em sopra e sotto, con un
 * margine negativo uguale che lascia l'interlinea com'è; da qui `yPercent: 150` e
 * non 100, per partire da fuori la maschera più alta. Le maschere prendono la
 * classe del pezzo con `-mask` in coda (`pezzo-mask`).
 */
export const MASCHERA = "[&_.pezzo-mask]:-my-[0.2em] [&_.pezzo-mask]:py-[0.2em]";
/**
 * Le maschere di riga sono blocchi uno sopra l'altro, e i loro margini negativi
 * collassano: fra due righe ne resterebbe uno solo, e l'interlinea crescerebbe di
 * 0.2em. Dalla seconda riga in poi il margine in alto vale entrambi. Niente `flex`
 * sul titolo per evitare il collasso: SplitText trova le righe misurando le parole,
 * e in un flex ogni parola diventerebbe un elemento a sé, su una riga sua.
 */
export const MASCHERA_RIGHE = `${MASCHERA} [&_.pezzo-mask+.pezzo-mask]:-mt-[0.4em]`;
export const FUORI_MASCHERA = 150;
