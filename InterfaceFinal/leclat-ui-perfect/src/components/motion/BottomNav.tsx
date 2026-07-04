import { NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Layers, ShoppingBag, BookOpen, User, type LucideIcon } from "lucide-react";
import { text, useI18n, type Localized } from "@/lib/i18n";

/**
 * Bottom tab bar — icônes d'origine (Frag. · Pièces · Histoire · Sceau) +
 * bouton Scan central doré surélevé (seul élément repris du mockup premium).
 * Indicateur doré animé (layoutId) sur l'onglet actif. Respecte useReducedMotion().
 */

const ACTIVE = "#e0b46b";
const IDLE = "#7a6f63";

const buzz = () => {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* vibration non supportée — sans effet */
  }
};

type Tab = {
  to: string;
  end?: boolean;
  label: Localized<string>;
  icon: LucideIcon;
};

const leftTabs: Tab[] = [
  { to: "/fragments", label: text("Frag.", "Frag.", "شذر"), icon: Layers },
  { to: "/boutique", label: text("Pièces", "Pieces", "قطع"), icon: ShoppingBag },
];
const rightTabs: Tab[] = [
  { to: "/histoire", label: text("Histoire", "Story", "القصة"), icon: BookOpen },
  { to: "/profil", label: text("Sceau", "Seal", "الختم"), icon: User },
];

function TabButton({ tab, reduce }: { tab: Tab; reduce: boolean }) {
  const { tr } = useI18n();
  const Icon = tab.icon;
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      onClick={buzz}
      style={{ touchAction: "manipulation" }}
      className="relative flex h-full flex-col items-center justify-center gap-[5px]"
    >
      {({ isActive }) => {
        const color = isActive ? ACTIVE : IDLE;
        return (
          <>
            {isActive && (
              <motion.span
                layoutId="navbar-indicator"
                className="absolute top-0 h-[2px] w-[30px] rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, #f4d79e, transparent)",
                  boxShadow: "0 0 10px #e0b46b",
                }}
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                }
              />
            )}
            <Icon size={21} color={color} strokeWidth={1.25} />
            <span
              className="font-mono uppercase leading-none"
              style={{ fontSize: "7.5px", letterSpacing: "0.14em", color }}
            >
              {tr(tab.label)}
            </span>
          </>
        );
      }}
    </NavLink>
  );
}

export function BottomNav() {
  const reduce = useReducedMotion() ?? false;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 glass-2 safe-bottom border-t border-border/60"
      aria-label="Navigation principale"
    >
      <div className="mx-auto grid h-[62px] max-w-2xl grid-cols-5 items-center">
        {leftTabs.map((t) => (
          <TabButton key={t.to} tab={t} reduce={reduce} />
        ))}

        {/* Bouton Scan central doré, surélevé (repris du mockup) */}
        <NavLink
          to="/scan"
          onClick={buzz}
          aria-label="Scanner"
          style={{ touchAction: "manipulation" }}
          className="relative flex h-full items-start justify-center"
        >
          {({ isActive }) => (
            <motion.span
              whileTap={reduce ? undefined : { scale: 0.92 }}
              className="relative flex items-center justify-center rounded-full"
              style={{
                top: "-14px",
                width: "54px",
                height: "54px",
                background: isActive
                  ? "radial-gradient(circle at 50% 35%, #f4d79e, #b8893a 72%)"
                  : "radial-gradient(circle at 50% 35%, #caa057, #8a6a30 72%)",
                boxShadow: isActive
                  ? "0 0 0 5px rgba(8,6,5,.82), 0 0 22px -2px rgba(224,180,107,.7)"
                  : "0 0 0 5px rgba(8,6,5,.82), 0 0 22px -2px rgba(184,137,58,.35)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1a1209"
                strokeWidth={1.4}
              >
                <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M7 12h10" />
              </svg>
            </motion.span>
          )}
        </NavLink>

        {rightTabs.map((t) => (
          <TabButton key={t.to} tab={t} reduce={reduce} />
        ))}
      </div>
    </nav>
  );
}
