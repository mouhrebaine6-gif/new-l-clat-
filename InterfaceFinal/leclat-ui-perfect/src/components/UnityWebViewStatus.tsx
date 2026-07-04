import { useEffect, useState } from "react";
import { Activity, Globe2, ServerOff, Smartphone, WifiOff } from "lucide-react";
import { hasBackend } from "@/lib/backend";
import { useOnline } from "@/hooks/use-online";
import { getSessionNonce, isInUnity, type UnityMessage } from "@/lib/unityBridge";

const unityBuild = import.meta.env.VITE_UNITY_WEBVIEW === "1";

export const UnityWebViewStatus = () => {
  const online = useOnline();
  const [insideUnity, setInsideUnity] = useState(false);
  const [lastBridgeIn, setLastBridgeIn] = useState<UnityMessage | null>(null);

  useEffect(() => {
    setInsideUnity(isInUnity());

    const onBridgeIn = (event: Event) => {
      setLastBridgeIn((event as CustomEvent<UnityMessage>).detail);
    };

    window.addEventListener("eclat:bridge-in", onBridgeIn as EventListener);
    return () => window.removeEventListener("eclat:bridge-in", onBridgeIn as EventListener);
  }, []);

  // Bandeau de statut technique : visible uniquement en dev/preview.
  // En expérience utilisateur réelle (Unity build, prod web), il reste caché
  // pour conserver une sensation app premium. Les infos restent accessibles
  // via le BridgeDebugPanel (dev) ou la page Profil (offline / hors-ligne).
  if (import.meta.env.VITE_SHOW_TECH !== "1") return null;

  const bridgeLabel = insideUnity
    ? lastBridgeIn
      ? "bridge connecté"
      : "bridge détecté"
    : import.meta.env.DEV
      ? "bridge simulable"
      : "bridge absent";

  return (
    <div className="relative z-20 border-b border-border/40 bg-noir-profond/80 safe-x">
      <div className="mx-auto flex max-w-2xl items-center gap-2 overflow-x-auto px-4 py-2 text-[9px] uppercase tracking-rituel text-voile-dim [scrollbar-width:none] sm:px-6">
        <StatusChip
          icon={insideUnity ? Smartphone : Globe2}
          label={insideUnity ? "ouverte dans Unity" : "ouverte dans navigateur"}
          active={insideUnity}
        />
        <StatusChip
          icon={Activity}
          label={bridgeLabel}
          active={insideUnity || Boolean(lastBridgeIn)}
        />
        <StatusChip
          icon={Activity}
          label={unityBuild ? "mode Unity" : "mode preview"}
          active={unityBuild}
        />
        <StatusChip
          icon={ServerOff}
          label={hasBackend() ? "backend branché" : "sans backend"}
          active={hasBackend()}
        />
        {!online && <StatusChip icon={WifiOff} label="hors ligne" active={false} />}
        <span className="shrink-0 text-voile-dim/40">nonce {getSessionNonce().slice(0, 6)}</span>
      </div>
    </div>
  );
};

const StatusChip = ({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  label: string;
  active: boolean;
}) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1.5 border px-2 py-1 font-mono-eclat ${active ? "border-laiton/40 text-laiton" : "border-border/60"}`}
  >
    <Icon className="h-3 w-3" strokeWidth={1.25} />
    {label}
  </span>
);
