import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, FileText, Copy, Truck, Package, Box, Check } from "lucide-react";
import {
  getOrderByRef,
  computeOrderStatus,
  STATUS_LABELS,
  getStatusLabel,
  formatDA,
  type OrderStatus,
} from "@/lib/cart";
import { downloadOrderJSON, printOrderPDF } from "@/lib/exportOrder";
import { Sceau, Ornement } from "@/components/Sceau";
import { DemoBanner } from "@/components/DemoBanner";
import { toast } from "sonner";
import { getFragment, localizeFragment } from "@/data/fragments";
import { text, useI18n } from "@/lib/i18n";

const STEPS: { key: OrderStatus; icon: typeof Box }[] = [
  { key: "transmise", icon: FileText },
  { key: "preparee", icon: Box },
  { key: "remise", icon: Package },
  { key: "en_route", icon: Truck },
  { key: "livree", icon: Check },
];

const trackingCopy = {
  demo: text(
    "Aperçu local · suivi enregistré sur cet appareil",
    "Local preview · tracking saved on this device",
    "معاينة محلية · تم حفظ التتبع على هذا الجهاز",
  ),
  seal: text("Mon sceau", "My seal", "ختمي"),
  copied: text("Référence copiée", "Reference copied", "تم نسخ المرجع"),
  tracking: text("Suivi de commande", "Order tracking", "تتبع الطلب"),
  sentOn: text("Transmise le", "Sent on", "أُرسلت في"),
  travelSteps: text("Étapes du voyage", "Journey steps", "خطوات الرحلة"),
  step: text("Étape", "Step", "الخطوة"),
  ordered: text("Pièces commandées", "Ordered pieces", "القطع المطلوبة"),
  size: text("Taille", "Size", "المقاس"),
  subtotal: text("Sous-total", "Subtotal", "المجموع الفرعي"),
  delivery: text("Livraison", "Delivery", "التوصيل"),
  total: text("Total", "Total", "الإجمالي"),
  recipient: text("Destinataire", "Recipient", "المستلم"),
  home: text("Livraison à domicile", "Home delivery", "توصيل إلى المنزل"),
  payment: text("Paiement", "Payment", "الدفع"),
  receipt: text("Reçu PDF", "PDF receipt", "إيصال PDF"),
  export: text("Exporter", "Export", "تصدير"),
};

export default function OrderTrackingPage() {
  const { lang, tr } = useI18n();
  const { ref } = useParams();
  const order = ref ? getOrderByRef(ref) : null;
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!order) return <Navigate to="/profil" replace />;
  const { status, step } = computeOrderStatus(order.createdAt);
  const date = new Date(order.createdAt).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const copyRef = () => {
    navigator.clipboard.writeText(order.ref);
    toast.success(tr(trackingCopy.copied));
  };

  return (
    <div className="pb-12">
      <DemoBanner label={tr(trackingCopy.demo)} />
      <Link
        to="/profil"
        className="inline-flex items-center gap-2 px-6 pt-6 text-voile-dim hover:text-laiton transition text-xs font-mono-eclat tracking-rituel uppercase"
      >
        <ArrowLeft className="w-3 h-3" /> {tr(trackingCopy.seal)}
      </Link>

      {/* En-tête sceau */}
      <section className="relative px-6 pt-10 pb-12 text-center overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 ciel-poussiere opacity-40 anim-drift pointer-events-none" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="relative inline-flex flex-col items-center"
        >
          <div
            className="absolute inset-0 -m-8 rounded-full anim-respire"
            style={{
              background: "radial-gradient(circle, hsl(var(--laiton)/0.18), transparent 60%)",
            }}
          />
          <Sceau
            className="w-44 h-44 relative"
            label={`${order.ref} · ${getStatusLabel(status, lang).label.toUpperCase()} · `}
          />
        </motion.div>
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mt-8 mb-2">
          {tr(trackingCopy.tracking)}
        </p>
        <button onClick={copyRef} className="inline-flex items-center gap-2 group">
          <h1 className="font-serif-rituel text-5xl">{order.ref}</h1>
          <Copy className="w-4 h-4 text-voile-dim/40 group-hover:text-laiton transition" />
        </button>
        <p className="font-serif-rituel italic text-base text-voile-dim mt-3">
          {tr(trackingCopy.sentOn)} {date}
        </p>
        <Ornement className="mt-6 max-w-xs mx-auto" />
      </section>

      {/* Timeline */}
      <section className="px-6 py-12 border-b border-border/40">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-8 text-center">
          {tr(trackingCopy.travelSteps)}
        </p>
        <ol className="relative space-y-6 max-w-md mx-auto">
          {/* ligne verticale */}
          <span className="absolute left-[19px] top-4 bottom-4 w-px bg-border" />
          <motion.span
            initial={{ height: 0 }}
            animate={{ height: `${(step / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-[19px] top-4 w-px bg-laiton"
          />
          {STEPS.map((s, i) => {
            const done = i <= step;
            const current = i === step;
            const Icon = s.icon;
            const meta = getStatusLabel(s.key, lang);
            return (
              <li key={s.key} className="relative flex items-start gap-4 pl-1">
                <span
                  className={`relative z-10 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-700 ${
                    done
                      ? "border-laiton bg-noir-profond text-laiton"
                      : "border-border bg-noir-profond text-voile-dim/40"
                  } ${current ? "anim-respire" : ""}`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.25} />
                </span>
                <div className="pt-1.5">
                  <p
                    className={`font-mono-eclat text-[10px] tracking-rituel uppercase ${done ? "text-laiton" : "text-voile-dim/50"}`}
                  >
                    {tr(trackingCopy.step)} {i + 1}
                  </p>
                  <p
                    className={`font-serif-rituel text-2xl leading-tight ${done ? "text-foreground" : "text-voile-dim/50"}`}
                  >
                    {meta.label}
                  </p>
                  <p
                    className={`font-serif-rituel italic text-sm mt-1 ${done ? "text-voile-dim" : "text-voile-dim/40"}`}
                  >
                    {meta.subtitle}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Détails commande */}
      <section className="px-6 py-10 space-y-6">
        <div>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-3">
            {tr(trackingCopy.ordered)}
          </p>
          {order.lines.map((l) => {
            const fragment = localizeFragment(getFragment(l.fragmentId), lang);
            return (
              <div key={l.id} className="flex gap-3 border border-border/60 bg-card/40 p-3 mb-2">
                <img src={l.image} className="w-16 h-20 object-cover" alt="" />
                <div className="flex-1">
                  <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-laiton">
                    {tr(trackingCopy.size)} {l.size} · ×{l.qty}
                  </p>
                  <p className="font-serif-rituel text-xl">{fragment?.name ?? l.name}</p>
                  <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim">
                    {fragment?.colorLabel ?? l.colorLabel}
                  </p>
                </div>
                <span className="font-serif-rituel text-laiton self-center">
                  {formatDA(l.price * l.qty)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="border border-laiton/30 bg-card/40 p-5 space-y-2 text-sm">
          <Row label={tr(trackingCopy.subtotal)} value={formatDA(order.subtotal)} />
          <Row label={tr(trackingCopy.delivery)} value={formatDA(order.shipping)} />
          <div className="h-px bg-border my-2" />
          <Row label={tr(trackingCopy.total)} value={formatDA(order.total)} bold />
        </div>

        <div className="border border-border/60 p-5 space-y-1 text-sm">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-2">
            {tr(trackingCopy.recipient)}
          </p>
          <p className="font-serif-rituel text-base">{order.address.fullname}</p>
          <p className="text-voile-dim text-xs">
            {order.address.adresse}, {order.address.commune}, {order.address.wilaya}
          </p>
          <p className="text-voile-dim text-xs">{order.address.phone}</p>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim mt-3">
            {order.delivery === "domicile" ? tr(trackingCopy.home) : "Stop Desk Yalidine"} ·
            {tr(trackingCopy.payment)} {order.payment.toUpperCase()}
          </p>
        </div>

        {/* Export */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => printOrderPDF(order, lang)}
            className="flex items-center justify-center gap-2 py-4 border border-laiton text-laiton hover:bg-laiton hover:text-primary-foreground transition-all duration-700 font-mono-eclat text-[10px] tracking-rituel uppercase"
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.25} /> {tr(trackingCopy.receipt)}
          </button>
          <button
            onClick={() => downloadOrderJSON(order)}
            className="flex items-center justify-center gap-2 py-4 border border-border text-voile-dim hover:text-laiton hover:border-laiton/40 transition font-mono-eclat text-[10px] tracking-rituel uppercase"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.25} /> {tr(trackingCopy.export)}
          </button>
        </div>
      </section>
    </div>
  );
}

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex justify-between">
    <span
      className={`font-mono-eclat text-[10px] tracking-rituel uppercase ${bold ? "text-laiton" : "text-voile-dim"}`}
    >
      {label}
    </span>
    <span
      className={
        bold ? "font-serif-rituel text-xl text-laiton" : "font-mono-eclat text-xs text-voile"
      }
    >
      {value}
    </span>
  </div>
);
