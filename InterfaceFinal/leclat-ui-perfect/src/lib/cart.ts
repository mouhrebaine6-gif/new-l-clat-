import { useEffect, useState, useCallback } from "react";
import type { Lang, Localized } from "@/lib/i18n";

export type CartLine = {
  id: string;
  fragmentId: string;
  size: string;
  qty: number;
  price: number;
  name: string;
  image: string;
  colorLabel?: string;
};

const KEY = "eclat_cart_v1";

const read = (): CartLine[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
};

const write = (lines: CartLine[]) => {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("cart:update"));
};

export const useCart = () => {
  const [lines, setLines] = useState<CartLine[]>(() => read());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setLines(read());
    window.addEventListener("cart:update", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("cart:update", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const add = useCallback((line: Omit<CartLine, "id" | "qty"> & { qty?: number }) => {
    const cur = read();
    const id = `${line.fragmentId}-${line.size}`;
    const existing = cur.find((l) => l.id === id);
    let next: CartLine[];
    if (existing) {
      next = cur.map((l) => (l.id === id ? { ...l, qty: l.qty + (line.qty ?? 1) } : l));
    } else {
      next = [...cur, { ...line, id, qty: line.qty ?? 1 }];
    }
    write(next);
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => write(read().filter((l) => l.id !== id)), []);
  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) return write(read().filter((l) => l.id !== id));
    write(read().map((l) => (l.id === id ? { ...l, qty } : l)));
  }, []);
  const clear = useCallback(() => write([]), []);

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return { lines, subtotal, count, add, remove, updateQty, clear, open, setOpen };
};

export const formatDA = (n: number) => `${n.toLocaleString("fr-FR")} DA`;

// === Orders & tracking ===

export type OrderStatus = "transmise" | "preparee" | "remise" | "en_route" | "livree";

export type Order = {
  ref: string;
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  address: { fullname: string; phone: string; wilaya: string; commune: string; adresse: string };
  delivery: "domicile" | "stop-desk";
  payment: "cod" | "ccp" | "edahabia";
  createdAt: number;
  status: OrderStatus;
};

const ORDERS_KEY = "eclat_orders_v1";

const readOrders = (): Order[] => {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
};
const writeOrders = (o: Order[]) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(o));
  window.dispatchEvent(new CustomEvent("orders:update"));
};

export const saveOrder = (o: Order) => {
  const all = readOrders();
  writeOrders([{ ...o, status: o.status || "transmise" }, ...all]);
  // backwards-compat: dernière commande
  localStorage.setItem("eclat_last_order_v1", JSON.stringify(o));
};

export const getLastOrder = (): Order | null => {
  try {
    const list = readOrders();
    if (list.length) return list[0];
    const r = localStorage.getItem("eclat_last_order_v1");
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
};

export const getAllOrders = (): Order[] => readOrders();
export const getOrderByRef = (ref: string): Order | null =>
  readOrders().find((o) => o.ref === ref) || null;

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>(() => readOrders());
  useEffect(() => {
    const h = () => setOrders(readOrders());
    window.addEventListener("orders:update", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("orders:update", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return orders;
};

// Statut simulé en fonction du temps écoulé depuis la commande (démo).
export const computeOrderStatus = (createdAt: number): { status: OrderStatus; step: number } => {
  const hours = (Date.now() - createdAt) / 3_600_000;
  if (hours < 2) return { status: "transmise", step: 0 };
  if (hours < 12) return { status: "preparee", step: 1 };
  if (hours < 36) return { status: "remise", step: 2 };
  if (hours < 72) return { status: "en_route", step: 3 };
  return { status: "livree", step: 4 };
};

export const STATUS_LABELS: Record<OrderStatus, { label: string; subtitle: string }> = {
  transmise: { label: "Commande transmise", subtitle: "L'atelier a reçu votre demande" },
  preparee: { label: "Pièce préparée", subtitle: "Le tissu est plié, le sceau apposé" },
  remise: { label: "Remis au transporteur", subtitle: "Confié au messager Yalidine" },
  en_route: { label: "En route", subtitle: "La pièce traverse la wilaya" },
  livree: { label: "Livré au porteur", subtitle: "Le rituel est achevé" },
};

const STATUS_LABELS_I18N: Record<OrderStatus, Localized<{ label: string; subtitle: string }>> = {
  transmise: {
    fr: STATUS_LABELS.transmise,
    en: { label: "Order sent", subtitle: "The atelier has received your request" },
    ar: { label: "تم إرسال الطلب", subtitle: "استلم المشغل طلبك" },
  },
  preparee: {
    fr: STATUS_LABELS.preparee,
    en: { label: "Piece prepared", subtitle: "The fabric is folded, the seal applied" },
    ar: { label: "تم تجهيز القطعة", subtitle: "طُوي القماش ووُضع الختم" },
  },
  remise: {
    fr: STATUS_LABELS.remise,
    en: { label: "Handed to carrier", subtitle: "Entrusted to the Yalidine messenger" },
    ar: { label: "سُلّمت إلى الناقل", subtitle: "أُودعت عند رسول ياليدين" },
  },
  en_route: {
    fr: STATUS_LABELS.en_route,
    en: { label: "On the way", subtitle: "The piece is crossing the wilaya" },
    ar: { label: "في الطريق", subtitle: "القطعة تعبر الولاية" },
  },
  livree: {
    fr: STATUS_LABELS.livree,
    en: { label: "Delivered to bearer", subtitle: "The ritual is complete" },
    ar: { label: "سُلّمت إلى الحامل", subtitle: "اكتمل الطقس" },
  },
};

export const getStatusLabel = (status: OrderStatus, lang: Lang) => STATUS_LABELS_I18N[status][lang];

export const generateOrderRef = () => {
  const n = Math.floor(Math.random() * 9000 + 1000);
  return `CMD-MMXXVI-${n}`;
};
