/**
 * I testi della quest, tutti in un posto per poterli rivedere senza cercarli
 * nei componenti.
 *
 * ⚠️ Provvisori dove il mockup non si legge (i testi grigi, i messaggi di
 * caricamento, le istruzioni per l'evento): da sostituire con quelli definitivi.
 */
export const QUEST_COPY = {
  dado: {
    titolo: "La quest sta per iniziare, che canzone dovrai indovinare?",
    sottotitolo: "Lancia il dado per scoprirlo",
    gesto: "Lancia il dado",
    suggerimento: "Scorri verso l'alto sul dado, oppure toccalo",
    inCorso: "Lancio del dado in corso…",
    riprova: "Riprova",
  },
  risultato: {
    titolo: "E ora che si fa?",
    testo:
      "Salva o condividi la scheda del personaggio e torna al bancone di Rysonance dopo aver seguito attentamente la scaletta del Principe per ricevere la tua ricompensa unica.",
    cta: "Goditi l'evento",
    annuncio: (numero: number) => `È uscito il ${numero}`,
  },
  istruzioni: {
    titolo: "E ora che si fa?",
    testo:
      "Porta il tuo personaggio all'evento. Quando sarà il tuo turno ascolta la canzone con il tuo numero e prova a indovinarla: se ci riesci, la ricompensa di Prince Doji è tua.",
    cta: "Godi l'evento",
  },
  carta: {
    condividi: "Condividi Personaggio",
    condividiTitolo: (nome: string) => `${nome} · Rysonance`,
    condividiTesto: "Il mio eroe per la quest di Prince Doji.",
    wallet: "Salva la scheda nel wallet",
    walletLabel: (nome: string) => `Salva la scheda di ${nome} in Apple Wallet`,
  },
  caricamento: {
    rysonance: "Il tuo eroe è pronto…",
    partner: "Stiamo preparando la tua quest…",
  },
} as const;
