// AUDIT TOTAL TRILINGUE — roman + quiz + cohérence Bible (2026-07-03)
import fs from "fs";

const load = (p) => {
  const s = fs.readFileSync(p, "utf8");
  return eval(s.slice(s.indexOf("= [") + 2, s.lastIndexOf("]") + 1));
};
const fr = load("src/data/storySegments.ts");
const en = load("src/data/storySegments.en.ts");
const ar = load("src/data/storySegments.ar.ts");
const F = fr.flat().join("\n"),
  E = en.flat().join("\n"),
  A = ar.flat().join("\n");
const count = (t, re) => (t.match(re) || []).length;
const issues = [];

// ── 1. STRUCTURE ─────────────────────────────────────────────────────────────
console.log("=== 1. STRUCTURE ===");
[
  ["FR", fr],
  ["EN", en],
  ["AR", ar],
].forEach(([L, d]) => {
  if (d.length !== 30) issues.push(`${L}: ${d.length} segments`);
  d.forEach((seg, i) => {
    if (!seg.length) issues.push(`${L} seg${i}: vide`);
    seg.forEach((p, j) => {
      if (typeof p !== "string" || !p.trim()) issues.push(`${L} [${i}.${j}]: paragraphe vide`);
    });
  });
});
console.log(
  "segments:",
  fr.length,
  en.length,
  ar.length,
  "| paragraphes:",
  fr.flat().length,
  en.flat().length,
  ar.flat().length,
);

// ── 2. PERSONNAGES (équilibre inter-langues) ────────────────────────────────
console.log("=== 2. PERSONNAGES ===");
const chars = [
  ["Nahil", /Nahil/g, /Nahil/g, /ناهيل/g],
  ["Lina", /Lina/g, /Lina/g, /لينة|لينا/g],
  ["Rezkia", /Rezkia/g, /Rezkia/g, /رزقية/g],
  ["Sira", /Sira/g, /Sira/g, /سيرا|سيرة/g],
  ["Kael", /Kael/g, /Kael/g, /كايل/g],
  ["Mariss", /Mariss/g, /Mariss/g, /ماريس/g],
  ["Cem", /Cem/g, /Cem/g, /جِم|Cem|تشم/g],
  ["Iyad", /Iyad/g, /Iyad/g, /إياد/g],
  ["Qars", /Qars/g, /Qars/g, /قارس/g],
];
for (const [name, rf, re2, ra] of chars) {
  const cf = count(F, rf),
    ce = count(E, re2),
    ca = count(A, ra);
  const max = Math.max(cf, ce, ca),
    min = Math.min(cf, ce, ca);
  const flag =
    name === "Iyad" ? cf !== 1 || ce !== 1 || ca !== 1 : max - min > Math.max(3, max * 0.25);
  console.log(`${name.padEnd(8)} FR:${cf} EN:${ce} AR:${ca}${flag ? "  ⚠️" : ""}`);
  if (flag) issues.push(`Personnage ${name}: déséquilibre FR:${cf}/EN:${ce}/AR:${ca}`);
}

// ── 3. MOTS INTERDITS (Bible §3.8.7 — jamais nommer le système) ─────────────
console.log("=== 3. INTERDITS DE MONDE ===");
const forbidden = [
  [
    "FR",
    F,
    [/\bVoile\b/g, /\bArchitecte/g, /\bÉclat\b/g, /\bTisserande/g, /\bVeilleuse\b/g, /\bVeilleur/g],
  ],
  ["EN", E, [/\bVeil\b/g, /\bArchitect/g, /\bWeaver\b/g, /\bWatcher\b/g]],
  ["AR", A, [/الحجاب/g, /المهندس/g, /النسّاجة/g]],
];
for (const [L, T, res] of forbidden) {
  for (const re of res) {
    const c = count(T, re);
    if (c > 0) {
      issues.push(`${L}: mot système "${re.source}" ×${c} dans le roman`);
      console.log(`⚠️ ${L} ${re.source} ×${c}`);
    }
  }
}
// Noms de fragments invisibles dans le texte (§2.1) — FR
for (const w of [
  "L'Éveil",
  "Le Souffle",
  "Le Prisme",
  "L'Atome",
  "L'Éclipse",
  "L'Horizon",
  "La Résonance",
  "L'Ascension",
  "L'Origine",
]) {
  const c = count(F, new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
  if (c > 0) {
    issues.push(`FR: nom de fragment "${w}" ×${c}`);
    console.log(`⚠️ fragment nommé: ${w} ×${c}`);
  }
}
console.log("interdits: contrôlés");

// ── 4. PHRASES INVIOLABLES (Bible tableau A + B) ─────────────────────────────
console.log("=== 4. PHRASES INVIOLABLES ===");
const inviolables = [
  // [label, attendu, FR, EN, AR] — attendu = occurrences exactes FR (EN/AR ≥1 sauf mention)
  [
    "A2 cousu pour quelqu'un",
    1,
    "cousu pour quelqu'un qui ne viendrait pas",
    "sewn for someone who would not come",
    "خاطت لشخصٍ لن يأتي",
  ],
  ["A3 col ne protégeait plus", 1, "col ne le protégeait plus de rien", "collar", "الياقة"],
  [
    "A4 le trou pas la pointe",
    1,
    "Le trou, avait-elle dit. Pas la pointe. Le trou.",
    'The hole," she had said. "Not the point. The hole.',
    "الثقب",
  ],
  ["A5 doit rester entier", 1, "doit rester entier", "must stay whole", "يبقى كاملًا"],
  ["A6 Il refusa (×1 — adaptation actée)", 1, "Il refusa.", "He refused.", "رفض."],
  [
    "A7 sert à autre chose",
    1,
    "Ça ne se referme pas. Ça sert à autre chose.",
    "It's for something else",
    "لا تنغلق",
  ],
  [
    "A8 pris du pain",
    1,
    "pris du pain, je reviens avant la pluie",
    "back before the rain",
    "أعود قبل المطر",
  ],
  ["A10 Va dormir", 1, "— Va dormir.", "Go and sleep.", "نَم"],
  ["B2 émail tient la fêlure", 1, "L'émail tient la fêlure.", "enamel holds the crack", "المينا"],
  ["B3 Nous avons le temps", 1, "Nous avons le temps.", "We have time", "لدينا وقت"],
  ["B7 habituée", 1, "Je suis habituée.", "I'm used to it", "تعوّدت"],
  ["B8 pièce fermée", 1, "pièce fermée", "closed room", "غرفةً مغلقة"],
];
for (const [label, exp, kf, ke, ka] of inviolables) {
  const cf = F.split(kf).length - 1,
    ce = E.split(ke).length - 1,
    ca = A.split(ka).length - 1;
  const bad = cf !== exp || ce < 1 || ca < 1;
  console.log(`${bad ? "⚠️" : "OK"} ${label.padEnd(28)} FR:${cf}/${exp} EN:${ce} AR:${ca}`);
  if (bad) issues.push(`Inviolable ${label}: FR:${cf} (attendu ${exp}) EN:${ce} AR:${ca}`);
}

// ── 5. QUIZ — chaque bonne réponse vérifiable ────────────────────────────────
console.log("=== 5. QUIZ ===");
const qsrc = fs.readFileSync("src/data/quizLeclat.ts", "utf8");
const QUIZ = eval(
  qsrc
    .slice(
      qsrc.indexOf("QUIZ_LECLAT: QuizQuestion[] = [") + 30,
      qsrc.indexOf("\n];", qsrc.indexOf("QUIZ_LECLAT")) + 2,
    )
    .replace(/^\]/, "["),
);
console.log("questions:", QUIZ.length);
const ids = new Set();
const flagged = [];
for (const q of QUIZ) {
  if (ids.has(q.id)) issues.push(`quiz id dupliqué: ${q.id}`);
  ids.add(q.id);
  if (!(q.answer >= 0 && q.answer <= 3) || q.options.length !== 4)
    issues.push(`quiz ${q.id}: structure`);
  if (!(q.fragment >= 1 && q.fragment <= 10) || ![1, 20, 40].includes(q.scan))
    issues.push(`quiz ${q.id}: fragment/scan`);
  for (const lang of ["fr", "en", "ar"]) {
    if (!q.q[lang] || !q.q[lang].trim()) issues.push(`quiz ${q.id}: question ${lang} vide`);
    q.options.forEach((o, i) => {
      if (!o[lang] || !o[lang].trim()) issues.push(`quiz ${q.id}: option ${i} ${lang} vide`);
    });
  }
  // La bonne réponse, si c'est une citation longue, doit exister dans le roman
  const good = q.options[q.answer];
  const strip = (s) => s.replace(/[«»""''*—…]/g, "").trim();
  for (const [lang, T] of [
    ["fr", F],
    ["en", E],
    ["ar", A],
  ]) {
    const g = strip(good[lang]);
    if (g.length >= 25 && !T.includes(g) && !T.replace(/[«»""''*—…]/g, "").includes(g)) {
      flagged.push(`${q.id} [${lang}] réponse non-verbatim: "${good[lang].slice(0, 60)}"`);
    }
  }
}
console.log("citations à contrôler manuellement:", flagged.length);
flagged.forEach((f) => console.log("  •", f));

// ── RÉSUMÉ ───────────────────────────────────────────────────────────────────
console.log("=== RÉSUMÉ ===");
if (!issues.length) console.log("✅ AUCUN PROBLÈME STRUCTUREL");
else {
  console.log(`⚠️ ${issues.length} problème(s):`);
  issues.forEach((i) => console.log("  -", i));
}
