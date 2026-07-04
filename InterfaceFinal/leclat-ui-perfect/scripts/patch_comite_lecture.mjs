// Corrections issues de la fiche de lecture (2026-07-03) — 4 fautes objectives :
// F1 : couper l'explication du rite au climax (le texte commentait son propre symbole)
// F2 : restaurer le climax amputé en EN/AR (« Il resta. » / le Non / le vent / « Il ne se retourna pas. »)
// F3 : rétroporter l'ouverture enrichie FR (trace du rideau, scotch jauni) vers EN/AR
// F4 : lever le point de calage Cem/Iyad (« trois lettres » juste après un nom de quatre)
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
function locate(data, seg, pred, label) {
  const hits = data[seg].map((p, j) => [p, j]).filter(([p]) => pred(p));
  if (hits.length !== 1) throw new Error(`${label}: ${hits.length} occurrence(s)`);
  return hits[0][1];
}

const fr = load(FILES.fr), en = load(FILES.en), ar = load(FILES.ar);
const log = [];

// ── F1 — couper l'explication du rite (fin de paragraphe, 3 langues) ────────
for (const [L, d, cut] of [
  ["fr", fr, " Le troisième temps du rite, accompli par quelqu'un d'autre. Pour lui."],
  ["en", en, " The third beat of the rite, performed by someone else. For him."],
  ["ar", ar, " الموقّتُ الثالث من الطقس، أتمّه شخصٌ آخر. لأجله."],
]) {
  const j = locate(d.data, 18, (p) => p.includes(cut.trim()), `F1.${L}`);
  d.data[18][j] = d.data[18][j].replace(cut, "");
  if (d.data[18][j].includes(cut.trim())) throw new Error(`F1.${L} résidu`);
  log.push(`F1.${L} [18.${j}] explication coupée`);
}

// ── F2 — restaurer le climax EN/AR (insérer avant « He refused. » / « رفض. ») ─
{
  const j = locate(en.data, 18, (p) => p === "He refused.", "F2.en");
  en.data[18].splice(j, 0,
    "He stayed.",
    "He said in a low voice, to the empty air, to the voice that was not quite his mother's: No.",
    "The wind dropped for a moment. Not long. Long enough for him to hear a sound behind him, at the height of his shoulder blade, like a thread snapping in the silence.",
    "He didn't turn around.",
  );
  log.push(`F2.en climax restauré (+4 ¶ avant [18.${j}])`);
}
{
  const j = locate(ar.data, 18, (p) => p === "رفض.", "F2.ar");
  ar.data[18].splice(j, 0,
    "بقي.",
    "قال بصوتٍ خفيض، للهواء الفارغ، للصوت الذي لم يكن تمامًا صوتَ أمّه: لا.",
    "سقطت الريح لحظةً. ليس طويلًا. بما يكفي ليسمع خلفه صوتًا، على ارتفاع لوح كتفه، كخيطٍ ينقطع في الصمت.",
    "لم يلتفت.",
  );
  log.push(`F2.ar climax restauré (+4 ¶ avant [18.${j}])`);
}

// ── F3 — ouverture enrichie EN/AR (remplacement complet du ¶ [0.1]) ─────────
{
  const j = locate(en.data, 0, (p) => p.startsWith("The city was still blue."), "F3.en");
  en.data[0][j] =
    "The city was still blue. The shop windows gave back faceless rectangles — but one of them, on his left, had kept the trace of a metal shutter raised every morning, and the trace stopped at the exact halfway mark, like a breath cut short. The metal shutter rose in jerks, heavier through the second half. On the glass of the door a note was taped from the inside: *Closed for family reasons.* The writing leaned left, held back. Lina's. He peeled the note off, folded it in two, kept it in his hand. He saw, as he folded it, that the tape had yellowed at the edges. His mother would have replaced it. She would have taped a new note to the glass, in careful lettering, and left this one underneath, readable for whoever turned back the corner.";
  log.push(`F3.en ouverture enrichie [0.${j}]`);
}
{
  const j = locate(ar.data, 0, (p) => p.startsWith("كانت المدينة لا تزال زرقاء."), "F3.ar");
  ar.data[0][j] =
    "كانت المدينة لا تزال زرقاء. تردّ الواجهاتُ مستطيلاتٍ بلا وجوه — لكنّ واحدةً منها، على يساره، احتفظت بأثر بابِ حديدٍ يُرفَع كلّ صباح، وكان الأثر يتوقّف عند المنتصف تمامًا، كنفَسٍ مقطوع. ارتفع بابُ الحديد على دفعات، أثقلَ في نصفه الثاني. على زجاج الباب ورقةٌ مُلصقةٌ من الداخل: *مغلق لأسبابٍ عائليّة.* كان الخطّ يميل إلى اليسار، مكبوحًا. خطّ لينا. نزع الورقة، طواها نصفين، وأبقاها في يده. ورأى، وهو يطويها، أنّ الشريط اللاصق قد اصفرّ عند الحواف. كانت أمّه ستستبدله. كانت ستُلصق على الزجاج ورقةً جديدة، بخطٍّ مُتقَن، وتترك هذه تحتها، مقروءةً لمن يقلب الطرف.";
  log.push(`F3.ar ouverture enrichie [0.${j}]`);
}

// ── F4 — Cem/Iyad : lever le calage sans expliquer ───────────────────────────
for (const [L, d, tail, add] of [
  ["fr", fr, "la pince courte aux trois lettres gravées resta dans le noir.", " Un autre nom. Une autre perte."],
  ["en", en, "the short pliers with the three scratched letters stayed in the dark.", " Another name. Another loss."],
  ["ar", ar, "بقيت الكمّاشة القصيرة بأحرفها الثلاثة المحفورة في السواد.", " اسمٌ آخر. خسارةٌ أخرى."],
]) {
  const j = locate(d.data, 29, (p) => p.includes(tail), `F4.${L}`);
  d.data[29][j] = d.data[29][j] + add;
  log.push(`F4.${L} [29.${j}] différenciation ajoutée`);
}

// ── Sérialisation ─────────────────────────────────────────────────────────────
const NOTE =
  "// Corrections comité de lecture 2026-07-03 : explication du rite coupée, climax EN/AR restauré,\n" +
  "// ouverture enrichie rétroportée EN/AR, différenciation Cem/Iyad.\n";
function save(file, { header, name, data }, isAr) {
  const norm = (p) => (isAr ? p.normalize("NFC") : p);
  const body = data
    .map((seg) => "  [\n" + seg.map((p) => "    " + JSON.stringify(norm(p)) + ",").join("\n") + "\n  ],")
    .join("\n");
  fs.writeFileSync(file, header + NOTE + `export const ${name}: string[][] = [\n` + body + "\n];\n", "utf8");
}
save(FILES.fr, fr, false);
save(FILES.en, en, false);
save(FILES.ar, ar, true);
log.forEach((l) => console.log("OK", l));
console.log("Paragraphes seg18 — FR:", fr.data[18].length, "EN:", en.data[18].length, "AR:", ar.data[18].length);
