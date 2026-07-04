import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useCart, formatDA, saveOrder, generateOrderRef, type Order } from "@/lib/cart";
import { Ornement } from "@/components/Sceau";
import { DemoBanner } from "@/components/DemoBanner";
import { toast } from "sonner";
import { text, useI18n } from "@/lib/i18n";

const wilayas = [
  "Alger",
  "Oran",
  "Constantine",
  "Annaba",
  "Blida",
  "Sétif",
  "Tlemcen",
  "Béjaïa",
  "Tizi Ouzou",
  "Batna",
  "Mostaganem",
  "Autre",
];

const SHIP = {
  domicile: { label: "Livraison à domicile", price: 600, eta: "3 à 5 jours" },
  "stop-desk": { label: "Stop Desk Yalidine", price: 400, eta: "2 à 4 jours" },
};

const checkoutCopy = {
  demo: text(
    "Aperçu commande · paiement non finalisé",
    "Order preview · payment not finalized",
    "معاينة طلب · الدفع غير نهائي",
  ),
  emptyCart: text("Panier vide", "Empty cart", "السلة فارغة"),
  noPiece: text("Aucune pièce sélectionnée", "No piece selected", "لم تُحدد أي قطعة"),
  shop: text("Visiter la boutique", "Visit the shop", "زيارة المتجر"),
  backShop: text("Boutique", "Shop", "المتجر"),
  order: text("Commande", "Order", "الطلب"),
  step: text("Étape", "Step", "الخطوة"),
  addressStep: text("I — Adresse", "I — Address", "I — العنوان"),
  deliveryStep: text("II — Livraison", "II — Delivery", "II — التوصيل"),
  paymentStep: text("III — Paiement", "III — Payment", "III — الدفع"),
  fullName: text("Nom complet", "Full name", "الاسم الكامل"),
  phone: text("Téléphone", "Phone", "الهاتف"),
  commune: text("Commune", "Commune", "البلدية"),
  fullAddress: text("Adresse complète", "Full address", "العنوان الكامل"),
  required: text(
    "Toutes les voies doivent être tracées",
    "All delivery fields must be filled",
    "يجب ملء كل خانات التوصيل",
  ),
  domicile: text("Livraison à domicile", "Home delivery", "توصيل إلى المنزل"),
  stopDesk: text("Stop Desk Yalidine", "Yalidine stop desk", "مكتب ياليدين"),
  etaDomicile: text("3 à 5 jours", "3 to 5 days", "٣ إلى ٥ أيام"),
  etaStopDesk: text("2 à 4 jours", "2 to 4 days", "٢ إلى ٤ أيام"),
  cod: text("Paiement à la livraison", "Cash on delivery", "الدفع عند الاستلام"),
  codSub: text(
    "Paiement à la remise de la pièce",
    "Pay when the piece is handed over",
    "الدفع عند تسليم القطعة",
  ),
  ccp: text("Versement CCP", "CCP transfer", "تحويل CCP"),
  ccpSub: text(
    "Coordonnées envoyées avec la confirmation",
    "Details sent with confirmation",
    "تُرسل البيانات مع التأكيد",
  ),
  edahabia: text("Carte Edahabia / CIB", "Edahabia / CIB card", "بطاقة الذهبية / CIB"),
  edahabiaSub: text(
    "Paiement en ligne (à venir)",
    "Online payment (coming later)",
    "الدفع الإلكتروني (قريبًا)",
  ),
  subtotal: text("Sous-total", "Subtotal", "المجموع الفرعي"),
  delivery: text("Livraison", "Delivery", "التوصيل"),
  total: text("Total", "Total", "الإجمالي"),
  piece: text("pièce", "piece", "قطعة"),
  pieces: text("pièces", "pieces", "قطع"),
  back: text("Retour", "Back", "رجوع"),
  continue: text("Continuer", "Continue", "متابعة"),
  confirm: text("Confirmer la commande", "Confirm order", "تأكيد الطلب"),
};

export default function CheckoutPage() {
  const { tr } = useI18n();
  const { lines, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState({
    fullname: "",
    phone: "",
    wilaya: "Alger",
    commune: "",
    adresse: "",
  });
  const [delivery, setDelivery] = useState<"domicile" | "stop-desk">("domicile");
  const [payment, setPayment] = useState<"cod" | "ccp" | "edahabia">("cod");

  if (lines.length === 0) {
    return (
      <div className="px-6 py-24 text-center space-y-6">
        <DemoBanner label={tr(checkoutCopy.demo)} />
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
          {tr(checkoutCopy.emptyCart)}
        </p>
        <h1 className="font-serif-rituel text-4xl">{tr(checkoutCopy.noPiece)}</h1>
        <Link
          to="/boutique"
          className="inline-block rounded-full px-8 py-4 border border-laiton text-laiton hover:bg-laiton hover:text-primary-foreground transition-all duration-700 active:scale-95 font-mono-eclat text-[11px] tracking-rituel uppercase"
        >
          {tr(checkoutCopy.shop)}
        </Link>
      </div>
    );
  }

  const ship = SHIP[delivery].price;
  const total = subtotal + ship;

  const next = () => {
    if (step === 1) {
      if (!address.fullname || !address.phone || !address.commune || !address.adresse) {
        toast.error(tr(checkoutCopy.required));
        return;
      }
    }
    if (step === 3) {
      const order: Order = {
        ref: generateOrderRef(),
        lines,
        subtotal,
        shipping: ship,
        total,
        address,
        delivery,
        payment,
        createdAt: Date.now(),
        status: "transmise",
      };
      saveOrder(order);
      clear();
      navigate("/checkout/confirmation");
      return;
    }
    setStep((s) => (s + 1) as 1 | 2 | 3);
  };

  return (
    <div className="pb-12">
      <DemoBanner label={tr(checkoutCopy.demo)} />
      <Link
        to="/boutique"
        className="inline-flex items-center gap-2 px-6 pt-6 text-voile-dim hover:text-laiton transition-colors text-xs font-mono-eclat tracking-rituel uppercase"
      >
        <ArrowLeft className="w-3 h-3" /> {tr(checkoutCopy.backShop)}
      </Link>

      {/* Progression rituelle */}
      <section className="px-6 pt-8 text-center">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-2">
          {tr(checkoutCopy.order)}
        </p>
        <h1 className="font-serif-rituel text-4xl mb-6">
          {tr(checkoutCopy.step)} {["I", "II", "III"][step - 1]} / III
        </h1>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-lg border flex items-center justify-center font-serif-rituel text-sm ${
                  n <= step ? "border-laiton text-laiton" : "border-border text-voile-dim/40"
                }`}
              >
                {["I", "II", "III"][n - 1]}
              </span>
              {n < 3 && <span className={`h-px w-10 ${n < step ? "bg-laiton" : "bg-border"}`} />}
            </div>
          ))}
        </div>
        <Ornement className="mt-6 max-w-xs mx-auto" />
      </section>

      {/* Steps */}
      <section className="px-6 py-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="addr"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
                {tr(checkoutCopy.addressStep)}
              </p>
              <Field
                label={tr(checkoutCopy.fullName)}
                value={address.fullname}
                onChange={(v) => setAddress({ ...address, fullname: v })}
              />
              <Field
                label={tr(checkoutCopy.phone)}
                value={address.phone}
                onChange={(v) => setAddress({ ...address, phone: v })}
              />
              <div>
                <label className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim block mb-2">
                  Wilaya
                </label>
                <select
                  value={address.wilaya}
                  onChange={(e) => setAddress({ ...address, wilaya: e.target.value })}
                  className="w-full rounded-xl bg-noir-profond border border-border px-4 py-3 font-serif-rituel text-base text-foreground focus:border-laiton outline-none"
                >
                  {wilayas.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label={tr(checkoutCopy.commune)}
                value={address.commune}
                onChange={(v) => setAddress({ ...address, commune: v })}
              />
              <Field
                label={tr(checkoutCopy.fullAddress)}
                value={address.adresse}
                onChange={(v) => setAddress({ ...address, adresse: v })}
                multiline
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="ship"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
                {tr(checkoutCopy.deliveryStep)}
              </p>
              {(["domicile", "stop-desk"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setDelivery(opt)}
                  className={`w-full text-left rounded-2xl border p-5 transition active:scale-[0.99] ${delivery === opt ? "border-laiton bg-laiton/5" : "border-border hover:border-laiton/40"}`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif-rituel text-xl">
                      {opt === "domicile" ? tr(checkoutCopy.domicile) : tr(checkoutCopy.stopDesk)}
                    </span>
                    <span className="font-serif-rituel text-laiton">
                      {formatDA(SHIP[opt].price)}
                    </span>
                  </div>
                  <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim mt-1">
                    {opt === "domicile"
                      ? tr(checkoutCopy.etaDomicile)
                      : tr(checkoutCopy.etaStopDesk)}
                  </p>
                </button>
              ))}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="pay"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
                {tr(checkoutCopy.paymentStep)}
              </p>
              {(
                [
                  ["cod", tr(checkoutCopy.cod), tr(checkoutCopy.codSub)],
                  ["ccp", tr(checkoutCopy.ccp), tr(checkoutCopy.ccpSub)],
                  ["edahabia", tr(checkoutCopy.edahabia), tr(checkoutCopy.edahabiaSub)],
                ] as const
              ).map(([id, label, sub]) => (
                <button
                  key={id}
                  onClick={() => setPayment(id)}
                  className={`w-full text-left rounded-2xl border p-5 transition active:scale-[0.99] ${payment === id ? "border-laiton bg-laiton/5" : "border-border hover:border-laiton/40"}`}
                >
                  <div className="font-serif-rituel text-xl">{label}</div>
                  <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim mt-1">
                    {sub}
                  </p>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Récap */}
      <section className="px-6 pb-6">
        <div className="rounded-2xl border border-laiton/30 bg-card/40 p-5 space-y-2 text-sm">
          <Row
            label={`${tr(checkoutCopy.subtotal)} (${lines.length} ${tr(lines.length > 1 ? checkoutCopy.pieces : checkoutCopy.piece)})`}
            value={formatDA(subtotal)}
          />
          <Row label={tr(checkoutCopy.delivery)} value={formatDA(ship)} />
          <div className="h-px bg-border my-2" />
          <Row label={tr(checkoutCopy.total)} value={formatDA(total)} bold />
        </div>
      </section>

      {/* Actions */}
      <section className="px-6 flex items-center gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="flex items-center gap-2 rounded-xl px-5 py-3 border border-border text-voile-dim hover:text-laiton hover:border-laiton/40 transition active:scale-[0.98] font-mono-eclat text-[10px] tracking-rituel uppercase"
          >
            <ArrowLeft className="w-3 h-3" /> {tr(checkoutCopy.back)}
          </button>
        )}
        <button
          onClick={next}
          style={{ background: "linear-gradient(90deg, #b8893a, #e0b46b)", color: "#1a1209" }}
          className="flex-1 flex items-center justify-center gap-3 rounded-xl py-4 font-mono-eclat text-[11px] tracking-rituel uppercase transition-transform active:scale-[0.98]"
        >
          {step === 3 ? (
            <>
              <Check className="w-3.5 h-3.5" /> {tr(checkoutCopy.confirm)}
            </>
          ) : (
            <>
              {tr(checkoutCopy.continue)} <ArrowRight className="w-3 h-3" />
            </>
          )}
        </button>
      </section>
    </div>
  );
}

const Field = ({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) => (
  <div>
    <label className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim block mb-2">
      {label}
    </label>
    {multiline ? (
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-noir-profond border border-border px-4 py-3 font-serif-rituel text-base text-foreground focus:border-laiton outline-none resize-none"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-noir-profond border border-border px-4 py-3 font-serif-rituel text-base text-foreground focus:border-laiton outline-none"
      />
    )}
  </div>
);

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
