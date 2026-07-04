import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Sparkles } from "lucide-react";
import { getFragment, localizeFragment } from "@/data/fragments";
import { FragmentIcon } from "@/components/FragmentIcon";
import { isInUnity, launchAr } from "@/lib/unityBridge";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";
import { text, useI18n } from "@/lib/i18n";
import { TiltCard } from "@/components/motion/TiltCard";
import { StickyNoteUnfold } from "@/components/motion/StickyNoteUnfold";

const copy = {
  back: text("Retour", "Back", "رجوع"),
  fragment: text("Fragment", "Fragment", "الشذرة"),
  story: text("Aperçu reconnu", "Recognized preview", "لمحة معروفة"),
  law: text("Loi du passage", "Passage law", "قانون العتبة"),
  visual: text("Motif visuel", "Visual motif", "الأثر البصري"),
  worn: text("Au port", "On the body", "على الجسد"),
  piece: text("La pièce", "The piece", "القطعة"),
  protected: text(
    "Seuil intérieur · Contenu protégé",
    "Inner threshold · Protected content",
    "عتبة داخلية · محتوى محفوظ",
  ),
  protectedQuote: text(
    "« Cette couche s'ouvre seulement après un lien confirmé. »",
    "“This layer opens only after a confirmed link.”",
    "«هذه الطبقة لا تنفتح إلا بعد تأكيد الصلة.»",
  ),
  protectedHint: text(
    "Lecture impossible pour l'instant. Revenez quand le fragment répondra.",
    "Cannot be read for now. Return when the fragment answers.",
    "لا يمكن قراءتها الآن. عُد حين تجيب الشذرة.",
  ),
  seePiece: text("Voir la pièce textile", "View the textile piece", "اعرض القطعة"),
  scanHint: text(
    "Le scan s'ouvre avec la caméra · Visez le logo brodé",
    "The scan opens with the camera · Aim at the embroidered mark",
    "يفتح المسح بالكاميرا · وجّهها نحو العلامة المطرّزة",
  ),
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
  appRequired: text("· app L'ÉCLAT requise", "· L'ÉCLAT app required", "· يتطلب تطبيق L'ÉCLAT"),
};

export default function FragmentDetailPage() {
  const { id } = useParams();
  const { lang, tr } = useI18n();
  const f = localizeFragment(getFragment(id || ""), lang);
  if (!f || !f.unlocked) return <Navigate to="/fragments" replace />;

  return (
    <article className="pb-12">
      <Link
        to="/fragments"
        className="inline-flex items-center gap-2 px-6 pt-6 text-voile-dim hover:text-laiton transition-colors text-xs font-mono-eclat tracking-rituel uppercase"
      >
        <ArrowLeft className="w-3 h-3" /> {tr(copy.back)}
      </Link>

      {/* Hero image t-shirt — V2 TiltCard + couture */}
      <div className="px-6 mt-2">
        <TiltCard max={5} className="relative aspect-[4/5] overflow-hidden couture bg-bg-elevated">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="w-full h-full"
          >
            <img
              src={f.images!.worn}
              alt={`${f.name} porté`}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/70 to-transparent" />
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
              <div>
                <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton drop-shadow-lg">
                  {f.code}
                </p>
              </div>
              <FragmentIcon id={f.id} className="w-9 h-9 text-laiton drop-shadow-lg" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <span className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton-300">
                {tr(copy.fragment)}
              </span>
              <span className="font-display italic text-2xl text-voile">{f.name}</span>
            </div>
          </motion.div>
        </TiltCard>
      </div>

      {/* Title */}
      <header className="px-6 py-10 text-center border-b border-border/40">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim mb-3">
          {tr(copy.fragment)} {f.number}
        </p>
        <h1 className="font-serif-rituel text-6xl leading-none text-foreground mb-6">{f.name}</h1>
        <p className="font-serif-rituel text-xl italic text-laiton/90 max-w-md mx-auto leading-snug">
          « {f.hook} »
        </p>
      </header>

      {/* Récit */}
      <section className="px-6 py-10 space-y-8 border-b border-border/40">
        <Block label={tr(copy.story)}>{f.reveal}</Block>
        <Block label={tr(copy.law)}>{f.fonction}</Block>
        <Block label={tr(copy.visual)}>{f.motif}</Block>
        <Block label={tr(copy.worn)}>{f.sensation}</Block>
      </section>

      {/* Galerie */}
      <section className="px-6 py-10 space-y-3 border-b border-border/40">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim mb-4">
          {tr(copy.piece)}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <img
            src={f.images!.flat}
            alt="À plat"
            loading="lazy"
            decoding="async"
            className="aspect-square object-cover w-full rounded-2xl border border-border/60"
          />
          <img
            src={f.images!.detail}
            alt="Détail"
            loading="lazy"
            decoding="async"
            className="aspect-square object-cover w-full rounded-2xl border border-border/60"
          />
        </div>
      </section>

      {/* Couche protégée */}
      <section className="px-6 py-10 border-b border-border/40">
        <div className="relative overflow-hidden rounded-2xl border border-laiton/20 bg-card/30 p-5">
          <div className="absolute inset-0 filigrane opacity-30 pointer-events-none" />
          <div className="relative">
            <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-2">
              {tr(copy.protected)}
            </p>
            <p className="font-serif-rituel text-xl leading-snug text-foreground/90 mb-2">
              {tr(copy.protectedQuote)}
            </p>
            <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim">
              {tr(copy.protectedHint)}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-10 space-y-4">
        <ArButton fragmentId={f.id} />
        <div className="rounded-2xl border border-laiton/30 bg-card/40 p-6 space-y-5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim">
              {f.edition}
            </span>
            <span className="font-serif-rituel text-3xl text-laiton">
              {(f.price ?? 0).toLocaleString("fr-FR")} DA
            </span>
          </div>
          <p className="text-xs text-voile-dim leading-relaxed">
            {f.matiere} · {f.colorLabel}
          </p>
          <Link
            to={`/boutique/${f.id}`}
            style={{ background: "linear-gradient(90deg, #b8893a, #e0b46b)", color: "#1a1209" }}
            className="tap flex items-center justify-center gap-3 w-full rounded-xl py-4 font-mono-eclat text-[11px] tracking-rituel uppercase transition-transform"
          >
            <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.5} /> {tr(copy.seePiece)}
          </Link>
          <p className="text-center font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/60">
            {tr(copy.scanHint)}
          </p>
        </div>
      </section>
    </article>
  );
}

const ArButton = ({ fragmentId }: { fragmentId: string }) => {
  const inUnity = isInUnity();
  const { tr } = useI18n();
  const onClick = () => {
    haptic("select");
    if (!inUnity) {
      toast(tr(copy.unavailable), {
        description: tr(copy.unavailableDesc),
      });
      return;
    }
    launchAr(fragmentId, "preview");
  };
  return (
    <button
      onClick={onClick}
      aria-label={tr(copy.ar)}
      className="tap flex items-center justify-center gap-3 w-full rounded-xl py-4 border border-laiton/40 text-laiton hover:bg-laiton/10 transition-colors font-mono-eclat text-[11px] tracking-rituel uppercase"
    >
      <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} /> {tr(copy.ar)}
      {!inUnity && (
        <span className="text-voile-dim/70 normal-case tracking-normal text-[9px]">
          {tr(copy.appRequired)}
        </span>
      )}
    </button>
  );
};

const Block = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton/70 mb-2">
      {label}
    </p>
    <p className="font-serif-rituel text-xl leading-snug text-foreground">{children}</p>
  </div>
);
