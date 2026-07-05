// Exporte le roman (version canon 2026-07-03) en Markdown lisible sur le Bureau.
import fs from "fs";
import os from "os";
import path from "path";

const load = (p) => {
  const s = fs.readFileSync(p, "utf8");
  return eval(s.slice(s.indexOf("= [") + 2, s.lastIndexOf("]") + 1));
};

// Prologue (storyOpening dans storyUnlocks.ts) — extrait à la main pour rester simple.
const PROLOGUE = {
  fr: {
    title: "Ce qu'on n'a pas envoyé",
    body: [
      "Nahil avait écrit trois mots avant l'appel de l'hôpital. Je passe demain. Il n'avait pas envoyé le message. Le téléphone avait gardé la phrase avec cette douceur froide des objets qui ne savent pas ce qu'ils conservent.",
      "Depuis, tout commençait là : non dans un grand secret, mais dans un retard. Une phrase prête. Un geste repoussé. Une mère morte avant le lendemain.",
      "Le vêtement pouvait encore rester un vêtement. Il suffisait de ne pas toucher la ligne sous le col.",
    ],
  },
  en: {
    title: "What Was Not Sent",
    body: [
      "Nahil had written three words before the hospital called. I'll come tomorrow. He had not sent the message. The phone had kept the sentence with the cold gentleness of objects that do not know what they preserve.",
      "Everything began there: not in a great secret, but in a delay. A sentence ready. A gesture postponed. A mother dead before tomorrow.",
      "The garment could still remain a garment. All he had to do was not touch the line under the collar.",
    ],
  },
  ar: {
    title: "ما لم يُرسل",
    body: [
      "كتب ناهيل ثلاث كلمات قبل اتصال المستشفى: سأمرّ عليكِ غدًا. لم يرسل الرسالة. احتفظ الهاتف بالجملة ببرودة الأشياء التي لا تعرف ما تحفظه.",
      "من هناك بدأ كل شيء: لا من سر عظيم، بل من تأخير. جملة جاهزة. فعل مؤجل. أم ماتت قبل الغد.",
      "كان يمكن للثوب أن يبقى ثوبًا. كان يكفي ألا يلمس الخط تحت الياقة.",
    ],
  },
};

const META = {
  fr: {
    file: "LECLAT_LE_SEUIL_ROMAN_FR.md",
    title: "# L'ÉCLAT — Le Seuil\n\n*Roman littéraire contemporain à bord spéculatif discret.*",
    note: "> Note pour l'analyste : ce roman est conçu pour une lecture par paliers (30 segments séquentiels). Il ne nomme JAMAIS son propre dispositif fantastique — c'est un choix de construction : le monde se fait sentir par ses effets, jamais par ses noms. Le texte se lit aussi à rebours (chaque scène change de sens relue depuis la fin, sans contredire son premier sens).",
    prologueLabel: "## Prologue — ",
    src: "src/data/storySegments.ts",
  },
  en: {
    file: "LECLAT_THE_THRESHOLD_NOVEL_EN.md",
    title:
      "# L'ÉCLAT — The Threshold\n\n*Contemporary literary novel with a discreet speculative edge.*",
    note: "> Note for the analyst: this novel is built for tiered reading (30 sequential segments). It NEVER names its own fantastic apparatus — by design: the world is felt through its effects, never through its names. The text also reads backwards (each scene changes meaning when reread from the end, without contradicting its first meaning).",
    prologueLabel: "## Prologue — ",
    src: "src/data/storySegments.en.ts",
  },
  ar: {
    file: "LECLAT_AL_ATABA_RIWAYA_AR.md",
    title: "# ليكلا (L'ÉCLAT) — العتبة\n\n*رواية أدبية معاصرة ذات حافة تخييلية خفيّة.*",
    note: "> ملاحظة للمحلّل: بُنيت هذه الرواية لقراءةٍ متدرّجة (٣٠ مقطعًا متتابعًا). وهي لا تسمّي جهازها التخييلي أبدًا — عن قصد: العالم يُحَسّ بآثاره، لا بأسمائه.",
    prologueLabel: "## المدخل — ",
    src: "src/data/storySegments.ar.ts",
  },
};

// Bureau : gère la redirection OneDrive éventuelle.
const home = os.homedir();
const candidates = [
  path.join(home, "Desktop"),
  path.join(home, "OneDrive", "Desktop"),
  path.join(home, "OneDrive", "Bureau"),
];
const desktop = candidates.find((d) => fs.existsSync(d));
if (!desktop) throw new Error("Bureau introuvable: " + candidates.join(" | "));

for (const lang of ["fr", "en", "ar"]) {
  const m = META[lang];
  const segments = load(m.src);
  const parts = [m.title, "", m.note, "", "---", ""];
  parts.push(m.prologueLabel + PROLOGUE[lang].title, "");
  for (const p of PROLOGUE[lang].body) parts.push(p, "");
  parts.push("---", "");
  segments.forEach((seg, i) => {
    if (i > 0) parts.push("", "* * *", "");
    for (const p of seg) parts.push(p, "");
  });
  const out = path.join(desktop, m.file);
  fs.writeFileSync(out, parts.join("\n").normalize("NFC"), "utf8");
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log("OK", out, "(" + kb + " Ko,", segments.flat().length, "paragraphes)");
}
