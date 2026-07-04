import { text, type Localized } from "@/lib/i18n";
import type { StorySegmentsByLang } from "@/lib/storyContentApi";

export const STORY_THRESHOLDS = [1, 20, 40] as const;
export type StoryThreshold = (typeof STORY_THRESHOLDS)[number];

export type StoryTier = {
  threshold: StoryThreshold;
  label: Localized<string>;
  title: Localized<string>;
  body: Localized<string[]>;
};

export type FragmentStory = {
  fragmentId: string;
  role: Localized<string>;
  tiers: StoryTier[];
};

/**
 * Le roman « L'Éclat — Le Seuil » est divisé en 30 segments séquentiels
 * (10 fragments × 3 paliers : scan 1 / 20 / 40), dans l'ordre de lecture.
 * Le Prologue ci-dessous ouvre l'ensemble ; Éveil·I reprend au début du Livre I,
 * et la lecture se poursuit jusqu'à Origine·III (épilogue).
 *
 * Le texte FR vient de ROMAN_COMPLET.txt (voir storySegments.ts, auto-généré).
 * EN = traduction littéraire complète (storySegments.en.ts, 30 segments alignés sur le FR).
 * AR = passe ciblée par segment ; repli sur le FR si un segment manque.
 */
export const storyOpening = {
  label: text("Ouvert", "Open", "مفتوح"),
  title: text("Ce qu'on n'a pas envoyé", "What Was Not Sent", "ما لم يُرسل"),
  body: text(
    [
      "Nahil avait écrit trois mots avant l'appel de l'hôpital. Je passe demain. Il n'avait pas envoyé le message. Le téléphone avait gardé la phrase avec cette douceur froide des objets qui ne savent pas ce qu'ils conservent.",
      "Depuis, tout commençait là : non dans un grand secret, mais dans un retard. Une phrase prête. Un geste repoussé. Une mère morte avant le lendemain.",
      "Le vêtement pouvait encore rester un vêtement. Il suffisait de ne pas toucher la ligne sous le col.",
    ],
    [
      "Nahil had written three words before the hospital called. I'll come tomorrow. He had not sent the message. The phone had kept the sentence with the cold gentleness of objects that do not know what they preserve.",
      "Everything began there: not in a great secret, but in a delay. A sentence ready. A gesture postponed. A mother dead before tomorrow.",
      "The garment could still remain a garment. All he had to do was not touch the line under the collar.",
    ],
    [
      "كتب ناهيل ثلاث كلمات قبل اتصال المستشفى: سأمرّ عليكِ غدًا. لم يرسل الرسالة. احتفظ الهاتف بالجملة ببرودة الأشياء التي لا تعرف ما تحفظه.",
      "من هناك بدأ كل شيء: لا من سر عظيم، بل من تأخير. جملة جاهزة. فعل مؤجل. أم ماتت قبل الغد.",
      "كان يمكن للثوب أن يبقى ثوبًا. كان يكفي ألا يلمس الخط تحت الياقة.",
    ],
  ),
};

type FragMeta = {
  id: string;
  name: [string, string, string];
  role: [string, string, string];
};

const FRAGMENTS: FragMeta[] = [
  {
    id: "eveil",
    name: ["Éveil", "Awakening", "اليقظة"],
    role: [
      "Fragment I — le roman s'éveille.",
      "Fragment I — the novel awakens.",
      "الشذرة الأولى — الرواية تستيقظ.",
    ],
  },
  {
    id: "souffle",
    name: ["Souffle", "Breath", "النَّفَس"],
    role: [
      "Fragment II — apprendre le tempo.",
      "Fragment II — learning the tempo.",
      "الشذرة الثانية — تعلّم الإيقاع.",
    ],
  },
  {
    id: "forge",
    name: ["Forge", "Forge", "المَسبَك"],
    role: [
      "Fragment III — la main qui façonne.",
      "Fragment III — the shaping hand.",
      "الشذرة الثالثة — اليد التي تصوغ.",
    ],
  },
  {
    id: "prisme",
    name: ["Prisme", "Prism", "المنشور"],
    role: [
      "Fragment IV — voir à travers.",
      "Fragment IV — seeing through.",
      "الشذرة الرابعة — أن ترى من خلال.",
    ],
  },
  {
    id: "atome",
    name: ["Atome", "Atom", "الذرّة"],
    role: [
      "Fragment V — l'infime qui tient tout.",
      "Fragment V — the tiny that holds all.",
      "الشذرة الخامسة — الضئيل الذي يحمل كل شيء.",
    ],
  },
  {
    id: "eclipse",
    name: ["Éclipse", "Eclipse", "الكسوف"],
    role: [
      "Fragment VI — l'ombre nécessaire.",
      "Fragment VI — the necessary shadow.",
      "الشذرة السادسة — الظل الضروري.",
    ],
  },
  {
    id: "horizon",
    name: ["Horizon", "Horizon", "الأفق"],
    role: [
      "Fragment VII — ce qui se réduit, ce qui s'ouvre.",
      "Fragment VII — what narrows, what opens.",
      "الشذرة السابعة — ما يضيق وما ينفتح.",
    ],
  },
  {
    id: "resonance",
    name: ["Résonance", "Resonance", "الرنين"],
    role: [
      "Fragment VIII — la couture qui répond.",
      "Fragment VIII — the seam that answers.",
      "الشذرة الثامنة — الدرز الذي يجيب.",
    ],
  },
  {
    id: "ascension",
    name: ["Ascension", "Ascension", "الصعود"],
    role: [
      "Fragment IX — refermer, ou non.",
      "Fragment IX — to close, or not.",
      "الشذرة التاسعة — أن تُغلق، أو لا.",
    ],
  },
  {
    id: "origine",
    name: ["Origine", "Origin", "الأصل"],
    role: [
      "Fragment X — la transmission.",
      "Fragment X — the transmission.",
      "الشذرة العاشرة — التسليم.",
    ],
  },
];

const ROMAN = ["I", "II", "III"] as const;

function tierLabel(threshold: StoryThreshold): Localized<string> {
  if (threshold === 1) return text("1 scan", "1 scan", "مسح واحد");
  if (threshold === 20) return text("Palier 20", "Tier 20", "العتبة ٢٠");
  return text("Palier 40", "Tier 40", "العتبة ٤٠");
}

export const TOTAL_FRAGMENTS = FRAGMENTS.length;

/**
 * Construit la liste des paliers narratifs à partir des segments chargés
 * depuis Supabase (voir src/lib/storyContentApi.ts). Le texte du roman n'est
 * plus importé statiquement ici : ~470 Ko de FR/EN/AR sortaient sinon du
 * bundle initial de la page Histoire.
 */
export function buildFragmentStoryUnlocks(segments: StorySegmentsByLang): FragmentStory[] {
  return FRAGMENTS.map((fragment, fragmentIndex) => ({
    fragmentId: fragment.id,
    role: text(fragment.role[0], fragment.role[1], fragment.role[2]),
    tiers: STORY_THRESHOLDS.map((threshold, tierIndex) => {
      const i = fragmentIndex * 3 + tierIndex;
      const fr = segments.fr[i] ?? [];
      return {
        threshold,
        label: tierLabel(threshold),
        title: text(
          `${fragment.name[0]} · ${ROMAN[tierIndex]}`,
          `${fragment.name[1]} · ${ROMAN[tierIndex]}`,
          `${fragment.name[2]} · ${ROMAN[tierIndex]}`,
        ),
        // FR = roman réel ; EN = traduction complète ; AR = traduction par segment (repli FR si manquant).
        body: text(fr, segments.en[i] ?? fr, segments.ar[i] ?? fr),
      };
    }),
  }));
}
