/**
 * I testi della quest, tutti in un posto per poterli rivedere senza cercarli
 * nei componenti.
 *
 * ⚠️ Provvisori dove il mockup non si legge (i testi grigi, i messaggi di
 * caricamento): da sostituire con quelli definitivi.
 */
export const QUEST_COPY = {
  dado: {
    titolo: "La quest sta per iniziare",
    sottotitolo: "Lancia il dado per scoprirla",
    gesto: "Lancia il dado",
    suggerimento: "Scorri verso l'alto sul dado, oppure toccalo",
    inCorso: "Lancio del dado in corso…",
    riprova: "Riprova",
  },
  risultato: {
    // Il titolo finisce con "numero": lo completa il numero nell'esagono, sotto.
    titolo: "Fai attenzione alla scaletta del concerto e ricorda il titolo della canzone numero",
    cta: "Continua",
    annuncio: (numero: number) => `È uscito il ${numero}`,
  },
  istruzioni: {
    titolo: "Dopo il concerto, torna al banchetto di Rysonance per riscuotere il premio.",
    testi: [
      "Mostra il cellulare con il numero e comunica il titolo della canzone associata.",
      "Potrai conservare la scheda del tuo personaggio e portarlo anche in gioco all'uscita di Rysonance!",
    ],
    cta: "Goditi l'evento",
  },
  carta: {
    condividi: "Condividi Personaggio",
    condividiTitolo: (nome: string) => `${nome} · Rysonance`,
    condividiTesto: "Il mio eroe per la quest di Prince Doji.",
    /** Le etichette sopra i valori, nell'immagine condivisa. */
    etichette: { razza: "Razza", via: "Via", talento: "Talento" },
    /** Letto dagli screen reader prima del numero nell'esagono. */
    numero: "Il tuo numero:",
    // Comincia con il testo del badge Apple, così il nome accessibile contiene quello visibile.
    walletLabel: (nome: string) => `Aggiungi a Apple Wallet la scheda di ${nome}`,
  },
  caricamento: {
    rysonance: "Attendo la risposta da un eco lontano...",
    partner: "Attendo la risposta da un eco lontano...",
  },
} as const;
