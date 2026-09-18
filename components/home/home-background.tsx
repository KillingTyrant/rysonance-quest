"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import ShapeGrid from "@/components/layout/ShapeGrid";

/**
 * Colori della griglia per tema. Il canvas non legge le variabili CSS, quindi
 * stanno qui: lo scuro è la palette originale, il chiaro la sua controparte
 * tenue sullo sfondo bianco.
 */
const COLORI = {
  dark: { borderColor: "#2F293A", hoverFillColor: "#222" },
  light: { borderColor: "#E6E3EC", hoverFillColor: "#F1EEF5" },
} as const;

const subscribeNoop = () => () => {};

/**
 * Sfondo fisso della home: la griglia a esagoni che scorre in diagonale, visibile
 * fino ai bordi (niente vignettatura).
 */
export function HomeBackground() {
  // Il server non conosce il tema, il client sì già all'idratazione: la griglia
  // si monta solo dopo, altrimenti i due render non coincidono (hydration error).
  const montato = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const { resolvedTheme } = useTheme();
  const colori = !montato ? null : resolvedTheme === "dark" ? COLORI.dark : resolvedTheme === "light" ? COLORI.light : null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
      {colori && (
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          shape="hexagon"
          hoverTrailAmount={0}
          vignetteColor={null}
          {...colori}
        />
      )}
    </div>
  );
}
