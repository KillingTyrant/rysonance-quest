"use client";

import { Droplet, Footprints, Heart, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, Fragment, type PointerEvent, useRef } from "react";

import { CATALOG_IMAGES } from "@/assets/catalog";
import { Logo } from "@/components/layout/logo";
import { gsap, SplitText, useGSAP } from "@/components/motion/gsap";
import type { QuestCarta } from "@/lib/quest/types";
import { cn } from "@/lib/utils";

import { CondividiCarta } from "./condividi-carta";
import { QUEST_COPY } from "./copy";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const RIDOTTO = "(prefers-reduced-motion: reduce)";
/** Inclinazione massima, in gradi, quando il dito è sul bordo della card. */
const INCLINAZIONE_Y = 8;
const INCLINAZIONE_X = 7;

type QuickTo = ReturnType<typeof gsap.quickTo>;

type CartaPersonaggioProps = {
  carta: QuestCarta;
  /**
   * `false` finché la quest è alle istruzioni: la card è già montata ma invisibile,
   * così l'illustrazione e l'immagine da condividere sono pronte prima del giro.
   */
  attivo: boolean;
};

/**
 * La card del personaggio, ultima schermata della quest: illustrazione della razza a
 * tutta card, nome, razza, statistiche, e i due pulsanti "Condividi Personaggio" e
 * "Salva la scheda nel wallet".
 *
 * Entra girandosi (sul retro c'è il simbolo Rysonance), poi una banda di luce la
 * attraversa, il nome arriva lettera per lettera e le statistiche contano fino al
 * loro valore. Da lì è olografica: si inclina verso il dito e il riflesso lo segue.
 */
export function CartaPersonaggio({ carta, attivo }: CartaPersonaggioProps) {
  const rootRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const bandaRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLHeadingElement>(null);
  const razzaRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDListElement>(null);
  const azioniRef = useRef<HTMLDivElement>(null);
  const attivoPrecedenteRef = useRef(attivo);
  const inclinazioneRef = useRef<{ x: QuickTo; y: QuickTo } | null>(null);

  const illustrazione = CATALOG_IMAGES.razze[carta.razzaKey];

  const { contextSafe } = useGSAP(
    () => {
      const cambiato = attivoPrecedenteRef.current !== attivo;
      attivoPrecedenteRef.current = attivo;
      inclinazioneRef.current = null;
      if (!attivo) return;

      gsap.set(rootRef.current, { autoAlpha: 1 });
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // Da qui in poi la card segue il dito e ogni tanto una banda di luce la attraversa.
        const olografica = () => {
          inclinazioneRef.current = {
            x: gsap.quickTo(cardRef.current, "rotationX", { duration: 0.4, ease: "power3" }),
            y: gsap.quickTo(cardRef.current, "rotationY", { duration: 0.4, ease: "power3" }),
          };
          gsap.fromTo(
            bandaRef.current,
            { xPercent: 0 },
            { xPercent: 200, duration: 1.2, ease: "power2.inOut", repeat: -1, repeatDelay: 3.5 },
          );
        };

        // Pagina rimostrata o Strict Mode: la card era già entrata, non si rigira.
        if (!cambiato) {
          olografica();
          return;
        }

        const nome = SplitText.create(nomeRef.current, { type: "words,chars" });
        const statistiche = statsRef.current;
        gsap
          .timeline({ onComplete: olografica })
          // La dissolvenza sta sulla sezione e non sulla card: un'opacità sotto 1 su un
          // elemento `preserve-3d` lo appiattisce, e il retro smetterebbe di nascondere il fronte.
          .fromTo(
            rootRef.current,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.45, ease: "power1.out" },
            0.25,
          )
          .fromTo(
            cardRef.current,
            { rotationY: 180, y: 80 },
            { rotationY: 0, y: 0, duration: 1, ease: "power3.inOut" },
            0.25,
          )
          .fromTo(
            bandaRef.current,
            { xPercent: 0 },
            { xPercent: 200, duration: 0.9, ease: "power2.inOut" },
            1,
          )
          .from(
            nome.chars,
            {
              yPercent: 60,
              rotationX: -70,
              opacity: 0,
              transformPerspective: 400,
              stagger: 0.035,
              duration: 0.6,
              ease: "back.out(1.6)",
            },
            1.05,
          )
          .from(razzaRef.current, { opacity: 0, y: 12, duration: 0.4 }, 1.3)
          .from(
            statistiche?.querySelectorAll("dt, dd") ?? [],
            { opacity: 0, x: -10, stagger: 0.05, duration: 0.35 },
            1.35,
          )
          .from(
            statistiche?.querySelectorAll("[data-conta]") ?? [],
            {
              textContent: 0,
              snap: { textContent: 1 },
              stagger: 0.1,
              duration: 0.9,
              ease: "power1.out",
            },
            1.35,
          )
          .from(
            azioniRef.current?.children ?? [],
            { opacity: 0, y: 24, stagger: 0.2, duration: 0.5, ease: "back.out(1.7)" },
            1.55,
          );
      });

      mm.add(RIDOTTO, () => {
        if (cambiato) gsap.from(rootRef.current, { opacity: 0, duration: 0.3 });
      });
    },
    { scope: rootRef, dependencies: [attivo] },
  );

  const inclina = contextSafe((event: PointerEvent<HTMLDivElement>) => {
    const inclinazione = inclinazioneRef.current;
    const front = frontRef.current;
    if (!inclinazione || !front) return;
    const rect = front.getBoundingClientRect();
    const px = gsap.utils.clamp(0, 1, (event.clientX - rect.left) / rect.width);
    const py = gsap.utils.clamp(0, 1, (event.clientY - rect.top) / rect.height);
    inclinazione.y((px - 0.5) * 2 * INCLINAZIONE_Y);
    inclinazione.x((0.5 - py) * 2 * INCLINAZIONE_X);
    gsap.to(front, {
      "--px": `${px * 100}%`,
      "--py": `${py * 100}%`,
      "--holo": 1,
      duration: 0.3,
      overwrite: "auto",
    });
  });

  const raddrizza = contextSafe(() => {
    const inclinazione = inclinazioneRef.current;
    if (!inclinazione) return;
    inclinazione.x(0);
    inclinazione.y(0);
    gsap.to(frontRef.current, { "--holo": 0, duration: 0.6, overwrite: "auto" });
  });

  const statistiche: { icon: LucideIcon; label: string; value: number | null }[] = [
    { icon: Heart, label: QUEST_COPY.carta.vita, value: carta.vita },
    { icon: Droplet, label: QUEST_COPY.carta.mana, value: carta.mana },
    { icon: Footprints, label: QUEST_COPY.carta.movimento, value: carta.movimento },
  ];

  return (
    <section
      ref={rootRef}
      aria-labelledby="quest-carta-nome"
      className={cn(
        "flex min-h-[35rem] flex-1 flex-col [perspective:1600px]",
        // Invisibile già nell'HTML del server: chi rientra dalle istruzioni non deve
        // vedere la card sovrapposta prima che GSAP prenda il controllo.
        !attivo && "invisible",
      )}
    >
      <div ref={cardRef} className="relative flex-1 [transform-style:preserve-3d]">
        <div
          ref={frontRef}
          // Valori di partenza delle variabili dell'effetto olografico, così GSAP ha
          // qualcosa da cui interpolare (vedi `.carta-holo-*` in globals.css).
          style={{ "--px": "50%", "--py": "30%", "--holo": 0 } as CSSProperties}
          onPointerMove={inclina}
          onPointerLeave={raddrizza}
          onPointerCancel={raddrizza}
          className="absolute inset-0 isolate flex touch-pan-y flex-col overflow-hidden rounded-[1.75rem] bg-stone-500 text-white shadow-2xl [backface-visibility:hidden] [container-type:inline-size]"
        >
          {illustrazione && (
            <Image
              src={illustrazione}
              alt=""
              fill
              loading="eager"
              sizes="(min-width: 448px) 408px, 90vw"
              className="-z-10 object-cover"
            />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-3/5 bg-gradient-to-b from-black/70 via-black/25 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-stone-100 via-stone-100/80 to-transparent"
          />
          <div aria-hidden className="carta-holo-iride pointer-events-none absolute inset-0" />
          <div aria-hidden className="carta-holo-riflesso pointer-events-none absolute inset-0" />
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Parte appena fuori a sinistra (`left`, non un transform: quello è di GSAP). */}
            <div ref={bandaRef} className="carta-holo-banda absolute inset-y-0 -left-full w-full" />
          </div>

          <div className="relative flex flex-col px-5 pt-6">
            {/* Il nome riempie la larghezza: la dimensione scala con la card (cqi) e
                con il numero di lettere. Nel mockup è un serif display che il
                progetto non ha ancora. */}
            <h1
              id="quest-carta-nome"
              ref={nomeRef}
              data-quest-titolo
              tabIndex={-1}
              style={{ "--lettere": Math.max(carta.nome.length, 4) } as CSSProperties}
              className="text-balance text-center text-[min(5.5rem,calc(150cqi/var(--lettere)))] font-extrabold uppercase leading-[0.9] tracking-tight outline-none [overflow-wrap:anywhere]"
            >
              {carta.nome}
            </h1>
            {carta.razza && (
              <p ref={razzaRef} className="mt-5 text-2xl font-extrabold">
                {carta.razza}
              </p>
            )}
            <dl
              ref={statsRef}
              className="mt-3 grid w-fit grid-cols-[auto_auto] items-center gap-x-6 gap-y-2 text-sm"
            >
              {statistiche.map(({ icon: Icon, label, value }) => (
                <Fragment key={label}>
                  <dt className="flex items-center gap-2 font-medium">
                    <Icon aria-hidden className="size-4 shrink-0" />
                    {label}
                  </dt>
                  <dd className="font-extrabold tabular-nums">
                    {value === null ? (
                      "—"
                    ) : (
                      <>
                        {/* Il numero che conta è solo visivo: gli screen reader leggono il valore. */}
                        <span aria-hidden data-conta>
                          {value}
                        </span>
                        <span className="sr-only">{value}</span>
                      </>
                    )}
                  </dd>
                </Fragment>
              ))}
            </dl>
          </div>

          <div
            ref={azioniRef}
            className="relative mt-auto flex flex-col items-center gap-3 px-5 pb-6"
          >
            <div className="w-full max-w-72">
              <CondividiCarta
                carta={carta}
                illustrazione={illustrazione?.src ?? null}
                className="w-full"
              />
            </div>
            {/* `<a>` e non `<Link>`: la risposta è un download `.pkpass`, e su iOS la
                schermata "Aggiungi" si apre solo da una navigazione vera. */}
            <a
              href={`/api/personaggi/${carta.personaggioId}/pkpass`}
              aria-label={QUEST_COPY.carta.walletLabel(carta.nome)}
              className="rounded-sm text-sm font-semibold text-stone-900 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {QUEST_COPY.carta.wallet}
            </a>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center rounded-[1.75rem] bg-stone-900 text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <Logo className="h-auto w-24" />
        </div>
      </div>
    </section>
  );
}
