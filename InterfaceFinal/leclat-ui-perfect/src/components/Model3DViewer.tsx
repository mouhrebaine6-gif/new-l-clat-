import {
  useEffect,
  useRef,
  useState,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type FC,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Rotate3d } from "lucide-react";
import { AR_SKINS } from "@/lib/progression";
import { localizeFragment, getFragment } from "@/data/fragments";
import { text, useI18n } from "@/lib/i18n";

// model-viewer est un web component (Google) — l'import l'enregistre. Il rend un
// GLB en WebGL avec contrôles tactiles, SANS caméra ni cible physique : idéal
// pour admirer/faire tourner les présences 3D directement dans l'app.
import "@google/model-viewer";

// Custom element typé via un alias (robuste quelle que soit la version JSX/React).
const ModelViewer = "model-viewer" as unknown as FC<
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>
>;

const copy = {
  hint: text(
    "Fais-le tourner avec le doigt · pince pour zoomer",
    "Spin it with your finger · pinch to zoom",
    "أدِرْه بإصبعك · اقرص للتكبير",
  ),
  close: text("Fermer", "Close", "إغلاق"),
  loading: text("Chargement du modèle…", "Loading model…", "جارٍ تحميل النموذج…"),
  presence: text("Présence 3D", "3D presence", "حضور ثلاثي الأبعاد"),
};

/**
 * Visualiseur 3D plein écran d'une présence AR (aile, compagnon…), par son
 * `unityModelId`. Charge `${BASE_URL}models/<id>.glb` — chemin relatif à la base
 * pour fonctionner aussi dans la WebView Unity (file://).
 */
export const Model3DViewer = ({
  unityModelId,
  lang,
  onClose,
}: {
  unityModelId: string;
  lang: "fr" | "en" | "ar";
  onClose: () => void;
}) => {
  const { tr } = useI18n();
  const [loading, setLoading] = useState(true);
  const sceneRef = useRef<HTMLDivElement>(null);
  const base = import.meta.env.BASE_URL || "/";
  const src = `${base}models/${unityModelId}.glb`;
  const skin = AR_SKINS.find((s) => s.unityModelId === unityModelId);
  const fragment = skin ? localizeFragment(getFragment(skin.fragmentId), lang) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // `src` posé de façon IMPÉRATIVE : React ne fiabilise pas la prop `src` sur un
  // custom element, et model-viewer ne charge que quand il est réellement visible
  // (d'où le rendu en portail vers <body>, hors des ancêtres transformés).
  useEffect(() => {
    const mv = sceneRef.current?.querySelector("model-viewer");
    if (!mv) return;
    setLoading(true);
    // Attributs posés impérativement : React ne fiabilise ni `src` ni `loading`
    // sur un custom element. `loading=eager` force le chargement immédiat (sans
    // dépendre de l'IntersectionObserver, peu fiable en WebView).
    mv.setAttribute("loading", "eager");
    mv.setAttribute("reveal", "auto");
    mv.setAttribute("src", src);
    const done = () => setLoading(false);
    mv.addEventListener("load", done);
    mv.addEventListener("error", done);
    return () => {
      mv.removeEventListener("load", done);
      mv.removeEventListener("error", done);
    };
  }, [src]);

  // Filet : masque l'overlay « chargement » même si l'événement load du web
  // component ne remonte pas jusqu'à React (le modèle, lui, s'affiche seul).
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(t);
  }, [src]);

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-noir-profond"
      style={{ paddingTop: "var(--safe-top)" }}
      role="dialog"
      aria-modal="true"
    >
      <div className="ciel-poussiere anim-drift pointer-events-none absolute inset-0 opacity-40" />

      {/* Barre haute */}
      <div className="relative flex items-center justify-between px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton">
            {tr(copy.presence)}
          </p>
          <p className="truncate font-serif-rituel text-lg text-voile-pur">
            {skin?.name}
            {fragment ? <span className="text-voile-dim"> · {fragment.name}</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={tr(copy.close)}
          className="tap flex items-center gap-2 rounded-full border border-border/60 px-3 py-2 font-mono-eclat text-[10px] uppercase tracking-rituel text-voile-dim transition hover:border-laiton/50 hover:text-laiton"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
          {tr(copy.close)}
        </button>
      </div>

      {/* Scène 3D — `src` posé impérativement via sceneRef (cf. useEffect). */}
      <div ref={sceneRef} className="relative flex-1">
        <ModelViewer
          loading="eager"
          reveal="auto"
          camera-controls=""
          auto-rotate=""
          rotation-per-second="18deg"
          interaction-prompt="none"
          touch-action="pan-y"
          shadow-intensity="0.9"
          exposure="1.05"
          environment-image="neutral"
          camera-orbit="0deg 78deg auto"
          min-camera-orbit="auto 0deg auto"
          max-camera-orbit="auto 180deg auto"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            ["--poster-color" as string]: "transparent",
          }}
        />
        {loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton anim-respire">
              {tr(copy.loading)}
            </p>
          </div>
        )}
      </div>

      {/* Aide bas */}
      <div className="relative flex items-center justify-center gap-2 px-6 pb-8 pt-3 text-center">
        <Rotate3d className="h-4 w-4 shrink-0 text-laiton/70" strokeWidth={1.5} />
        <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
          {tr(copy.hint)}
        </p>
      </div>
    </motion.div>
  );

  return createPortal(content, document.body);
};
