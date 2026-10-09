import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CardAnimation } from "./card-animation";
import { HeaderAnimation } from "./header-animation";

/**
 * La lobby di chi non ha ancora un eroe: titolo in alto, il riquadro col "+" al
 * centro e la CTA in fondo. Occupa tutta l'altezza sotto la nav, quindi chi la
 * contiene deve lasciarla crescere (`flex-1`).
 */
export function LobbyVuota() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 pb-12 pt-10 text-center">
      <HeaderAnimation>
        <h1 className="text-2xl font-bold leading-tight">
          Ops, qui non c&apos;è
          <br />
          ancora nessuno
        </h1>
      </HeaderAnimation>

      <div className="flex flex-1 items-center justify-center">
        <CardAnimation index={0}>
          <IconaVuota className="size-48" />
        </CardAnimation>
      </div>

      <Button asChild variant="ticket" longLabel>
        <Link href="/onboarding">Crea personaggio</Link>
      </Button>
    </div>
  );
}

/** Il riquadro dagli angoli intagliati con il "+": lo slot dell'eroe ancora vuoto. */
function IconaVuota({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 193 193"
      fill="currentColor"
      className={cn("text-[#E2E2E1]", className)}
      aria-hidden
    >
      <path d="M10.9274 160.809C21.9532 165.534 29.7795 174.049 34.1603 186.158C35.6369 190.293 38.0488 193.049 45.1368 193.049H146.091C147.716 192.606 149.537 192.114 151.752 191.573H151.998C155.394 190.687 158.594 189.85 161.596 188.619C169.029 185.469 174.64 180.153 179.169 175.329C184.977 169.127 188.865 161.941 190.637 154.016V153.77V153.524C191.819 148.503 192.951 143.335 192.951 138.413L192.803 91.0117L192.951 50.7972C192.951 41.002 189.801 35.6368 182.024 32.2897C170.949 27.5644 163.122 19.049 158.791 6.94032C157.314 2.80566 154.902 0.0492249 147.814 0.0492249H46.958C44.9399 0.63989 42.971 1.13211 41.2975 1.52589H41.0514C37.655 2.41189 34.4556 3.24866 31.453 4.47922C23.9713 7.62943 18.36 12.9946 13.8807 17.7692C8.0233 23.9712 4.18398 31.1084 2.36276 39.0332V39.2793V39.5254C1.23065 44.2999 0.0493164 49.7144 0.0493164 54.6366L0.196983 102.037L0.0493164 142.252C0.0493164 152.047 3.19953 157.412 10.9766 160.76L10.9274 160.809ZM15.7512 54.6858C15.7512 51.5848 16.5387 47.8439 17.6708 42.9217L17.917 41.888V41.7404L17.9662 41.5927C19.2459 36.7197 21.6578 32.4374 25.3495 28.4996C28.8935 24.7095 32.8313 20.9194 37.6058 18.9013C39.4762 18.1137 42.085 17.4739 44.8415 16.7848L45.186 16.6863C46.072 16.4894 47.1057 16.2433 48.2378 15.948L49.173 15.7019H145.304L147.47 19.935C153.278 31.2561 161.842 39.7715 172.967 45.2844L177.298 47.4501V52.3231L177.101 91.061L177.249 138.314C177.249 141.661 176.265 145.944 175.329 150.029L175.132 151.014V151.161L175.083 151.309C173.803 156.182 171.392 160.513 167.651 164.5C164.107 168.29 160.169 172.031 155.493 174.049C153.622 174.837 151.014 175.477 148.257 176.166L147.913 176.264C147.076 176.461 146.042 176.707 144.91 177.003L143.975 177.249H47.7456L45.5798 173.016C39.7716 161.695 31.2069 153.179 20.0827 147.666L15.7512 145.501V140.628L15.9481 101.89L15.8004 54.6366L15.7512 54.6858Z" />
      <path d="M90.421 131.915V105.385H63.8411V87.4678H90.421V61.1339H108.338V87.4678H134.672V105.385H108.338V131.915H90.421Z" />
    </svg>
  );
}
