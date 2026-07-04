// Ajoute le 3e volet « Les Noms » (PARTIE 4) au Compagnon de lecture.
import fs from "fs";

const p = "src/pages/CompagnonPage.tsx";
let s = fs.readFileSync(p, "utf8");
const R = (from, to, label) => {
  if (!s.includes(from)) throw new Error("INTROUVABLE: " + label);
  s = s.split(from).join(to);
  console.log("OK", label);
};

// 1) PART4_RE après PART3_RE
R(
  `const PART3_RE: Record<Lang, RegExp> = {
  fr: /^#\\s+PARTIE\\s+3\\b/m,
  en: /^#\\s+PART\\s+3\\b/m,
  ar: /^#\\s+الجزء الثالث\\b/m,
};`,
  `const PART3_RE: Record<Lang, RegExp> = {
  fr: /^#\\s+PARTIE\\s+3\\b/m,
  en: /^#\\s+PART\\s+3\\b/m,
  ar: /^#\\s+الجزء الثالث\\b/m,
};
const PART4_RE: Record<Lang, RegExp> = {
  fr: /^#\\s+PARTIE\\s+4\\b/m,
  en: /^#\\s+PART\\s+4\\b/m,
  ar: /^#\\s+الجزء الرابع\\b/m,
};`,
  "PART4_RE",
);

// 2) extractAnalyses → trois volets
R(
  `/** Découpe le markdown en deux analyses ; ignore la PARTIE 3 (ancien quiz). */
function extractAnalyses(raw: string, lang: Lang): { one: string; two: string } {
  const p1 = raw.search(PART1_RE[lang]);
  const p2 = raw.search(PART2_RE[lang]);
  const p3 = raw.search(PART3_RE[lang]);
  return {
    one: sliceAt(raw, p1, p2 >= 0 ? p2 : p3),
    two: p2 >= 0 ? sliceAt(raw, p2, p3) : "",
  };
}`,
  `/** Découpe le markdown en trois volets ; ignore la PARTIE 3 (ancien quiz). */
function extractAnalyses(raw: string, lang: Lang): { one: string; two: string; three: string } {
  const p1 = raw.search(PART1_RE[lang]);
  const p2 = raw.search(PART2_RE[lang]);
  const p3 = raw.search(PART3_RE[lang]);
  const p4 = raw.search(PART4_RE[lang]);
  return {
    one: sliceAt(raw, p1, p2 >= 0 ? p2 : p3),
    two: p2 >= 0 ? sliceAt(raw, p2, p3 >= 0 ? p3 : p4) : "",
    // La Révélation — le seul lieu de l'univers où les noms sont donnés.
    three: p4 >= 0 ? sliceAt(raw, p4, -1) : "",
  };
}`,
  "extractAnalyses",
);

// 3) copy — labels courts + 3e onglet
R(
  `analyseI: text("Analyse I — Architecture", "Analysis I — Architecture", "تحليل ١ — البنية"),
  analyseII: text("Analyse II — Symboles", "Analysis II — Symbols", "تحليل ٢ — الرموز"),`,
  `analyseI: text("I · Architecture", "I · Architecture", "١ · البنية"),
  analyseII: text("II · Symboles", "II · Symbols", "٢ · الرموز"),
  analyseIII: text("III · Les Noms", "III · The Names", "٣ · الأسماء"),`,
  "labels",
);
R(
  `"Deux analyses du roman — architecture, puis symboles. Réservées à qui a tout traversé.",
    "Two analyses of the novel — architecture, then symbols. For those who have crossed it all.",
    "تحليلان للرواية — البنية، ثمّ الرموز. لمن عبَرها كاملةً.",`,
  `"Trois volets — l'architecture, les symboles, puis les noms que le roman ne dit jamais.",
    "Three parts — the architecture, the symbols, then the names the novel never says.",
    "ثلاثة أقسام — البنية، الرموز، ثمّ الأسماء التي لا تقولها الرواية أبدًا.",`,
  "intro",
);

// 4) état, onglets, contenu actif
R(
  `const [tab, setTab] = useState<1 | 2>(1);`,
  `const [tab, setTab] = useState<1 | 2 | 3>(1);`,
  "state",
);
R(
  `const active = tab === 1 ? analyses.one : analyses.two;`,
  `const active = tab === 1 ? analyses.one : tab === 2 ? analyses.two : analyses.three;`,
  "active",
);
R(
  `<div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          {([1, 2] as const).map((n) => (`,
  `<div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((n) => (`,
  "grid",
);
R(
  `{tr(n === 1 ? copy.analyseI : copy.analyseII)}`,
  `{tr(n === 1 ? copy.analyseI : n === 2 ? copy.analyseII : copy.analyseIII)}`,
  "render label",
);

fs.writeFileSync(p, s.normalize("NFC"), "utf8");
console.log("CompagnonPage.tsx : 3e volet ajouté");
