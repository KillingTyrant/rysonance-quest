"use server";

import { eseguiLancio } from "@/lib/quest/quest";
import type { LancioResult } from "@/lib/quest/types";

export async function lanciaDado(personaggioId: unknown): Promise<LancioResult> {
  return eseguiLancio(personaggioId);
}
