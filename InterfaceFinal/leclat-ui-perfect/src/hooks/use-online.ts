import { useEffect, useState } from "react";

/**
 * useOnline — true tant que le navigateur signale une connexion réseau.
 * Côté lore : false ⇒ le Voile s'est refermé. Aucune progression profonde n'est accordée.
 */
export const useOnline = () => {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  return online;
};
