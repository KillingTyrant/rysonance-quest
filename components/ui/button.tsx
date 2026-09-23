import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-sans transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 rounded-md",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 rounded-md",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 rounded-md",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-md",
        link: "text-primary underline-offset-4 hover:underline",

        ticket:
          "btn-ticket text-brand-foreground [--ticket-bg:hsl(var(--brand))] [--ticket-border-width:0px] hover:text-[#272727] hover:[--ticket-bg:#f4f4f4] hover:[--ticket-border:#272727] hover:[--ticket-border-width:3px] active:text-brand-foreground active:[--ticket-bg:hsl(var(--brand))] active:[--ticket-border-width:0px]",
        ticketSecondary:
          "btn-ticket [--notch-scale:0.5] text-[#f4f4f4] [--ticket-bg:#272727] [--ticket-border-width:0px] hover:text-[#272727] hover:[--ticket-bg:#f4f4f4] hover:[--ticket-border:#272727] hover:[--ticket-border-width:3px] active:text-[#f4f4f4] active:[--ticket-bg:#272727] active:[--ticket-border-width:0px]",

        // NUOVA VARIANTE SMALL (Usa il nuovo CSS btn-ticket-sm)
        ticketSmall:
          "btn-ticket-sm text-[#f4f4f4] [--ticket-bg:#272727] [--ticket-border-width:0px] hover:text-[#272727] hover:[--ticket-bg:#f4f4f4] hover:[--ticket-border:#272727] hover:[--ticket-border-width:3px] active:text-[#f4f4f4] active:[--ticket-bg:#272727] active:[--ticket-border-width:0px]",
      },
      size: {
        default: "h-9 px-4 py-2",
        lg: "w-[336px] h-[56px] text-[32px]/[32px] font-black tracking-normal flex items-center justify-center [--ticket-notch:18.6px]",
        md: "w-[288px] h-[48px] text-[26px]/[29px] font-extrabold tracking-normal flex items-center justify-center [--ticket-notch:16px]",
        sm: "w-[240px] h-[40px] text-[24px]/[27px] font-extrabold tracking-normal flex items-center justify-center [--ticket-notch:13.3px]",
        // Misura da barra: larghezza dal testo, altezza quella della nav.
        nav: "h-8 px-6 text-[16px]/[19px] font-extrabold tracking-normal flex items-center justify-center [--ticket-notch:10.6px]",
        icon: "h-9 w-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "ticket",
      size: "md",
    },
    // Le regole sottostanti sovrascrivono w, h, font-size e line-height se usi ticketSmall + md/sm
    compoundVariants: [
      {
        variant: "ticketSmall",
        size: "md",
        className: "w-[200px] h-[40px] text-[20px]/[23px]",
      },
      {
        variant: "ticketSmall",
        size: "sm",
        className: "w-[200px] h-[32px] text-[16px]/[19px]",
      },
    ],
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  showDots?: boolean;
}

const dotSizes = {
  lg: "w-3 h-3",
  md: "w-[10px] h-[10px]",
  default: "w-[10px] h-[10px]",
  sm: "w-2 h-2",
  nav: "w-2 h-2",
  icon: "w-0 h-0"
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, showDots, children, ...props }, ref) => {

    // Logica speciale per la variante ticketSmall
    const isTicketSmall = variant === "ticketSmall";
    const displayDots = showDots !== undefined ? showDots : (variant === "ticket" || isTicketSmall);

    const dotClass = isTicketSmall ? "w-[10px] h-[10px]" : (dotSizes[(size as keyof typeof dotSizes) || "default"] || dotSizes.default);

    const leftDotPos = isTicketSmall ? "-left-[5px]" : "left-4";
    const rightDotPos = isTicketSmall ? "-right-[5px]" : "right-4";

    // NUOVO: Invertiamo la partenza solo per i Ticket Small
    // Pallino sinistro: per andare da dentro a fuori deve partire da destra (translate-x-4)
    const leftDotStart = isTicketSmall ? "translate-x-4" : "-translate-x-4";

    // Pallino destro: per andare da dentro a fuori deve partire da sinistra (-translate-x-4)
    const rightDotStart = isTicketSmall ? "-translate-x-4" : "translate-x-4";

    // Colore dei pallini al click: scuri sul giallo di ticket e sul chiaro di ticketSmall,
    // chiari sullo sfondo scuro di ticketSecondary
    const activeDotColor = variant === "ticketSecondary" ? "group-active:bg-[#f4f4f4]" : "group-active:bg-[#272727]";

    const dotBase = "absolute top-1/2 rounded-full bg-[#272727] transition-all duration-800 ease-out group-hover:opacity-100 group-hover:translate-x-0";

    // Pallino sinistro
    const leftDot = displayDots && (
      <span
        aria-hidden
        className={cn(dotBase, `opacity-0 ${leftDotStart} -translate-y-1/2`, activeDotColor, leftDotPos, dotClass)}
      />
    );

    // Pallino destro
    const rightDot = displayDots && (
      <span
        aria-hidden
        className={cn(dotBase, `opacity-0 ${rightDotStart} -translate-y-1/2`, activeDotColor, rightDotPos, dotClass)}
      />
    );

    // Con asChild l'elemento renderizzato è il figlio (es. <Link>): Slottable gli
    // inietta dentro i pallini, così l'animazione resta anche sui link.
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn("group relative", buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {leftDot}
        {asChild ? <Slottable>{children}</Slottable> : <span>{children}</span>}
        {rightDot}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };