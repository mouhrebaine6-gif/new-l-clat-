/**
 * DemoBanner — affichée tant que `VITE_API_BASE` n'est pas branché.
 *
 * Le frontend n'a aucune autorité sur la "vérité" (unlock fragment, commande
 * réelle, paiement). Sans backend, on doit l'annoncer clairement sur les
 * pages qui simulent une action serveur (profil, checkout, confirmation,
 * suivi de commande).
 */
import { hasBackend } from "@/lib/backend";

type Props = { label: string; className?: string };

export const DemoBanner = ({ label, className = "" }: Props) => {
  if (hasBackend()) return null;
  // Hidden in production / Unity build — only surfaces in dev/preview/test for QA.
  if (import.meta.env.VITE_SHOW_TECH !== "1") return null;
  return (
    <div
      role="note"
      className={`mx-6 my-4 border border-dashed border-laiton/25 bg-laiton/[0.03] px-4 py-2 text-center font-mono-eclat text-[9px] tracking-rituel uppercase text-laiton/70 ${className}`}
    >
      {label}
    </div>
  );
};
