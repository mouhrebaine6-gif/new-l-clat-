import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ShoppingBag as Bag } from "lucide-react";
import { toRoman } from "@/lib/porteur";
import { useAccountProgression } from "@/hooks/useAccountProgression";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "@/components/CartDrawer";
import { LanguageSwitch } from "@/components/LanguageModule";
import { Onboarding } from "@/components/Onboarding";
import { VoileMenu } from "@/components/VoileMenu";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UnityWebViewStatus } from "@/components/UnityWebViewStatus";
import { BridgeDebugPanel } from "@/components/BridgeDebugPanel";
import { Wordmark, Sceau as SceauBrode } from "@/components/Logo";
import { isUnityWebViewRuntime } from "@/lib/runtimeFlags";
import {
  onUnityMessage,
  postToUnity,
  notifyNavState,
  getCurrentBridgeRoute,
} from "@/lib/unityBridge";
import { resolveDeeplink } from "@/lib/deeplink";
import { text, useI18n } from "@/lib/i18n";
import { BottomNav } from "@/components/motion/BottomNav";
import { PageTransition } from "@/components/motion/PageTransition";

const appCopy = {
  cart: text("Ouvrir le panier", "Open cart", "فتح السلة"),
  profile: text("Profil", "Profile", "الملف"),
  entering: text("Toucher pour entrer ⊹", "Tap to enter ⊹", "المس للدخول ⊹"),
  splashLine: text("Porter · Scanner · Recevoir", "Wear · Scan · Receive", "ارتدِ · امسح · تلقَّ"),
  splashQuote: text(
    "« Portez-le sans rien demander. Scannez-le si cela ne vous suffit pas. »",
    "“Wear it without asking anything of it. Scan it if that is not enough.”",
    "«ارتده من غير أن تطلب منه شيئًا. امسحه إن لم يكفِ ذلك.»",
  ),
  fallback: text("Le Voile s'ouvre", "The Veil is opening", "السِّتار ينفتح"),
};

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, tr } = useI18n();
  const { remoteStatus, state } = useAccountProgression(lang);
  const { count, setOpen } = useCart();
  const insideUnityHost = isUnityWebViewRuntime();
  const [showSplash, setShowSplash] = useState(
    () => !insideUnityHost && !sessionStorage.getItem("eclat_splash_seen"),
  );

  useEffect(() => {
    if (!showSplash) return;
    const t = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("eclat_splash_seen", "1");
    }, 1400);
    return () => clearTimeout(t);
  }, [showSplash]);

  // === Unity bridge : navigation entrante + popstate à la racine ===
  useEffect(() => {
    const offNav = onUnityMessage<{ path?: string; deeplink?: string }>("NAV_TO_PAGE", (p) => {
      if (p?.deeplink) {
        const r = resolveDeeplink(p.deeplink);
        if (r.back) {
          navigate(-1);
          return;
        }
        if (r.path) {
          navigate(r.path);
          return;
        }
      }
      if (p?.path) navigate(p.path);
    });
    const offBack = onUnityMessage("NAV_BACK_REQUEST", () => {
      if (window.history.length > 1) navigate(-1);
      else postToUnity("NAV_BACK", { from: getCurrentBridgeRoute(), atRoot: true });
    });
    return () => {
      offNav();
      offBack();
    };
  }, [navigate, location.pathname]);

  // À la racine, signaler à Unity le bouton retour Android pour qu'il décide (fermer l'app, etc.)
  useEffect(() => {
    if (!insideUnityHost) return;
    const onPop = () => {
      if (location.pathname === "/")
        postToUnity("NAV_BACK", { from: getCurrentBridgeRoute(), atRoot: true });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [insideUnityHost, location.pathname]);

  // Notifie Unity de l'URL/route courante à chaque changement
  useEffect(() => {
    if (!insideUnityHost) return;
    notifyNavState(getCurrentBridgeRoute());
  }, [insideUnityHost, location.pathname, location.search, location.hash]);

  if (showSplash) return <Splash onSkip={() => setShowSplash(false)} />;

  return (
    <div className="relative min-h-[100dvh] flex flex-col">
      {/* Bandeau hors-ligne — Le Voile s'est refermé */}
      <OfflineBanner />
      <UnityWebViewStatus />

      {/* Onboarding rituel — affiché tant que non complété */}
      <Onboarding />

      {/* Halo d'ambiance global + outils V2 */}
      <div className="pointer-events-none fixed inset-0 z-0 voile-dust opacity-30" />
      <CartDrawer />
      {import.meta.env.DEV && <BridgeDebugPanel />}

      {/* Header glass-1 */}
      <header className="sticky top-0 z-30 glass-1" style={{ paddingTop: "var(--safe-top)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <VoileMenu />
            <NavLink
              to="/"
              className="flex items-center gap-3 group tap min-w-0"
              aria-label="L'Éclat"
            >
              <Wordmark
                size={18}
                className="transition group-hover:[text-shadow:0_0_28px_hsl(var(--laiton)/0.35)]"
              />
              <span className="font-mono-eclat text-[8px] tracking-rituel text-voile-dim/50 uppercase hidden sm:block border-l border-border/60 ps-3">
                Drop 01
              </span>
              {remoteStatus === "loading" && (
                <span
                  title="Synchro en cours"
                  className="font-mono-eclat text-[8px] tracking-rituel text-voile-dim/60 uppercase border-l border-border/60 ps-3 anim-respire"
                >
                  Synchro
                </span>
              )}
            </NavLink>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <LanguageSwitch compact />
            <button
              onClick={() => setOpen(true)}
              className="relative tap flex items-center justify-center text-voile-dim hover:text-laiton active:text-laiton transition"
              aria-label={tr(appCopy.cart)}
            >
              <Bag className="w-5 h-5" strokeWidth={1.25} />
              {count > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-laiton text-primary-foreground font-mono-eclat text-[9px] tracking-rituel flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </button>
            <NavLink
              to="/profil"
              className="tap flex max-w-[88px] items-center gap-1.5 px-1 font-mono-eclat text-[9px] uppercase tracking-normal text-voile-dim transition hover:text-laiton sm:max-w-[150px] sm:gap-2 sm:px-2 sm:text-[10px] sm:tracking-rituel"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-laiton anim-respire shrink-0" />
              <span className="truncate">
                {state.profile.pseudo} · {toRoman(state.profile.level)}
              </span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Page transition wrapper (Voile V2) */}
      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto pb-nav">
        <PageTransition>
          <div className="relative">{children}</div>
        </PageTransition>
      </main>

      {/* Bottom nav V2 (layoutId morph) */}
      <BottomNav />
    </div>
  );
};

const Splash = ({ onSkip }: { onSkip: () => void }) => {
  const { tr } = useI18n();
  return (
    <button
      onClick={onSkip}
      aria-label="L'Éclat"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-12 bg-noir-profond text-left overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-laiton focus-visible:ring-inset"
    >
      <div className="absolute inset-0 ciel-poussiere opacity-60 anim-drift" />
      <div className="absolute inset-0 vignette-mineral" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center gap-8"
      >
        <div className="relative flex items-center justify-center">
          <div
            className="absolute inset-0 -m-16 rounded-full anim-respire"
            style={{
              background: "radial-gradient(circle, hsl(var(--laiton)/0.22), transparent 60%)",
            }}
          />
          <SceauBrode
            width={240}
            fetchPriority="high"
            className="relative drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
          />
        </div>
        <div className="h-px w-32 bg-laiton/60 anim-respire" />
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim">
          {tr(appCopy.splashLine)}
        </p>
        <p className="font-serif-rituel italic text-base text-voile-dim/80 max-w-xs text-center leading-snug">
          {tr(appCopy.splashQuote)}
        </p>
      </motion.div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-10 font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/60"
      >
        {tr(appCopy.entering)}
      </motion.span>
    </button>
  );
};
