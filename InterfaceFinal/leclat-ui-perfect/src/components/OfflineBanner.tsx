import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnline } from "@/hooks/use-online";
import { syncOfflineQueue } from "@/lib/offlineQueue";
import { toast } from "sonner";
import { text, useI18n } from "@/lib/i18n";

const offlineCopy = {
  opened: text("Le Voile s'est rouvert", "The Veil has reopened", "انفتح السِّتار من جديد"),
  recognized: text(
    (n: number) => `${n} passage${n > 1 ? "s" : ""} reconnu${n > 1 ? "s" : ""} en silence.`,
    (n: number) => `${n} passage${n > 1 ? "s" : ""} recognized quietly.`,
    (n: number) => `تم التعرف إلى ${n} عبور بهدوء.`,
  ),
  closed: text("Le Voile s'est refermé", "The Veil has closed", "انغلق السِّتار"),
  steps: text("Vos pas restent comptés.", "Your steps remain counted.", "خطواتك ما زالت محفوظة."),
};

/**
 * Bandeau rituel quand le Voile se referme (réseau coupé).
 * Au retour réseau : sync silencieuse de la file et toast discret si quelque chose est passé.
 */
export const OfflineBanner = () => {
  const { tr } = useI18n();
  const online = useOnline();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      return;
    }
    if (wasOffline) {
      // Retour du réseau : on draine la file
      syncOfflineQueue().then((n) => {
        if (n > 0) {
          toast.success(tr(offlineCopy.opened), {
            description: tr(offlineCopy.recognized)(n),
          });
        }
      });
      setWasOffline(false);
    }
  }, [online, tr, wasOffline]);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 inset-x-0 z-50 safe-top pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto max-w-2xl px-4 pt-2">
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-noir-profond/90 backdrop-blur-md border border-laiton/30 shadow-textile">
              <span className="relative flex w-2 h-2 shrink-0">
                <span className="absolute inset-0 rounded-full bg-laiton/50 anim-respire" />
                <span className="relative w-2 h-2 rounded-full bg-laiton/80" />
              </span>
              <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-laiton flex-1 leading-tight">
                {tr(offlineCopy.closed)}
              </p>
              <p className="font-serif-rituel italic text-[11px] text-voile-dim hidden sm:block">
                {tr(offlineCopy.steps)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
