import * as React from "react";
import { motion } from "framer-motion";
import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { text, useI18n } from "@/lib/i18n";

type ScanButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | "children"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDragStart"
  | "onDragEnd"
  | "onDrag"
> & {
  /** Désactive l'aura pulsante et grise le bouton — pour l'état hors-ligne. */
  voileFerme?: boolean;
  /** Indication courte sous l'icône — par défaut "Scanner". */
  label?: string;
  /** Indication longue, en italique sous le bouton. */
  hint?: string;
};

const scanButtonCopy = {
  closed: text("Le Voile s'est refermé", "The Veil has closed", "انغلق السِّتار"),
  scan: text("Scanner", "Scan", "امسح"),
  closedHint: text(
    "Le geste sera reconnu au retour du Voile.",
    "The gesture will be recognized when the Veil returns.",
    "ستُعرَف الحركة حين يعود السِّتار.",
  ),
  hint: text(
    "Approchez le vêtement, le tissu écoute.",
    "Bring the garment closer; the fabric listens.",
    "قرّب القطعة، القماش يصغي.",
  ),
};

/**
 * ScanButton — l'unique bouton qui pulse en permanence dans L'Éclat.
 *
 * Sa raison d'être : appeler le geste central du rituel.
 * Cercle de laiton, halo qui respire, anneau secondaire en orbite, micro-réponse à l'appui.
 *
 * En `voileFerme` (hors-ligne), il s'éteint, devient pierre, et son label change.
 */
export const ScanButton = React.forwardRef<HTMLButtonElement, ScanButtonProps>(
  ({ voileFerme = false, label, hint, className, disabled, onClick, ...props }, ref) => {
    const { tr } = useI18n();
    const computedLabel =
      label ?? (voileFerme ? tr(scanButtonCopy.closed) : tr(scanButtonCopy.scan));
    const computedHint =
      hint ?? (voileFerme ? tr(scanButtonCopy.closedHint) : tr(scanButtonCopy.hint));

    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <motion.button
          ref={ref}
          type="button"
          disabled={disabled || voileFerme}
          onClick={(e) => {
            if (voileFerme) return;
            // Vibration tactile très brève sur les supports compatibles
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              try {
                navigator.vibrate?.(8);
              } catch {
                /* noop */
              }
            }
            onClick?.(e);
          }}
          whileTap={voileFerme ? undefined : { scale: 0.96 }}
          className={cn(
            "relative tap rounded-full w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center",
            "border transition-all duration-700",
            voileFerme
              ? "border-voile-dim/30 bg-noir-profond/70 text-voile-dim/50 cursor-not-allowed"
              : "border-laiton/60 bg-noir-profond text-laiton hover:border-laiton hover:scale-[1.02]",
            "shadow-[inset_0_1px_0_hsl(var(--laiton)/0.2),inset_0_-20px_40px_-20px_hsl(0_0%_0%/0.7)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-laiton focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:opacity-100",
          )}
          aria-label={computedLabel}
          {...props}
        >
          {/* Halo intérieur respirant */}
          {!voileFerme && (
            <span
              aria-hidden
              className="absolute inset-2 rounded-full anim-respire pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, hsl(var(--laiton) / 0.35), transparent 60%)",
              }}
            />
          )}
          {/* Anneau orbital */}
          {!voileFerme && (
            <span
              aria-hidden
              className="absolute inset-[-10px] rounded-full border border-laiton/20 anim-orbit pointer-events-none"
              style={{ borderStyle: "dashed" }}
            />
          )}
          {/* Halo extérieur — moins intense */}
          {!voileFerme && (
            <span
              aria-hidden
              className="absolute inset-[-30px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, hsl(var(--laiton) / 0.18), transparent 65%)",
              }}
            />
          )}
          <ScanLine className="relative w-9 h-9 sm:w-10 sm:h-10" strokeWidth={1.1} aria-hidden />
        </motion.button>

        <div className="text-center">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {computedLabel}
          </p>
          <p className="font-serif-rituel italic text-[12px] text-voile-dim mt-1.5 max-w-[14rem] leading-snug">
            « {computedHint} »
          </p>
        </div>
      </div>
    );
  },
);
ScanButton.displayName = "ScanButton";
