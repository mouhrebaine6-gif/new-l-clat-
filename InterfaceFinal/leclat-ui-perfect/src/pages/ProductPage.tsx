import { useParams, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getFragment, localizeFragment } from "@/data/fragments";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { isInUnity, launchAr } from "@/lib/unityBridge";
import { haptic } from "@/lib/haptics";
import { text, useI18n } from "@/lib/i18n";

const sizes = ["XS", "S", "M", "L", "XL"];

const copy = {
  catalogue: text("Catalogue", "Catalogue", "الفهرس"),
  fragment: text("Fragment", "Fragment", "شذرة"),
  matiere: text("Matière", "Material", "الخامة"),
  edition: text("Édition", "Edition", "الإصدار"),
  linked: text("Fragment lié", "Linked fragment", "الشذرة المرتبطة"),
  size: text("Taille", "Size", "المقاس"),
  chooseSize: text("Choisis une taille", "Choose a size", "اختر مقاسًا"),
  added: text("ajouté au sac", "added to bag", "أُضيفت إلى الحقيبة"),
  add: text("Ajouter au sac", "Add to bag", "أضف إلى الحقيبة"),
  ar: text("Ouvrir en AR", "Open in AR", "فتح بالواقع المعزز"),
  unavailable: text(
    "Présence indisponible ici",
    "Presence unavailable here",
    "الحضور غير متاح هنا",
  ),
  unavailableDesc: text(
    "Ouvrez depuis l'app L'ÉCLAT pour lancer le fragment.",
    "Open from the L'ÉCLAT app to launch the fragment.",
    "افتح من تطبيق L'ÉCLAT لإطلاق الشذرة.",
  ),
};

export default function ProductPage() {
  const { id } = useParams();
  const { lang, tr } = useI18n();
  const f = localizeFragment(getFragment(id || ""), lang);
  const [size, setSize] = useState<string | null>(null);
  const { add } = useCart();
  if (!f || !f.unlocked) return <Navigate to="/boutique" replace />;

  const handleAdd = () => {
    if (!size) {
      toast.error(tr(copy.chooseSize));
      return;
    }
    add({
      fragmentId: f.id,
      size,
      price: f.price!,
      name: f.name,
      image: f.images!.flat,
      colorLabel: f.colorLabel,
    });
    haptic("select");
    toast.success(`${f.name} · ${size} · ${tr(copy.added)}`);
  };

  const price = (f.price ?? 0).toLocaleString("fr-FR");

  return (
    <div className="px-5 pb-10">
      <Link
        to="/boutique"
        className="inline-flex items-center gap-2 pt-5 text-voile-dim transition-colors hover:text-laiton"
        style={{ touchAction: "manipulation" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="font-mono-eclat text-[10px] uppercase tracking-rituel">
          {tr(copy.catalogue)}
        </span>
      </Link>

      {/* Photo + nom (fiche mockup) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mt-4 aspect-[4/5] overflow-hidden rounded-[22px] border border-border/70 bg-noir-profond"
      >
        <img
          src={f.images!.worn}
          alt={f.name}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "50% 26%" }}
        />
        <span
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,5,3,.2), transparent 30%, rgba(7,5,3,.2) 60%, rgba(13,10,8,.96))",
          }}
        />
        <div className="absolute bottom-[18px] left-[22px] right-[22px]">
          <p
            className="mb-1.5 font-mono-eclat uppercase text-laiton-flash"
            style={{ fontSize: "9px", letterSpacing: "0.2em" }}
          >
            {tr(copy.fragment)} {f.number} · {f.code} · {f.colorLabel}
          </p>
          <h1
            className="font-serif-rituel font-semibold text-voile-pur"
            style={{ fontSize: "48px", lineHeight: "0.9" }}
          >
            {f.name}
          </h1>
        </div>
      </motion.div>

      {/* Autres vues : à plat + détail broderie */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <img
          src={f.images!.flat}
          alt={`${f.name} — à plat`}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-2xl border border-border/70 object-cover"
        />
        <img
          src={f.images!.detail}
          alt={`${f.name} — détail broderie`}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-2xl border border-border/70 object-cover"
        />
      </div>

      {/* Description */}
      <p className="mt-5 font-serif-rituel text-xl italic leading-snug text-voile">
        « {f.preview} »
      </p>

      {/* Détails */}
      <div className="mt-5 border-t border-border/60">
        {[
          [tr(copy.matiere), f.matiere],
          [tr(copy.edition), f.edition],
          [tr(copy.linked), f.name],
        ].map(([k, v], i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-border/60 py-3.5"
          >
            <span className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
              {k}
            </span>
            <span className={`text-[13px] ${i === 2 ? "text-laiton-300" : "text-voile"}`}>{v}</span>
          </div>
        ))}
      </div>

      {/* Taille */}
      <p className="mt-6 mb-3 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
        {tr(copy.size)}
      </p>
      <div className="grid grid-cols-5 gap-2">
        {sizes.map((s) => (
          <button
            key={s}
            onClick={() => {
              haptic("select");
              setSize(s);
            }}
            style={{ touchAction: "manipulation" }}
            className={`rounded-xl border py-3 font-mono-eclat text-xs tracking-mineral transition-all active:scale-[0.97] ${
              size === s
                ? "border-laiton bg-laiton/10 text-laiton"
                : "border-border text-voile-dim hover:border-laiton/40"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Prix + Ajouter au sac */}
      <div className="mt-7 flex items-center gap-3.5">
        <span className="font-serif-rituel text-2xl leading-none text-voile-pur">
          {price}
          <span className="font-mono-eclat text-[11px] text-voile-dim"> DA</span>
        </span>
        <button
          onClick={handleAdd}
          style={{
            touchAction: "manipulation",
            background: "linear-gradient(90deg, #b8893a, #e0b46b)",
            color: "#1a1209",
          }}
          className="flex-1 rounded-[13px] py-[15px] text-center font-mono-eclat text-[10px] font-medium uppercase tracking-rituel transition-transform active:scale-[0.98]"
        >
          {tr(copy.add)}
        </button>
      </div>

      {/* Aperçu AR (fonction réelle) */}
      <button
        onClick={() => {
          haptic("select");
          if (!isInUnity()) {
            toast(tr(copy.unavailable), { description: tr(copy.unavailableDesc) });
            return;
          }
          launchAr(f.id, "preview");
        }}
        aria-label={tr(copy.ar)}
        style={{ touchAction: "manipulation" }}
        className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-[13px] border border-laiton/40 py-[14px] font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton transition-colors hover:bg-laiton/10 active:scale-[0.98]"
      >
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} /> {tr(copy.ar)}
      </button>
    </div>
  );
}
