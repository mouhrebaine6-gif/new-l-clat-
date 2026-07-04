import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Boutons de L'Éclat.
 *
 * Chaque variante porte une intention narrative, pas seulement un style :
 *
 *  - rituel    : engagement fort, gravé dans la matière. Inscription au Voile, validation.
 *  - voile     : action mystique secondaire, brume translucide. Dévoiler, attendre, en savoir plus.
 *  - pierre    : navigation neutre. Retour, fermer, codex.
 *  - passage   : commerce — page boutique, ajouter, payer. Discret mais affirmé.
 *  - default/secondary/destructive/outline/ghost/link : conservés pour shadcn.
 *
 * Le `scan` n'est pas une variante : c'est un composant à part (`ScanButton`),
 * parce qu'il est circulaire et qu'il pulse en permanence (le seul de l'app).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "rounded-md hover:bg-accent hover:text-accent-foreground",
        link: "rounded-md text-primary underline-offset-4 hover:underline",

        // ─── L'Éclat ─────────────────────────────────────────────

        // Engagement fort — creusé dans la matière.
        rituel: [
          "relative rounded-xl font-mono-eclat tracking-rituel uppercase text-[11px]",
          "text-laiton bg-noir-profond/60",
          "border border-laiton/50",
          "shadow-[inset_0_1px_0_hsl(var(--laiton)/0.15),inset_0_-12px_24px_-12px_hsl(0_0%_0%/0.6),0_1px_0_hsl(var(--laiton)/0.1)]",
          "hover:text-primary-foreground hover:bg-laiton hover:border-laiton",
          "hover:shadow-[inset_0_1px_0_hsl(var(--laiton)/0.4),0_0_24px_-4px_hsl(var(--laiton)/0.5)]",
          "active:scale-[0.97] transition-[colors,box-shadow,transform] duration-700",
        ].join(" "),

        // Action mystique — brume translucide.
        voile: [
          "relative rounded-xl font-mono-eclat tracking-rituel uppercase text-[10px]",
          "text-voile bg-voile/[0.04] backdrop-blur-md",
          "border border-laiton/30",
          "shadow-[inset_0_0_0_1px_hsl(var(--voile)/0.04),0_8px_24px_-12px_hsl(0_0%_0%/0.5)]",
          "hover:text-laiton hover:bg-voile/[0.08] hover:border-laiton/50",
          "hover:backdrop-blur-sm",
          "active:scale-[0.98] transition-all duration-700",
        ].join(" "),

        // Navigation neutre — pierre gravée légèrement.
        pierre: [
          "rounded-xl font-mono-eclat tracking-rituel uppercase text-[10px]",
          "text-voile-dim bg-transparent border border-border/60",
          "hover:text-laiton hover:border-laiton/40",
          "active:scale-[0.98] transition-[colors,border-color,transform] duration-500",
        ].join(" "),

        // Commerce — discret mais affirmé.
        passage: [
          "relative rounded-xl font-mono-eclat tracking-rituel uppercase text-[11px] overflow-hidden",
          "text-laiton bg-card/40 border border-laiton/40",
          "shadow-[inset_0_1px_0_hsl(var(--laiton)/0.1)]",
          "hover:text-primary-foreground hover:bg-laiton",
          "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-laiton",
          "after:scale-x-0 after:origin-left after:transition-transform after:duration-500",
          "hover:after:scale-x-100",
          "active:scale-[0.98] transition-[colors,box-shadow,transform] duration-700",
        ].join(" "),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        xl: "h-14 px-10",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
