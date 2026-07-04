// Passe canon 2026-07-03 — quiz aligné sur la Bible restaurée.
// 1) f3s1-17 : la Veilleuse ne nomme plus Iyad → la question teste la périphrase.
// 2) +2 questions : Signal-Mariss (village) et « Là-bas, on tient tout entier ».
// 3) Correction terminologique AR dans le roman : حزوز → شقوق (mot du texte).
import fs from "fs";

// ── 3) roman AR : aligner le mot « entailles » ──────────────────────────────
const arPath = "src/data/storySegments.ar.ts";
let arSrc = fs.readFileSync(arPath, "utf8");
const before = arSrc.includes("مع الحزوز");
arSrc = arSrc.replace("بقي الاسم في الغرفة، مع الحزوز.", "بقي الاسم في الغرفة، مع الشقوق.");
fs.writeFileSync(arPath, arSrc.normalize("NFC"), "utf8");
console.log("AR حزوز→شقوق:", before ? "corrigé" : "déjà propre");

// ── 1+2) quiz ────────────────────────────────────────────────────────────────
const qPath = "src/data/quizLeclat.ts";
let src = fs.readFileSync(qPath, "utf8");

function mustReplace(from, to, label) {
  if (!src.includes(from)) throw new Error("INTROUVABLE: " + label);
  src = src.replace(from, to);
  console.log("OK", label);
}

// f3s1-17 — question
mustReplace(
  "Quel nom la vieille femme donne-t-elle au porteur qui a dormi là avant Nahil ?",
  "Comment la vieille femme désigne-t-elle celui qui a dormi là avant Nahil ?",
  "f3s1-17 q.fr",
);
mustReplace(
  "What name does the old woman give for the bearer who slept there before Nahil?",
  "How does the old woman refer to the one who slept there before Nahil?",
  "f3s1-17 q.en",
);
mustReplace(
  "أيّ اسمٍ تذكره العجوز للحامل الذي نام هناك قبل ناهيل؟",
  "كيف تشير العجوز إلى مَن نام هناك قبل ناهيل؟",
  "f3s1-17 q.ar",
);
// f3s1-17 — options (bloc unique : Kael/Cem/Iyad/Mariss dans cet ordre)
mustReplace(
  `      { fr: "Kael", en: "Kael", ar: "كايل" },
      { fr: "Cem", en: "Cem", ar: "Cem" },
      { fr: "Iyad", en: "Iyad", ar: "إياد" },
      { fr: "Mariss", en: "Mariss", ar: "ماريس" },`,
  `      { fr: "Un apprenti", en: "An apprentice", ar: "متدرّب" },
      { fr: "Un voyageur", en: "A traveler", ar: "مسافر" },
      { fr: "Un porteur", en: "A bearer", ar: "حامل" },
      { fr: "Son fils", en: "Her son", ar: "ابنها" },`,
  "f3s1-17 options",
);

// Nouvelles questions — insérées avant la fermeture de QUIZ_LECLAT
const NEW_QUESTIONS = `  {
    id: "f2s40-81",
    fragment: 2,
    scan: 40,
    answer: 1,
    q: {
      fr: "Au village de l'adresse, que reste-t-il du mot peint sur le linteau de la porte trop basse ?",
      en: "In the village from the address, what remains of the word painted on the lintel of the too-low door?",
      ar: "في قرية العنوان، ماذا بقي من الكلمة المطليّة على عتبة الباب الأخفض؟",
    },
    options: [
      { fr: "Il a été repeint de frais", en: "It has been freshly repainted", ar: "أُعيد طلاؤها حديثًا" },
      {
        fr: "*suffi* — le reste s'est effacé",
        en: "*enou* — the rest has worn away",
        ar: "«كافٍ» — وقد امّحى نصفها",
      },
      { fr: "Le nom d'un porteur", en: "A bearer's name", ar: "اسم حامل" },
      { fr: "Trois entailles", en: "Three notches", ar: "ثلاثة شقوق" },
    ],
  },
  {
    id: "f5s1-82",
    fragment: 5,
    scan: 1,
    answer: 3,
    q: {
      fr: "À l'enclave, que dit-on de « là-bas » ?",
      en: "At the enclave, what do people say about “down there”?",
      ar: "قرب النبع، ماذا يُقال عن «هناك»؟",
    },
    options: [
      { fr: "On y dort enfin", en: "You finally sleep there", ar: "هناك ينام المرء أخيرًا" },
      { fr: "On y écrit tout", en: "Everything is written there", ar: "هناك يُكتب كلّ شيء" },
      { fr: "On n'en revient jamais", en: "No one comes back", ar: "لا يعود منها أحد" },
      {
        fr: "« Là-bas, on tient tout entier »",
        en: "“Down there, you hold whole”",
        ar: "«هناك، يتماسك المرءُ كاملًا»",
      },
    ],
  },
];
`;
const closeIdx = src.indexOf("\n];", src.indexOf("export const QUIZ_LECLAT"));
if (closeIdx < 0) throw new Error("fermeture QUIZ_LECLAT introuvable");
src = src.slice(0, closeIdx + 1) + NEW_QUESTIONS + src.slice(closeIdx + 4);
fs.writeFileSync(qPath, src.normalize("NFC"), "utf8");
console.log("OK +2 questions (f2s40-81, f5s1-82)");
