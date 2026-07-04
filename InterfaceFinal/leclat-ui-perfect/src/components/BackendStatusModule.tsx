import { ServerOff, ShieldAlert, Wifi, WifiOff } from "lucide-react";
import { hasBackend } from "@/lib/backend";
import { useOnline } from "@/hooks/use-online";

export const BackendStatusModule = ({ compact = false }: { compact?: boolean }) => {
  const online = useOnline();
  const backend = hasBackend();

  // Module technique : reste visible si le backend est branché (info utile),
  // mais en mode preview/sans backend on ne l'affiche qu'en développement
  // pour ne pas exposer les détails "prototype" à l'utilisateur final.
  if (import.meta.env.VITE_SHOW_TECH !== "1") return null;

  return (
    <section className={`${compact ? "mt-8" : "px-6 py-10 border-b border-border/40"}`}>
      <div className="border border-dashed border-laiton/40 bg-laiton/5 p-4">
        <div className="mb-3 flex items-center gap-3">
          {online ? (
            <Wifi className="h-4 w-4 text-laiton" strokeWidth={1.25} />
          ) : (
            <WifiOff className="h-4 w-4 text-laiton" strokeWidth={1.25} />
          )}
          <div>
            <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
              Offline / Backend
            </p>
            <h3 className="font-serif-rituel text-2xl leading-tight">
              {backend ? "Backend connecté" : "Mode preview seulement"}
            </h3>
          </div>
        </div>

        <div className="space-y-2 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
          <StatusLine
            icon={ServerOff}
            text={backend ? "API configurée par VITE_API_BASE" : "Backend absent"}
          />
          <StatusLine
            icon={ShieldAlert}
            text={
              backend
                ? "Progression vérifiable par serveur"
                : "Aucune progression officielle sans confirmation backend ou Unity"
            }
          />
          <StatusLine
            icon={online ? Wifi : WifiOff}
            text={online ? "Réseau disponible" : "Réseau indisponible"}
          />
        </div>
      </div>
    </section>
  );
};

const StatusLine = ({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  text: string;
}) => (
  <p className="flex items-center gap-2">
    <Icon className="h-3 w-3 shrink-0 text-laiton/80" strokeWidth={1.25} />
    <span>{text}</span>
  </p>
);
