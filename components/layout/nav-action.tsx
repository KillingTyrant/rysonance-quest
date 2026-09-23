"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Lo slot nella nav in cui finisce l'azione principale della schermata
 * corrente — nel wizard, il bottone che conferma la scelta e manda avanti.
 * L'id è duplicato a mano in `components/layout/nav.tsx`: la nav è un server
 * component e non può importare una costante da un modulo "use client".
 */
const NAV_ACTION_SLOT_ID = "nav-action";

/**
 * Porta i figli dentro lo slot della nav. La nav sta sopra il contenuto
 * nell'albero (la monta il layout), quindi non basta un prop: serve un
 * portale, ed è anche il motivo per cui la nav resta un server component.
 *
 * Al primo render lato client il nodo non esiste ancora: si monta dopo,
 * altrimenti l'HTML del server e quello dell'idratazione non coinciderebbero.
 */
export function NavAction({ children }: { children: ReactNode }) {
    const [slot, setSlot] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setSlot(document.getElementById(NAV_ACTION_SLOT_ID));
    }, []);

    if (!slot) return null;
    return createPortal(children, slot);
}
