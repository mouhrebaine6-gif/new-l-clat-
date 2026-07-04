import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Instagram, Mail, Compass, DoorOpen, Shirt, type LucideIcon } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { text, useI18n, type Localized } from "@/lib/i18n";

type Item = { to: string; label: Localized<string>; icon: LucideIcon };

/** Pages secondaires — hors des 5 onglets du bottom-nav. */
const navItems: Item[] = [
  { to: "/lore", label: text("Indices", "Clues", "دلائل"), icon: Compass },
  { to: "/revelations", label: text("Ouvertures", "Openings", "الفتحات"), icon: DoorOpen },
  { to: "/dressing", label: text("Dressing", "Wardrobe", "الخزانة"), icon: Shirt },
];

const copy = {
  open: text("Ouvrir le menu", "Open menu", "فتح القائمة"),
  close: text("Fermer", "Close", "إغلاق"),
  veil: text("Le Voile", "The Veil", "السِّتار"),
  presence: text("Présence", "Presence", "الحضور"),
  contact: text("Contact", "Contact", "تواصل"),
  quote: text("« Le Voile s'ouvre. »", "“The Veil opens.”", "«السِّتار ينفتح.»"),
};

/**
 * Menu d'application « Le Voile » — bouton ☰ + tiroir glissant (glass).
 * Donne accès aux pages secondaires ; les 5 pages principales restent au BottomNav.
 * RTL-aware : le panneau glisse depuis le côté de début de lecture.
 */
export function VoileMenu() {
  const { tr, lang } = useI18n();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const fromRight = lang === "ar";

  // Fermer à chaque navigation
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Échap + verrou du scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tr(copy.open)}
        aria-expanded={open}
        className="tap -ms-1 flex h-9 w-9 items-center justify-center text-voile-dim transition hover:text-laiton active:text-laiton"
      >
        <Menu className="h-5 w-5" strokeWidth={1.25} />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="fixed inset-0 z-[60]" initial={false}>
              <motion.button
                type="button"
                aria-label={tr(copy.close)}
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-noir-profond/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />

              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label={tr(copy.veil)}
                className="absolute inset-y-0 start-0 flex w-[82%] max-w-xs flex-col overflow-hidden border-e border-border/50 glass-1"
                style={{ paddingTop: "var(--safe-top)" }}
                initial={{ x: fromRight ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: fromRight ? "100%" : "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 36 }}
              >
                <div className="voile-dust pointer-events-none absolute inset-0 opacity-20" />
                <div className="ligne-sacrée absolute inset-x-0 top-0 h-px" />

                <div className="relative flex h-14 items-center justify-between px-5">
                  <span className="font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
                    {tr(copy.veil)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={tr(copy.close)}
                    className="tap text-voile-dim transition hover:text-laiton"
                  >
                    <X className="h-5 w-5" strokeWidth={1.25} />
                  </button>
                </div>

                <div className="relative flex flex-col items-start px-5 pt-3">
                  <Wordmark size={26} />
                  <p className="mt-1 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim/50">
                    Drop 01 · MMXXVI
                  </p>
                </div>

                <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-6">
                  {navItems.map((it) => (
                    <Link
                      key={it.to}
                      to={it.to}
                      className="group flex items-center gap-4 rounded-md px-2 py-3 text-voile-dim transition hover:bg-laiton/5 hover:text-laiton"
                    >
                      <it.icon
                        className="h-[18px] w-[18px] shrink-0 opacity-70 transition group-hover:opacity-100"
                        strokeWidth={1.25}
                      />
                      <span className="font-serif-rituel text-xl">{tr(it.label)}</span>
                    </Link>
                  ))}

                  <div className="mx-2 my-4 h-px bg-border/40" />

                  <p className="mb-2 px-2 font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton/80">
                    {tr(copy.presence)}
                  </p>
                  <a
                    href="https://www.instagram.com/flowfit_15?igsh=MTNxZW9wNzM4bzBnNg%3D%3D&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-2 py-2.5 text-voile-dim transition hover:text-laiton"
                  >
                    <Instagram className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.25} />
                    <span className="font-mono-eclat text-[11px] uppercase tracking-rituel">
                      @flowfit_15
                    </span>
                  </a>
                  <a
                    href="mailto:contact@leclat.app"
                    className="flex items-center gap-4 px-2 py-2.5 text-voile-dim transition hover:text-laiton"
                  >
                    <Mail className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.25} />
                    <span className="font-mono-eclat text-[11px] uppercase tracking-rituel">
                      {tr(copy.contact)}
                    </span>
                  </a>
                </nav>

                <div className="safe-bottom relative px-5 pb-6">
                  <div className="ligne-sacrée mb-4 h-px" />
                  <p className="font-serif-rituel text-sm italic leading-snug text-voile-dim/60">
                    {tr(copy.quote)}
                  </p>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
