"use client";

import { Button } from "@/components/ui/button";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Niente menu: ogni clic passa al tema successivo, in quest'ordine.
const TEMI = [
  { value: "light", label: "Chiaro", Icon: Sun },
  { value: "dark", label: "Scuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Laptop },
] as const;

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const ICON_SIZE = 16;

  // Prima del mount il tema non è noto: stesso bottone, senza icona, per non far
  // cambiare l'altezza del footer quando compare quello vero.
  if (!mounted) {
    return (
      <Button variant="ticketSmall" size={"icon"} disabled aria-hidden tabIndex={-1}>
        <span style={{ width: ICON_SIZE, height: ICON_SIZE }} />
      </Button>
    );
  }

  const attuale = TEMI.find((t) => t.value === theme) ?? TEMI[2];
  const prossimo = TEMI[(TEMI.indexOf(attuale) + 1) % TEMI.length];

  return (
    <Button
      variant="ticketSmall"
      size={"icon"}
      onClick={() => setTheme(prossimo.value)}
      aria-label={`Cambia tema (attuale: ${attuale.label})`}
      title={`Tema: ${attuale.label}`}
    >
      <attuale.Icon key={attuale.value} size={ICON_SIZE} />
    </Button>
  );
};

export { ThemeSwitcher };
