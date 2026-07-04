// Passe canon 2026-07-03 — restauration Bible « L'Éclat — Le Seuil »
// P1: phrase inviolable n°2 (découverte du t-shirt)
// P2: Signal-Mariss au village-seuil (porte basse + mot à demi effacé) [Bible §3.4.0 FERME]
// P3: règle absolue Iyad — la Veilleuse ne nomme pas (périphrase) [Bible §0.2]
// P4: « Là-bas, on tient tout entier » (parole d'enclave) [Bible §3.8.5]
// P5: l'oubli post-Mariss (détail que Nahil ne retrouve pas) [Bible §3.4.3]
import fs from "fs";

const FILES = {
  fr: "src/data/storySegments.ts",
  en: "src/data/storySegments.en.ts",
  ar: "src/data/storySegments.ar.ts",
};

function load(path) {
  const src = fs.readFileSync(path, "utf8");
  const header = src.slice(0, src.indexOf("export const"));
  const name = src.match(/export const (\w+)/)[1];
  const data = eval(src.slice(src.indexOf("= [") + 2, src.lastIndexOf("]") + 1));
  return { header, name, data };
}

// Localise l'unique paragraphe contenant `key` (dans tout le livre) → [seg, idx]
function locate(data, key, label) {
  const hits = [];
  data.forEach((seg, i) =>
    seg.forEach((p, j) => {
      if (p.includes(key)) hits.push([i, j]);
    }),
  );
  if (hits.length !== 1)
    throw new Error(`ANCRE ${label} : ${hits.length} occurrence(s) pour "${key}"`);
  return hits[0];
}

function insertAfter(data, key, label, paras) {
  const [i, j] = locate(data, key, label);
  data[i].splice(j + 1, 0, ...paras);
  return `${label} -> seg ${i} après ¶${j} (+${paras.length})`;
}

function replaceExact(data, key, label, next) {
  const [i, j] = locate(data, key, label);
  data[i][j] = next;
  return `${label} -> seg ${i} ¶${j} remplacé`;
}

const fr = load(FILES.fr),
  en = load(FILES.en),
  ar = load(FILES.ar);
const log = [];

// ── Pré-vérification : le mot peint à Qars, par langue ─────────────────────
const wall = (d, k) => d.data.flat().find((p) => p.includes(k)) || "(absent)";
console.log("MUR QARS FR:", wall(fr, "*suffisant*").slice(0, 90));
console.log("MUR QARS EN:", wall(en, "painted on a stretch").slice(0, 120));
const enWall = en.data.flat().find((p) => /\*\w+\*/.test(p) && p.toLowerCase().includes("enough"));
console.log("MUR QARS EN (mot):", enWall ? enWall.slice(0, 100) : "(enough non trouvé — vérifier)");
const arWall = ar.data.flat().find((p) => p.includes("كاف"));
console.log("MUR QARS AR:", arWall ? arWall.slice(0, 110) : "(كاف non trouvé — vérifier)");

// ── P1 — Inviolable n°2 ─────────────────────────────────────────────────────
log.push(
  insertAfter(fr.data, "La taille était la sienne.", "P1.fr", [
    "Elle avait cousu pour quelqu'un qui ne viendrait pas.",
  ]),
);
log.push(
  insertAfter(en.data, "The size was his.", "P1.en", [
    "She had sewn for someone who would not come.",
  ]),
);
log.push(insertAfter(ar.data, "كان المقاس مقاسه.", "P1.ar", ["كانت قد خاطت لشخصٍ لن يأتي."]));

// ── P2 — Signal-Mariss au village-seuil ─────────────────────────────────────
log.push(
  insertAfter(fr.data, "Un chien le regarda passer sans estimer nécessaire d'aboyer.", "P2.fr", [
    "Au milieu de la pente, une porte était plus basse que les autres, comme bâtie pour un corps déjà courbé. Sur le linteau, un mot avait été peint puis laissé au temps : *suffi* — le reste s'était effacé. Personne ne l'avait repeint. Le soir posait sur la rue une lumière égale, sans ombre nette. Nahil passa devant sans s'arrêter.",
  ]),
);
log.push(
  insertAfter(en.data, "Evening was coming when he reached the village of the address", "P2.en", [
    "Halfway up the slope, one door was lower than the others, as if built for a body already bent. On the lintel a word had been painted, then left to the weather: *enou* — the rest had worn away. No one had repainted it. The evening laid an even light on the street, without one clean shadow. Nahil walked past without stopping.",
  ]),
);
log.push(
  insertAfter(ar.data, "كان المساء يأتي حين بلغ قرية العنوان", "P2.ar", [
    "في منتصف المنحدر، كان بابٌ أخفض من غيره، كأنّه بُني لجسدٍ منحنٍ سلفًا. على العتبة كُتبت كلمةٌ بالطلاء ثمّ تُركت للزمن: «كافٍ» — وقد امّحى نصفها. لم يُعِد أحدٌ طلاءها. كان المساء يضع على الشارع ضوءًا متساويًا، بلا ظلٍّ حادّ. مرّ ناهيل من أمامه دون أن يتوقّف.",
  ]),
);

// ── P3 — Règle absolue Iyad (périphrase de la Veilleuse) ────────────────────
log.push(replaceExact(fr.data, "— Un porteur. Iyad.", "P3.fr", "— Un porteur."));
log.push(
  insertAfter(fr.data, "Elle lui rendit le cercle.", "P3b.fr", [
    "Elle n'avait pas dit de nom. Le nom resta dans la chambre, avec les entailles.",
  ]),
);
log.push(replaceExact(en.data, '"A bearer. Iyad."', "P3.en", '"A bearer."'));
log.push(
  insertAfter(en.data, "She handed the hoop back to him.", "P3b.en", [
    "She had given no name. The name stayed in the room, with the notches.",
  ]),
);
log.push(replaceExact(ar.data, "«حامل. إياد.»", "P3.ar", "«حامل.»"));
log.push(
  insertAfter(ar.data, "أعادت إليه الحلقة.", "P3b.ar", [
    "لم تقل اسمًا. بقي الاسم في الغرفة، مع الحزوز.",
  ]),
);

// ── P4 — « Là-bas, on tient tout entier » ───────────────────────────────────
log.push(
  insertAfter(fr.data, "Ce qui est su ne se garde pas.", "P4.fr", [
    "— Là-bas, on tient tout entier, dit l'homme. C'est ce qu'on dit.",
    "Il le dit sans y mettre de poids, comme une phrase qui avait déjà beaucoup servi.",
    "— Ceux qui le disent n'y sont pas allés, dit la femme au bandeau.",
  ]),
);
log.push(
  insertAfter(en.data, "Down there, you don't write anymore", "P4.en", [
    '"Down there, you hold whole," the man said. "That\'s what people say."',
    "He said it without weight, like a sentence that had already served many times.",
    '"The ones who say it have never been," said the woman with the headband.',
  ]),
);
log.push(
  insertAfter(ar.data, "وما يُعرَف لا يُحفَظ", "P4.ar", [
    "«هناك، يتماسك المرءُ كاملًا»، قال الرجل. «هكذا يُقال.»",
    "قالها بلا ثقلٍ، كجملةٍ خدمت كثيرًا من قبل.",
    "«الذين يقولونها لم يذهبوا»، قالت صاحبة العصابة.",
  ]),
);

// ── P5 — L'oubli post-Mariss ────────────────────────────────────────────────
log.push(
  insertAfter(fr.data, "le remit dans le sac, contre le cahier, à côté du fil noir", "P5.fr", [
    "À Qars, sur la place, il avait entendu un mot qu'il voulait garder — il l'avait répété deux fois en marchant, pour qu'il tienne. Le mot n'était plus là. Il chercha autour, comme on cherche un objet. Il ne trouva que la place du mot.",
  ]),
);
log.push(
  insertAfter(en.data, "He folded it back along its creases", "P5.en", [
    "In Qars, on the square, he had heard a word he wanted to keep — he had repeated it twice as he walked, so it would hold. The word was no longer there. He searched around it the way you search for an object. He found only the place where the word had been.",
  ]),
);
log.push(
  insertAfter(ar.data, "طواها على ثنياتها", "P5.ar", [
    "في قارس، في الساحة، سمع كلمةً أراد أن يحتفظ بها — كرّرها مرّتين وهو يمشي كي تثبت. لم تعد الكلمة هناك. بحث حولها كما يُبحث عن شيء. لم يجد إلا مكانَ الكلمة.",
  ]),
);

// ── Sérialisation ────────────────────────────────────────────────────────────
const CANON_NOTE =
  "// Passe canon 2026-07-03 : Bible restaurée — inviolable n°2, Signal-Mariss au village-seuil,\n" +
  "// périphrase Iyad (nom unique à l'Épilogue), « Là-bas, on tient tout entier », oubli post-Mariss.\n";

function save(file, { header, name, data }, isAr) {
  const norm = (p) => (isAr ? p.normalize("NFC") : p);
  const body = data
    .map(
      (seg) =>
        "  [\n" + seg.map((p) => "    " + JSON.stringify(norm(p)) + ",").join("\n") + "\n  ],",
    )
    .join("\n");
  fs.writeFileSync(
    file,
    header + CANON_NOTE + `export const ${name}: string[][] = [\n` + body + "\n];\n",
    "utf8",
  );
}
save(FILES.fr, fr, false);
save(FILES.en, en, false);
save(FILES.ar, ar, true);

log.forEach((l) => console.log("OK", l));
console.log("Paragraphes/segment après patch — FR:", fr.data.map((s) => s.length).join(","));
console.log("EN:", en.data.map((s) => s.length).join(","));
console.log("AR:", ar.data.map((s) => s.length).join(","));
