"use client";

import { useEffect, useState } from "react";

export function F_Loading({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 4000; // 4 secondi totali
    const intervalTime = 50; 
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          if (onComplete) setTimeout(onComplete, 300);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  // A metà caricamento (50%) fa lo switch del logo
  const showSecondLogo = progress >= 50;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-between py-32">
      <div />

      {/* Contenitore Centrale Loghi */}
      <div className="relative w-64 h-32 flex items-center justify-center">
        {/* LOGO 1: RYSONANCE */}
        <div
          className={`absolute transition-opacity duration-700 ease-in-out ${
            !showSecondLogo ? "opacity-100" : "opacity-0"
          }`}
        >
          <img 
            src="/03_LOGO/Marchio.svg" 
            alt="Rysonance Logo" 
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* LOGO 2: PRINCE DOJI */}
        <div
          className={`absolute transition-opacity duration-700 ease-in-out ${
            showSecondLogo ? "opacity-100" : "opacity-0"
          }`}
        >
          <img 
            src="/03_LOGO/blanco.png" 
            alt="Prince Doji Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>
      </div>

      {/* Sezione Barra di Caricamento Inferiore */}
      <div className="w-full max-w-xs px-6 flex flex-col items-center gap-3">
        <p className="text-[13px] text-gray-500 font-medium tracking-tight">
          Attendendo la risposta da un eco lontano...
        </p>
        
        <div className="w-full h-[6px] bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#272727] rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Aggiungiamo l'export default richiesto da Next.js per la rotta /loading
export default function LoadingPage() {
  return <F_Loading onComplete={() => alert("Caricamento completato!")} />;
}