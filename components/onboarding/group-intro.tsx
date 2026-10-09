import { Button } from "@/components/ui/button";
import type { GroupDef } from "@/lib/onboarding/groups";
import Link from "next/link";

type GroupIntroProps = {
  group: GroupDef;
  disabled?: boolean;
  onContinue: () => void;
  onBack: () => void;
};

/**
 * L'intro di un macro-passo: spiega cosa si sta per scegliere, prima di
 * entrare nelle schermate di selezione. Si passa da qui a ogni ingresso
 * dalla hub — mai nei salti interni fra step dello stesso macro-passo.
 */
export function GroupIntro({ group, disabled, onContinue, onBack }: GroupIntroProps) {
  return (
    <div className="flex flex-1 flex-col gap-8">
      {/*
        Il titolo ha un'interlinea più bassa del corpo (32/21, dal design): i
        glifi escono dal suo box, e il `gap-8` tiene la descrizione alla
        distanza del mockup.
      */}
      <div className="my-auto flex w-full max-w-md flex-col items-center gap-8 self-center text-center">
        <h1 className="text-[32px]/[21px] font-extrabold">{group.introTitle}</h1>
        <p className="text-[20px]/[20px] font-medium text-muted-foreground">
          {group.introDescription}
        </p>
      </div>

      {/*
        Dal design, misurati dal fondo dello schermo al fondo di ogni elemento:
        "Indietro" a 120px, la CTA a 176px. Il `gap-8` è quello che resta in
        mezzo: 176 − 120 − 24 (l'interlinea di "Indietro", fissata con `text-base`).
      */}
      <div className="flex flex-col items-center gap-8 pb-[120px]">
        <Button
          variant="ticket"
          disabled={disabled}
          onClick={onContinue}
        >
          Scegli
        </Button>

        {/* <Button
          type="button"
          variant="ticketSecondary"
          className="self-center w-full"
          disabled={disabled}
          onClick={onBack}
        >
          Indietro
        </Button> */}
        <Link
          href="#"
          className="self-center w-full text-center text-base text-muted-foreground underline"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
        >
          Indietro
        </Link>
      </div>
    </div>
  );
}
