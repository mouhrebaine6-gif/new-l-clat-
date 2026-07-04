// Dates de révélation des 5 fragments verrouillés.
// Calées sur les solstices et équinoxes pour une cohérence rituelle.
export const REVEAL_DATES: Record<string, string> = {
  eclipse: "2026-06-21T20:00:00Z", // solstice d'été
  horizon: "2026-09-22T20:00:00Z", // équinoxe d'automne
  resonance: "2026-10-31T20:00:00Z", // Samhain
  ascension: "2026-12-21T20:00:00Z", // solstice d'hiver
  origine: "2027-03-20T20:00:00Z", // équinoxe de printemps
};

export const REVEAL_LABELS: Record<string, string> = {
  eclipse: "Solstice d'été",
  horizon: "Équinoxe d'automne",
  resonance: "Nuit de Samhain",
  ascension: "Solstice d'hiver",
  origine: "Équinoxe de printemps",
};

const REVEAL_LABELS_I18N: Record<string, Localized<string>> = {
  eclipse: { fr: REVEAL_LABELS.eclipse, en: "Summer solstice", ar: "الانقلاب الصيفي" },
  horizon: { fr: REVEAL_LABELS.horizon, en: "Autumn equinox", ar: "الاعتدال الخريفي" },
  resonance: { fr: REVEAL_LABELS.resonance, en: "Samhain night", ar: "ليلة سامهاين" },
  ascension: { fr: REVEAL_LABELS.ascension, en: "Winter solstice", ar: "الانقلاب الشتوي" },
  origine: { fr: REVEAL_LABELS.origine, en: "Spring equinox", ar: "الاعتدال الربيعي" },
};

export const getRevealLabel = (fragmentId: string, lang: Lang) =>
  REVEAL_LABELS_I18N[fragmentId]?.[lang] || REVEAL_LABELS[fragmentId];

export const getCountdown = (iso?: string) => {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s, target, ended: diff === 0 };
};

const VEILLE_KEY = "eclat_veille_v1";
type VeilleEntry = { email: string; at: number };

export const joinVeille = (fragmentId: string, email: string) => {
  const cur = JSON.parse(localStorage.getItem(VEILLE_KEY) || "{}");
  cur[fragmentId] = { email, at: Date.now() } as VeilleEntry;
  localStorage.setItem(VEILLE_KEY, JSON.stringify(cur));
  window.dispatchEvent(new CustomEvent("veille:update"));
};

export const isInVeille = (fragmentId: string) => {
  try {
    const cur = JSON.parse(localStorage.getItem(VEILLE_KEY) || "{}");
    return Boolean(cur[fragmentId]);
  } catch {
    return false;
  }
};

export const getAllVeilles = (): Record<string, VeilleEntry> => {
  try {
    return JSON.parse(localStorage.getItem(VEILLE_KEY) || "{}");
  } catch {
    return {};
  }
};

export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
import type { Lang, Localized } from "@/lib/i18n";
