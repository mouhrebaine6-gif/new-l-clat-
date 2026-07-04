import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart, formatDA } from "@/lib/cart";
import { Link } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { Ornement } from "@/components/Sceau";
import { getFragment, localizeFragment } from "@/data/fragments";
import { text, useI18n } from "@/lib/i18n";

const SHIPPING_BASE = 600; // estimation Yalidine domicile (fictive)

const cartCopy = {
  cart: text("Panier", "Cart", "السلة"),
  title: text("Votre panier", "Your cart", "سلتك"),
  piece: text("pièce", "piece", "قطعة"),
  pieces: text("pièces", "pieces", "قطع"),
  empty: text("Aucune pièce choisie.", "No piece selected.", "لم تُختر أي قطعة."),
  visit: text("Visiter la boutique", "Visit the shop", "زيارة المتجر"),
  size: text("Taille", "Size", "المقاس"),
  subtotal: text("Sous-total", "Subtotal", "المجموع الفرعي"),
  shipping: text("Livraison (estimée)", "Delivery (estimated)", "التوصيل (تقديري)"),
  total: text("Total", "Total", "الإجمالي"),
  checkout: text("Finaliser la commande", "Complete order", "إتمام الطلب"),
  delivery: text(
    "Livraison Algérie · Yalidine · ZR Express",
    "Algeria delivery · Yalidine · ZR Express",
    "توصيل داخل الجزائر · ياليدين · ZR Express",
  ),
};

export const CartDrawer = () => {
  const { lines, subtotal, count, remove, updateQty, open, setOpen } = useCart();
  const { lang, tr } = useI18n();
  const shipping = lines.length ? SHIPPING_BASE : 0;
  const total = subtotal + shipping;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-noir-profond border-l border-laiton/30 p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60 text-left">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {tr(cartCopy.cart)}
          </p>
          <SheetTitle className="font-serif-rituel text-3xl">{tr(cartCopy.title)}</SheetTitle>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim">
            {count} {tr(count > 1 ? cartCopy.pieces : cartCopy.piece)}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {lines.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <ShoppingBag className="w-6 h-6 text-laiton/40 mx-auto" strokeWidth={1} />
              <p className="font-serif-rituel italic text-voile-dim">{tr(cartCopy.empty)}</p>
              <Link
                to="/boutique"
                onClick={() => setOpen(false)}
                style={{ touchAction: "manipulation" }}
                className="inline-block rounded-full px-6 py-3 border border-laiton/60 text-laiton text-[10px] font-mono-eclat tracking-rituel uppercase hover:bg-laiton hover:text-primary-foreground transition-all duration-700 active:scale-95"
              >
                {tr(cartCopy.visit)}
              </Link>
            </div>
          ) : (
            lines.map((l) => {
              const fragment = localizeFragment(getFragment(l.fragmentId), lang);
              const lineName = fragment?.name ?? l.name;
              const colorLabel = fragment?.colorLabel ?? l.colorLabel;
              return (
                <div
                  key={l.id}
                  className="flex gap-3 rounded-2xl border border-border/60 bg-card/40 p-3"
                >
                  <div className="w-20 h-24 shrink-0 overflow-hidden rounded-xl bg-noir-profond">
                    <img src={l.image} alt={lineName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-laiton">
                          {tr(cartCopy.size)} {l.size}
                        </p>
                        <h3 className="font-serif-rituel text-xl leading-tight">{lineName}</h3>
                        <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/70">
                          {colorLabel}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(l.id)}
                        className="text-voile-dim/60 hover:text-laiton transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center overflow-hidden rounded-lg border border-border/60">
                        <button
                          onClick={() => updateQty(l.id, l.qty - 1)}
                          className="px-2 py-1 text-voile-dim hover:text-laiton transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono-eclat text-xs px-3">{l.qty}</span>
                        <button
                          onClick={() => updateQty(l.id, l.qty + 1)}
                          className="px-2 py-1 text-voile-dim hover:text-laiton transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-serif-rituel text-lg text-laiton">
                        {formatDA(l.price * l.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-border/60 px-6 py-5 space-y-4 bg-noir-profond">
            <Ornement className="max-w-[180px] mx-auto" />
            <div className="space-y-1.5 text-sm">
              <Row label={tr(cartCopy.subtotal)} value={formatDA(subtotal)} />
              <Row label={tr(cartCopy.shipping)} value={formatDA(shipping)} />
              <div className="h-px bg-border my-2" />
              <Row label={tr(cartCopy.total)} value={formatDA(total)} bold />
            </div>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              style={{
                background: "linear-gradient(90deg, #b8893a, #e0b46b)",
                color: "#1a1209",
                touchAction: "manipulation",
              }}
              className="block w-full rounded-xl py-4 text-center font-mono-eclat text-[11px] tracking-rituel uppercase transition-transform active:scale-[0.98]"
            >
              {tr(cartCopy.checkout)}
            </Link>
            <p className="text-center font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/60">
              {tr(cartCopy.delivery)}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

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
