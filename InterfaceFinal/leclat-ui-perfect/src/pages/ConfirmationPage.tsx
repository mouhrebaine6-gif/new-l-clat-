import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, FileText, Download, Truck } from "lucide-react";
import { getLastOrder, formatDA } from "@/lib/cart";
import { downloadOrderJSON, printOrderPDF } from "@/lib/exportOrder";
import { Sceau, Ornement } from "@/components/Sceau";
import { DemoBanner } from "@/components/DemoBanner";
import { getFragment, localizeFragment } from "@/data/fragments";
import { text, useI18n } from "@/lib/i18n";

const confirmationCopy = {
  demo: text(
    "Aperçu local · commande enregistrée sur cet appareil",
    "Local preview · order saved on this device",
    "معاينة محلية · تم حفظ الطلب على هذا الجهاز",
  ),
  sentSeal: text("ORDRE TRANSMIS", "ORDER SENT", "أُرسل الطلب"),
  sent: text(
    "Commande transmise à l'atelier",
    "Order sent to the atelier",
    "أُرسل الطلب إلى المشغل",
  ),
  body: text(
    "« La pièce est en préparation.\nVous serez prévenu·e à chaque étape de préparation. »",
    "“The piece is being prepared.\nYou will be notified at each preparation step.”",
    "«القطعة قيد التحضير.\nسنخبرك في كل خطوة من خطوات التحضير.»",
  ),
  ordered: text("Pièces commandées", "Ordered pieces", "القطع المطلوبة"),
  size: text("Taille", "Size", "المقاس"),
  subtotal: text("Sous-total", "Subtotal", "المجموع الفرعي"),
  delivery: text("Livraison", "Delivery", "التوصيل"),
  totalSent: text("Total transmis", "Total sent", "الإجمالي المرسل"),
  recipient: text("Destinataire", "Recipient", "المستلم"),
  home: text("Livraison à domicile", "Home delivery", "توصيل إلى المنزل"),
  payment: text("Paiement", "Payment", "الدفع"),
  receipt: text("Reçu PDF", "PDF receipt", "إيصال PDF"),
  export: text("Exporter", "Export", "تصدير"),
  tracking: text("Suivre la commande", "Track order", "تتبع الطلب"),
  seal: text("Mon sceau", "My seal", "ختمي"),
  continue: text("Continuer", "Continue", "متابعة"),
};

export default function ConfirmationPage() {
  const { lang, tr } = useI18n();
  const order = getLastOrder();
  if (!order) return <Navigate to="/" replace />;

  return (
    <div className="pb-12">
      <DemoBanner label={tr(confirmationCopy.demo)} />
      <section className="relative overflow-hidden border-b border-border/40 px-6 py-16 text-center">
        <div className="absolute inset-0 ciel-poussiere opacity-50 anim-drift" />
        <div className="absolute inset-0 vignette-mineral" />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative inline-flex flex-col items-center"
        >
          <div
            className="absolute inset-0 -m-10 rounded-full anim-respire"
            style={{
              background: "radial-gradient(circle, hsl(var(--laiton)/0.18), transparent 60%)",
            }}
          />
          <Sceau
            className="w-44 h-44 relative"
            label={`${order.ref} · ${tr(confirmationCopy.sentSeal)} · `}
          />
          <Check
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-laiton"
            strokeWidth={1}
          />
        </motion.div>

        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mt-8 mb-3">
          {tr(confirmationCopy.sent)}
        </p>
        <h1 className="font-serif-rituel text-5xl">{order.ref}</h1>
        <Ornement className="mt-6 max-w-xs mx-auto" />
        <p className="font-serif-rituel italic text-base text-voile-dim mt-6 max-w-md mx-auto leading-snug">
          {tr(confirmationCopy.body)}
        </p>
      </section>

      <section className="px-6 py-10 space-y-6">
        <div>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-3">
            {tr(confirmationCopy.ordered)}
          </p>
          {order.lines.map((l) => {
            const fragment = localizeFragment(getFragment(l.fragmentId), lang);
            return (
              <div key={l.id} className="flex gap-3 border border-border/60 bg-card/40 p-3 mb-2">
                <img src={l.image} className="w-16 h-20 object-cover" alt="" />
                <div className="flex-1">
                  <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-laiton">
                    {tr(confirmationCopy.size)} {l.size} · ×{l.qty}
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
          <Row label={tr(confirmationCopy.subtotal)} value={formatDA(order.subtotal)} />
          <Row label={tr(confirmationCopy.delivery)} value={formatDA(order.shipping)} />
          <div className="h-px bg-border my-2" />
          <Row label={tr(confirmationCopy.totalSent)} value={formatDA(order.total)} bold />
        </div>

        <div className="border border-border/60 p-5 space-y-1 text-sm">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-2">
            {tr(confirmationCopy.recipient)}
          </p>
          <p className="font-serif-rituel text-base">{order.address.fullname}</p>
          <p className="text-voile-dim text-xs">
            {order.address.adresse}, {order.address.commune}, {order.address.wilaya}
          </p>
          <p className="text-voile-dim text-xs">{order.address.phone}</p>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim mt-3">
            {order.delivery === "domicile" ? tr(confirmationCopy.home) : "Stop Desk Yalidine"} ·
            {tr(confirmationCopy.payment)} {order.payment.toUpperCase()}
          </p>
        </div>

        {/* Actions principales */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => printOrderPDF(order, lang)}
            className="flex items-center justify-center gap-2 py-4 border border-laiton text-laiton hover:bg-laiton hover:text-primary-foreground transition-all duration-700 font-mono-eclat text-[10px] tracking-rituel uppercase"
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.25} /> {tr(confirmationCopy.receipt)}
          </button>
          <button
            onClick={() => downloadOrderJSON(order)}
            className="flex items-center justify-center gap-2 py-4 border border-border text-voile-dim hover:text-laiton hover:border-laiton/40 transition font-mono-eclat text-[10px] tracking-rituel uppercase"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.25} /> {tr(confirmationCopy.export)}
          </button>
        </div>
        <Link
          to={`/commande/${order.ref}`}
          className="flex items-center justify-center gap-3 py-4 bg-laiton text-primary-foreground hover:bg-laiton/90 transition font-mono-eclat text-[11px] tracking-rituel uppercase"
        >
          <Truck className="w-3.5 h-3.5" strokeWidth={1.5} /> {tr(confirmationCopy.tracking)}
        </Link>
        <div className="flex gap-3">
          <Link
            to="/profil"
            className="flex-1 text-center py-4 border border-border text-voile-dim hover:text-laiton hover:border-laiton/40 transition font-mono-eclat text-[11px] tracking-rituel uppercase"
          >
            {tr(confirmationCopy.seal)}
          </Link>
          <Link
            to="/boutique"
            className="flex-1 text-center py-4 border border-border text-voile-dim hover:text-laiton hover:border-laiton/40 transition font-mono-eclat text-[11px] tracking-rituel uppercase"
          >
            {tr(confirmationCopy.continue)}
          </Link>
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
