import type { Order } from "@/lib/cart";
import { computeOrderStatus, getStatusLabel } from "@/lib/cart";
import { getFragment, localizeFragment } from "@/data/fragments";
import type { Lang, Localized } from "@/lib/i18n";

const formatDA = (n: number) => `${n.toLocaleString("fr-FR")} DA`;
const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

const copy: Localized<{
  lang: string;
  dir: string;
  orderSent: string;
  ritualReference: string;
  status: string;
  recipient: string;
  transmission: string;
  home: string;
  payment: string;
  fees: string;
  ordered: string;
  size: string;
  total: string;
  prepared: string;
  quote: string;
}> = {
  fr: {
    lang: "fr",
    dir: "ltr",
    orderSent: "Ordre transmis",
    ritualReference: "Référence rituelle",
    status: "État",
    recipient: "Destinataire",
    transmission: "Transmission",
    home: "À domicile",
    payment: "Paiement",
    fees: "Frais",
    ordered: "Pièces commandées",
    size: "Taille",
    total: "Total transmis",
    prepared: "⊹ Préparé par l'atelier ⊹",
    quote: "« La pièce voyagera. Veillez sur le passage. »",
  },
  en: {
    lang: "en",
    dir: "ltr",
    orderSent: "Order sent",
    ritualReference: "Ritual reference",
    status: "Status",
    recipient: "Recipient",
    transmission: "Transmission",
    home: "Home delivery",
    payment: "Payment",
    fees: "Fees",
    ordered: "Ordered pieces",
    size: "Size",
    total: "Total sent",
    prepared: "⊹ Prepared by the atelier ⊹",
    quote: "“The piece will travel. Watch over the passage.”",
  },
  ar: {
    lang: "ar",
    dir: "rtl",
    orderSent: "تم إرسال الطلب",
    ritualReference: "المرجع الطقسي",
    status: "الحالة",
    recipient: "المستلم",
    transmission: "الإرسال",
    home: "توصيل إلى المنزل",
    payment: "الدفع",
    fees: "الرسوم",
    ordered: "القطع المطلوبة",
    size: "المقاس",
    total: "الإجمالي المرسل",
    prepared: "⊹ تم التحضير في المشغل ⊹",
    quote: "«القطعة ستسافر. احرس العبور.»",
  },
};

export const downloadOrderJSON = (order: Order) => {
  const blob = new Blob([JSON.stringify(order, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.ref}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Génère un PDF rituel via window.print() sur un document HTML formaté.
// Avantage : aucun lib externe, rendu net, le porteur peut "Enregistrer en PDF".
export const printOrderPDF = (order: Order, lang: Lang = "fr") => {
  const t = copy[lang];
  const { status } = computeOrderStatus(order.createdAt);
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar-DZ" : "fr-FR";
  const date = new Date(order.createdAt).toLocaleString(locale);
  const linesHTML = order.lines
    .map((l) => {
      const fragment = localizeFragment(getFragment(l.fragmentId), lang);
      const lineName = escapeHtml(fragment?.name ?? l.name);
      const lineSize = escapeHtml(l.size);
      const lineColor = escapeHtml(fragment?.colorLabel ?? l.colorLabel ?? "");
      return `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #2a241c;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#d6c39a;">${lineName}</div>
        <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:9px;letter-spacing:.24em;color:#8a7d63;text-transform:uppercase;margin-top:4px;">${escapeHtml(t.size)} ${lineSize} · ${lineColor}</div>
      </td>
      <td style="padding:12px 8px;text-align:center;font-family:Georgia,'Times New Roman',serif;color:#d6c39a;">×${Number(l.qty)}</td>
      <td style="padding:12px 8px;text-align:right;font-family:Georgia,'Times New Roman',serif;color:#d6c39a;">${formatDA(l.price * l.qty)}</td>
    </tr>
  `;
    })
    .join("");

  const html = `
<!doctype html><html lang="${escapeHtml(t.lang)}" dir="${escapeHtml(t.dir)}"><head><meta charset="utf-8"><title>${escapeHtml(order.ref)} — L'Éclat</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:${lang === "ar" ? "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" : "Georgia,'Times New Roman',serif"};background:#0d0a06;color:#e8dcc0;padding:48px;max-width:780px;margin:0 auto;}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.32em;text-transform:uppercase;font-size:10px;color:#b89c6a;}
  .ornament{height:1px;background:linear-gradient(90deg,transparent,#b89c6a,transparent);margin:24px 0;}
  h1{font-family:Georgia,'Times New Roman',serif;font-size:48px;font-weight:300;color:#e8dcc0;margin-top:8px;}
  h2{font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:300;color:#d6c39a;margin-bottom:8px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin:32px 0;}
  .box{border:1px solid #2a241c;padding:20px;background:rgba(255,255,255,.02);}
  table{width:100%;border-collapse:collapse;margin-top:16px;}
  .total{font-size:32px;color:#b89c6a;}
  .seal{text-align:center;margin-top:48px;padding-top:32px;border-top:1px solid #2a241c;}
  .L{font-size:96px;color:#b89c6a;line-height:1;}
  @media print{body{background:#0d0a06;-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <p class="mono">L'Éclat · Drop 01 · MMXXVI</p>
      <h1>${escapeHtml(t.orderSent)}</h1>
      <p class="mono" style="margin-top:8px;color:#8a7d63;">${escapeHtml(date)}</p>
    </div>
    <div style="text-align:right;">
      <p class="mono">${escapeHtml(t.ritualReference)}</p>
      <h2 style="color:#b89c6a;font-size:32px;margin-top:4px;">${escapeHtml(order.ref)}</h2>
      <p class="mono" style="margin-top:8px;color:#8a7d63;">${escapeHtml(t.status)} : ${escapeHtml(getStatusLabel(status, lang).label)}</p>
    </div>
  </div>

  <div class="ornament"></div>

  <div class="grid">
    <div class="box">
      <p class="mono">${escapeHtml(t.recipient)}</p>
      <h2 style="margin-top:8px;">${escapeHtml(order.address.fullname)}</h2>
      <p style="font-style:italic;color:#a89878;">${escapeHtml(order.address.adresse)}</p>
      <p style="color:#a89878;">${escapeHtml(order.address.commune)}, ${escapeHtml(order.address.wilaya)}</p>
      <p style="color:#a89878;">${escapeHtml(order.address.phone)}</p>
    </div>
    <div class="box">
      <p class="mono">${escapeHtml(t.transmission)}</p>
      <h2 style="margin-top:8px;">${escapeHtml(order.delivery === "domicile" ? t.home : "Stop Desk Yalidine")}</h2>
      <p style="font-style:italic;color:#a89878;">${escapeHtml(t.payment)} : ${escapeHtml(order.payment.toUpperCase())}</p>
      <p class="mono" style="margin-top:8px;color:#8a7d63;">${escapeHtml(t.fees)} ${formatDA(order.shipping)}</p>
    </div>
  </div>

  <p class="mono">${escapeHtml(t.ordered)}</p>
  <table>${linesHTML}</table>

  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:32px;padding-top:16px;border-top:1px solid #2a241c;">
    <p class="mono">${escapeHtml(t.total)}</p>
    <p class="total">${formatDA(order.total)}</p>
  </div>

  <div class="seal">
    <div class="L">L</div>
    <p class="mono" style="margin-top:8px;">${escapeHtml(t.prepared)}</p>
    <p style="font-style:italic;color:#8a7d63;margin-top:16px;font-size:14px;">${escapeHtml(t.quote)}</p>
  </div>
  <script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
};
