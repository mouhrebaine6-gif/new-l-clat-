import { useEffect, useState } from "react";
import { Bug, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionNonce, type UnityMessage } from "@/lib/unityBridge";

const formatMessage = (msg: UnityMessage | null) => {
  if (!msg) return "Aucun message";
  try {
    return JSON.stringify({ type: msg.type, payload: msg.payload, nonce: msg.nonce }, null, 2);
  } catch {
    return String(msg.type);
  }
};

export const BridgeDebugPanel = () => {
  const [open, setOpen] = useState(false);
  const [lastIn, setLastIn] = useState<UnityMessage | null>(null);
  const [lastOut, setLastOut] = useState<UnityMessage | null>(null);

  useEffect(() => {
    const onBridgeIn = (event: Event) => setLastIn((event as CustomEvent<UnityMessage>).detail);
    const onBridgeOut = (event: Event) => setLastOut((event as CustomEvent<UnityMessage>).detail);

    window.addEventListener("eclat:bridge-in", onBridgeIn as EventListener);
    window.addEventListener("eclat:bridge-out", onBridgeOut as EventListener);
    return () => {
      window.removeEventListener("eclat:bridge-in", onBridgeIn as EventListener);
      window.removeEventListener("eclat:bridge-out", onBridgeOut as EventListener);
    };
  }, []);

  if (import.meta.env.VITE_SHOW_TECH !== "1") return null;

  return (
    <div className="fixed right-3 z-[80] w-[min(92vw,380px)] font-mono-eclat text-[9px] bottom-[calc(5rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Ouvrir le panneau de debug"
        className="ml-auto flex items-center gap-1.5 border border-laiton/30 bg-noir-profond/80 px-2 py-1 uppercase tracking-rituel text-laiton/70 hover:text-laiton transition opacity-60 hover:opacity-100"
      >
        <Bug className="h-3 w-3" strokeWidth={1.25} />
        {open ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronUp className="h-2.5 w-2.5" />}
      </button>

      {open && (
        <div className="mt-2 border border-laiton/30 bg-noir-profond/95 p-3 text-voile-dim shadow-ceremoniel">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="uppercase tracking-rituel text-laiton">sessionNonce</span>
            <span className="truncate text-right">{getSessionNonce()}</span>
          </div>

          <DebugBlock title="Dernier message reçu de Unity" value={formatMessage(lastIn)} />
          <DebugBlock title="Dernier message envoyé à Unity" value={formatMessage(lastOut)} />

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                const cur = window.localStorage?.getItem("eclat_dev_chrome") === "1";
                window.localStorage?.setItem("eclat_dev_chrome", cur ? "0" : "1");
                window.location.reload();
              }}
              className="border border-laiton/30 px-2 py-1 uppercase tracking-rituel text-laiton/80 hover:text-laiton text-[9px]"
            >
              {window.localStorage?.getItem("eclat_dev_chrome") === "1"
                ? "Masquer chrome dev"
                : "Afficher chrome dev"}
            </button>
            <Button
              variant="pierre"
              size="sm"
              className="min-h-9"
              onClick={() => window.__eclat__?.simulateScan("eveil")}
            >
              <Send className="h-3 w-3" strokeWidth={1.25} />
              simulateScan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const DebugBlock = ({ title, value }: { title: string; value: string }) => (
  <div className="border-t border-border/50 py-3 first:border-t-0 first:pt-0">
    <p className="mb-2 uppercase tracking-rituel text-laiton">{title}</p>
    <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-relaxed text-voile-dim/80">
      {value}
    </pre>
  </div>
);
