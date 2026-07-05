import { type Lang } from "@/lib/i18n";
import { DEMO_MAX } from "@/lib/demoMax";
import eveilFlat from "@/assets/tshirts/eveil-flat.jpg";
import eveilDetail from "@/assets/tshirts/eveil-detail.jpg";
import eveilWorn from "@/assets/tshirts/eveil-worn.jpg";
import souffleFlat from "@/assets/tshirts/souffle-flat.jpg";
import souffleDetail from "@/assets/tshirts/souffle-detail.webp";
import souffleWorn from "@/assets/tshirts/souffle-worn.jpg";
import forgeFlat from "@/assets/tshirts/forge-flat.jpg";
import forgeDetail from "@/assets/tshirts/forge-detail.jpg";
import forgeWorn from "@/assets/tshirts/forge-worn.jpg";
import prismeFlat from "@/assets/tshirts/prisme-flat.jpg";
import prismeDetail from "@/assets/tshirts/prisme-detail.jpg";
import prismeWorn from "@/assets/tshirts/prisme-worn.jpg";
import atomeFlat from "@/assets/tshirts/atome-flat.jpg";
import atomeDetail from "@/assets/tshirts/atome-detail.jpg";
import atomeWorn from "@/assets/tshirts/atome-worn.jpg";

type FragmentCopy = {
  name: string;
  preview: string;
  reveal: string;
  hook: string;
  resume: string;
  fonction: string;
  motif: string;
  sensation: string;
  edition?: string;
  matiere?: string;
  colorLabel?: string;
};

export type Fragment = FragmentCopy & {
  id: string;
  number: string;
  code: string;
  symbole: string;
  unlocked: boolean;
  price?: number;
  edition?: string;
  matiere?: string;
  colorLabel?: string;
  images?: { flat: string; detail: string; worn: string };
  i18n?: Partial<Record<Exclude<Lang, "fr">, Partial<FragmentCopy>>>;
};

const baseFragments: Fragment[] = [
  {
    id: "eveil",
    number: "01",
    code: "FRAGMENT_01_EVEIL",
    name: "L'Éveil",
    preview: "Une faille s'approche. Le tissu répond avant la main.",
    reveal:
      "Une pierre retient la lumière. Le vêtement se resserre. Quelque chose vous a reconnu avant même que vous sachiez quoi chercher.",
    hook: "Touchez ce qui retire la lumière.",
    resume:
      "Une pierre retient la lumière. Le vêtement se resserre. Quelque chose vous a reconnu avant même que vous sachiez quoi chercher.",
    fonction: "Ouvrir un premier passage sans tout expliquer.",
    motif: "La faille lumineuse dans la pierre et dans la couture.",
    sensation: "Le tissu répond avant la main.",
    symbole: "✦",
    unlocked: true,
    price: 3600,
    edition: "Drop 01 - 200 pièces",
    matiere: "Coton lourd 240g/m², teinte minérale",
    colorLabel: "Noir d'encre",
    images: { flat: eveilFlat, detail: eveilDetail, worn: eveilWorn },
    i18n: {
      en: {
        name: "The Awakening",
        preview: "A rift draws near. The fabric answers before the hand.",
        reveal:
          "A dark stone holds the light back. The garment tightens. Something recognized you before you knew what to look for.",
        hook: "Touch what takes the light away.",
        resume:
          "A dark stone holds the light back. The garment tightens. Something recognized you before you knew what to look for.",
        fonction: "Open a first passage without explaining everything.",
        motif: "The luminous rift in stone and stitch.",
        sensation: "The fabric answers before the hand.",
        edition: "Drop 01 - 200 pieces",
        matiere: "Heavy 240 gsm cotton, mineral dyed",
        colorLabel: "Ink black",
      },
      ar: {
        name: "اليقظة",
        preview: "شقّ يقترب. القماش يجيب قبل اليد.",
        reveal: "حجر داكن يحبس الضوء. تضيق القطعة قليلًا. شيء ما تعرّف إليك قبل أن تعرف عمّا تبحث.",
        hook: "المس ما يسحب الضوء.",
        resume: "حجر داكن يحبس الضوء. تضيق القطعة قليلًا. شيء ما تعرّف إليك قبل أن تعرف عمّا تبحث.",
        fonction: "فتح الممر الأول من غير أن يشرح كل شيء.",
        motif: "شقّ مضيء بين الحجر والغرزة.",
        sensation: "القماش يجيب قبل اليد.",
        edition: "الإصدار 01 - ٢٠٠ قطعة",
        matiere: "قطن ثقيل ٢٤٠ غ/م²، صبغة معدنية",
        colorLabel: "أسود حبري",
      },
    },
  },
  {
    id: "souffle",
    number: "02",
    code: "FRAGMENT_02_SOUFFLE",
    name: "Le Souffle",
    preview: "Le monde ralentit autour de vous.",
    reveal:
      "L'air change près du corps. Le vêtement suit votre respiration avec un léger retard, comme s'il écoutait une cadence plus ancienne.",
    hook: "Respirez. Le tissu écoute.",
    resume:
      "L'air change près du corps. Le vêtement suit votre respiration avec un léger retard, comme s'il écoutait une cadence plus ancienne.",
    fonction: "Sentir une cadence avant de chercher une réponse.",
    motif: "Le souffle qui déplace la lumière sans bruit.",
    sensation: "Une respiration seconde, discrète, près du corps.",
    symbole: "≈",
    unlocked: true,
    price: 3600,
    edition: "Drop 01 - 200 pièces",
    matiere: "Coton organique 220g/m², lavé pierre",
    colorLabel: "Pourpre nocturne",
    images: { flat: souffleFlat, detail: souffleDetail, worn: souffleWorn },
    i18n: {
      en: {
        name: "The Breath",
        preview: "The world slows down around you.",
        reveal:
          "The air changes close to the body. The garment follows your breathing with a slight delay, as if listening to an older cadence.",
        hook: "Breathe. The fabric listens.",
        resume:
          "The air changes close to the body. The garment follows your breathing with a slight delay, as if listening to an older cadence.",
        fonction: "Feel a cadence before looking for an answer.",
        motif: "A breath moving light without noise.",
        sensation: "A second, discreet breath close to the body.",
        edition: "Drop 01 - 200 pieces",
        matiere: "Organic 220 gsm cotton, stone washed",
        colorLabel: "Night purple",
      },
      ar: {
        name: "النَّفَس",
        preview: "العالم يبطئ من حولك.",
        reveal:
          "يتغيّر الهواء قرب الجسد. تتبع القطعة تنفّسك بتأخر خفيف، كأنها تصغي إلى إيقاع أقدم.",
        hook: "تنفّس. القماش يصغي.",
        resume:
          "يتغيّر الهواء قرب الجسد. تتبع القطعة تنفّسك بتأخر خفيف، كأنها تصغي إلى إيقاع أقدم.",
        fonction: "الإحساس بالإيقاع قبل البحث عن جواب.",
        motif: "نَفَس يحرّك الضوء بلا ضجيج.",
        sensation: "نَفَس ثانٍ، خافت، قريب من الجسد.",
        edition: "الإصدار 01 - ٢٠٠ قطعة",
        matiere: "قطن عضوي ٢٢٠ غ/م²، مغسول بالحجر",
        colorLabel: "أرجوان ليلي",
      },
    },
  },
  {
    id: "forge",
    number: "03",
    code: "FRAGMENT_03_FORGE",
    name: "La Forge",
    preview: "La matière attend une ligne juste.",
    reveal:
      "La chaleur prend forme au lieu de se disperser. Le symbole se fixe et la lumière devient tenue plutôt qu'explosion.",
    hook: "Tenez la ligne sous chaleur.",
    resume:
      "La chaleur prend forme au lieu de se disperser. Le symbole se fixe et la lumière devient tenue plutôt qu'explosion.",
    fonction: "Tenir l'intensité jusqu'à ce qu'elle devienne forme.",
    motif: "Une couture nette, presque brûlée, qui garde sa mesure.",
    sensation: "La matière chauffe sans se perdre.",
    symbole: "△",
    unlocked: true,
    price: 3600,
    edition: "Drop 01 - 200 pièces",
    matiere: "Coton sergé 260g/m², teinte au pigment minéral",
    colorLabel: "Ocre brûlé",
    images: { flat: forgeFlat, detail: forgeDetail, worn: forgeWorn },
    i18n: {
      en: {
        name: "The Forge",
        preview: "Matter waits for the right line.",
        reveal:
          "Heat takes shape instead of scattering. The symbol holds, and light becomes restraint rather than explosion.",
        hook: "Hold the line under heat.",
        resume:
          "Heat takes shape instead of scattering. The symbol holds, and light becomes restraint rather than explosion.",
        fonction: "Hold intensity until it becomes form.",
        motif: "A clean, almost burned stitch that keeps its measure.",
        sensation: "Matter warms without losing itself.",
        edition: "Drop 01 - 200 pieces",
        matiere: "260 gsm twill cotton, mineral pigment dyed",
        colorLabel: "Burnt ochre",
      },
      ar: {
        name: "المِصهَر",
        preview: "المادة تنتظر خطّها الصحيح.",
        reveal: "تأخذ الحرارة شكلًا بدل أن تتبدّد. يثبت الرمز، ويصير الضوء ضبطًا لا انفجارًا.",
        hook: "أمسك الخط تحت الحرارة.",
        resume: "تأخذ الحرارة شكلًا بدل أن تتبدّد. يثبت الرمز، ويصير الضوء ضبطًا لا انفجارًا.",
        fonction: "حفظ الشدّة حتى تصير شكلًا.",
        motif: "غرزة صافية، تكاد تكون محترقة، وتحفظ مقدارها.",
        sensation: "تسخن المادة من غير أن تضيع.",
        edition: "الإصدار 01 - ٢٠٠ قطعة",
        matiere: "قطن تويل ٢٦٠ غ/م²، صبغة بمعدن",
        colorLabel: "مغرة محترقة",
      },
    },
  },
  {
    id: "prisme",
    number: "04",
    code: "FRAGMENT_04_PRISME",
    name: "Le Prisme",
    preview: "Une seule vérité ne suffit plus.",
    reveal:
      "Quelque chose dans le tissu résiste à la mise au point. Comme si regarder dans une direction fermait les autres. Le vêtement tient les bords.",
    hook: "Supportez le multiple sans choisir.",
    resume:
      "Quelque chose dans le tissu résiste à la mise au point. Comme si regarder dans une direction fermait les autres. Le vêtement tient les bords.",
    fonction: "Garder plusieurs angles sans perdre le centre.",
    motif: "Une facette sombre qui renvoie plusieurs éclats.",
    sensation: "Le regard hésite, le tissu maintient.",
    symbole: "◇",
    unlocked: true,
    price: 3600,
    edition: "Drop 01 - 200 pièces",
    matiere: "Coton mercerisé 230g/m², toucher soyeux",
    colorLabel: "Vert mousse profond",
    images: { flat: prismeFlat, detail: prismeDetail, worn: prismeWorn },
    i18n: {
      en: {
        name: "The Prism",
        preview: "One truth is no longer enough.",
        reveal:
          "Something in the fabric resists focus, as if looking one way closed the others. The garment holds the edges.",
        hook: "Hold the many without choosing.",
        resume:
          "Something in the fabric resists focus, as if looking one way closed the others. The garment holds the edges.",
        fonction: "Keep several angles without losing the center.",
        motif: "A dark facet returning several glints.",
        sensation: "The gaze hesitates; the fabric holds.",
        edition: "Drop 01 - 200 pieces",
        matiere: "Mercerized 230 gsm cotton, silky touch",
        colorLabel: "Deep moss green",
      },
      ar: {
        name: "الموشور",
        preview: "حقيقة واحدة لم تعد تكفي.",
        reveal:
          "شيء في القماش يقاوم وضوح الرؤية، كأن النظر في اتجاه يغلق الاتجاهات الأخرى. القطعة تمسك الحواف.",
        hook: "احتمل التعدد من غير أن تختار.",
        resume:
          "شيء في القماش يقاوم وضوح الرؤية، كأن النظر في اتجاه يغلق الاتجاهات الأخرى. القطعة تمسك الحواف.",
        fonction: "حفظ زوايا متعددة من غير فقدان المركز.",
        motif: "وجه داكن يعيد أكثر من ومضة.",
        sensation: "النظر يتردد، والقماش يثبت.",
        edition: "الإصدار 01 - ٢٠٠ قطعة",
        matiere: "قطن ممسر ٢٣٠ غ/م²، ملمس حريري",
        colorLabel: "أخضر طحلبي عميق",
      },
    },
  },
  {
    id: "atome",
    number: "05",
    code: "FRAGMENT_05_ATOME",
    name: "L'Atome",
    preview: "Tout tient sur presque rien.",
    reveal:
      "Un point presque invisible tire doucement dans la doublure. Le vêtement ne devient pas plus lourd ; il devient plus exact.",
    hook: "Tenez le fil minuscule.",
    resume:
      "Un point presque invisible tire doucement dans la doublure. Le vêtement ne devient pas plus lourd ; il devient plus exact.",
    fonction: "Donner de l'importance à ce qui paraît trop petit.",
    motif: "Un point dense, net, retenu dans la trame.",
    sensation: "Une précision minuscule modifie toute la tenue.",
    symbole: "◯",
    unlocked: true,
    price: 3600,
    edition: "Drop 01 - 200 pièces",
    matiere: "Coton peigné 210g/m², toucher poudré",
    colorLabel: "Rose cendré",
    images: { flat: atomeFlat, detail: atomeDetail, worn: atomeWorn },
    i18n: {
      en: {
        name: "The Atom",
        preview: "Everything rests on almost nothing.",
        reveal:
          "An almost invisible point pulls gently inside the lining. The garment does not become heavier; it becomes more exact.",
        hook: "Hold the smallest thread.",
        resume:
          "An almost invisible point pulls gently inside the lining. The garment does not become heavier; it becomes more exact.",
        fonction: "Give weight to what seems too small.",
        motif: "A dense, precise point held in the weave.",
        sensation: "A tiny precision changes the whole fit.",
        edition: "Drop 01 - 200 pieces",
        matiere: "Combed 210 gsm cotton, powder touch",
        colorLabel: "Ash rose",
      },
      ar: {
        name: "الذرّة",
        preview: "كل شيء قائم على شبه لا شيء.",
        reveal: "نقطة تكاد لا تُرى تشدّ بلطف داخل البطانة. لا تصبح القطعة أثقل؛ تصبح أدق.",
        hook: "أمسك الخيط الأصغر.",
        resume: "نقطة تكاد لا تُرى تشدّ بلطف داخل البطانة. لا تصبح القطعة أثقل؛ تصبح أدق.",
        fonction: "إعطاء وزن لما يبدو أصغر من أن يُرى.",
        motif: "نقطة كثيفة وصافية، ممسوكة داخل النسيج.",
        sensation: "دقة صغيرة تغيّر هيئة القطعة كلها.",
        edition: "الإصدار 01 - ٢٠٠ قطعة",
        matiere: "قطن ممشط ٢١٠ غ/م²، ملمس بودري",
        colorLabel: "وردي رمادي",
      },
    },
  },
  {
    id: "eclipse",
    number: "06",
    code: "FRAGMENT_06_ECLIPSE",
    name: "L'Éclipse",
    preview: "La lumière se retire. La tenue commence.",
    reveal:
      "Le monde cesse de répondre comme avant. Le vêtement ne vous offre pas de spectacle, seulement une manière de rester entier dans le retrait.",
    hook: "Restez entiers dans l'absence.",
    resume:
      "Le monde cesse de répondre comme avant. Le vêtement ne vous offre pas de spectacle, seulement une manière de rester entier dans le retrait.",
    fonction: "Rester présent quand la lumière se retire.",
    motif: "Un disque sombre bordé d'un halo retenu.",
    sensation: "Le silence devient une forme de tenue.",
    symbole: "●",
    unlocked: false,
    i18n: {
      en: {
        name: "The Eclipse",
        preview: "The light withdraws. Holding begins.",
        reveal:
          "The world stops answering as before. The garment offers no spectacle, only a way to remain whole inside the withdrawal.",
        hook: "Remain whole in the absence.",
        resume:
          "The world stops answering as before. The garment offers no spectacle, only a way to remain whole inside the withdrawal.",
        fonction: "Stay present when the light withdraws.",
        motif: "A dark disc edged by a held halo.",
        sensation: "Silence becomes a kind of bearing.",
      },
      ar: {
        name: "الكسوف",
        preview: "ينسحب الضوء. وتبدأ القدرة على الثبات.",
        reveal:
          "يتوقف العالم عن الإجابة كما كان. لا تمنحك القطعة عرضًا، بل طريقة لتبقى كاملًا داخل الانسحاب.",
        hook: "ابقَ كاملًا في الغياب.",
        resume:
          "يتوقف العالم عن الإجابة كما كان. لا تمنحك القطعة عرضًا، بل طريقة لتبقى كاملًا داخل الانسحاب.",
        fonction: "البقاء حاضرًا حين ينسحب الضوء.",
        motif: "قرص داكن تحيط به هالة ممسوكة.",
        sensation: "الصمت يصير هيئة من الثبات.",
      },
    },
  },
  {
    id: "horizon",
    number: "07",
    code: "FRAGMENT_07_HORIZON",
    name: "L'Horizon",
    preview: "Une seule ligne reste devant vous.",
    reveal:
      "Le champ se resserre en direction. Le vêtement devient tension et cap, comme si le passage demandait déjà un choix réel.",
    hook: "Franchissez sans vous fermer.",
    resume:
      "Le champ se resserre en direction. Le vêtement devient tension et cap, comme si le passage demandait déjà un choix réel.",
    fonction: "Transformer l'élan en direction lisible.",
    motif: "Une ligne claire qui tient le bord du regard.",
    sensation: "Le corps avance sans perdre sa mesure.",
    symbole: "—",
    unlocked: false,
    i18n: {
      en: {
        name: "The Horizon",
        preview: "A single line remains ahead.",
        reveal:
          "The field tightens into direction. The garment becomes tension and bearing, as if the passage already asked for a real choice.",
        hook: "Cross without closing yourself.",
        resume:
          "The field tightens into direction. The garment becomes tension and bearing, as if the passage already asked for a real choice.",
        fonction: "Turn impulse into readable direction.",
        motif: "A clear line holding the edge of sight.",
        sensation: "The body moves forward without losing measure.",
      },
      ar: {
        name: "الأفق",
        preview: "يبقى خط واحد أمامك.",
        reveal:
          "يضيق المجال حتى يصير اتجاهًا. تصير القطعة توترًا وبوصلة، كأن الممر يطلب اختيارًا حقيقيًا منذ الآن.",
        hook: "اعبر من غير أن تنغلق.",
        resume:
          "يضيق المجال حتى يصير اتجاهًا. تصير القطعة توترًا وبوصلة، كأن الممر يطلب اختيارًا حقيقيًا منذ الآن.",
        fonction: "تحويل الاندفاع إلى اتجاه مقروء.",
        motif: "خط واضح يمسك حافة النظر.",
        sensation: "الجسد يتقدّم من غير أن يفقد قياسه.",
      },
    },
  },
  {
    id: "resonance",
    number: "08",
    code: "FRAGMENT_08_RESONANCE",
    name: "La Résonance",
    preview: "Ce qui répond ne reste plus seul.",
    reveal:
      "Une chaleur vient du côté où personne ne se trouve. Le tissu change de tension sans que vous ayez bougé. Quelque chose répond depuis l'extérieur.",
    hook: "Accordez ce qui répond ensemble.",
    resume:
      "Une chaleur vient du côté où personne ne se trouve. Le tissu change de tension sans que vous ayez bougé. Quelque chose répond depuis l'extérieur.",
    fonction: "Laisser une réponse entrer sans la forcer.",
    motif: "Une onde basse qui traverse plusieurs bords.",
    sensation: "La matière répond à une présence hors champ.",
    symbole: "◎",
    unlocked: false,
    i18n: {
      en: {
        name: "The Resonance",
        preview: "What answers no longer stays alone.",
        reveal:
          "A warmth comes from where no one stands. The fabric changes tension though you have not moved. Something answers from outside the frame.",
        hook: "Tune what answers together.",
        resume:
          "A warmth comes from where no one stands. The fabric changes tension though you have not moved. Something answers from outside the frame.",
        fonction: "Let an answer enter without forcing it.",
        motif: "A low wave crossing several edges.",
        sensation: "Matter answers a presence outside the frame.",
      },
      ar: {
        name: "الرنين",
        preview: "ما يجيب لا يبقى وحيدًا.",
        reveal:
          "تأتي حرارة من الجهة التي لا يقف فيها أحد. يتغيّر شدّ القماش من غير أن تتحرك. شيء ما يجيب من خارج الإطار.",
        hook: "وافق بين ما يجيب معًا.",
        resume:
          "تأتي حرارة من الجهة التي لا يقف فيها أحد. يتغيّر شدّ القماش من غير أن تتحرك. شيء ما يجيب من خارج الإطار.",
        fonction: "السماح للجواب بالدخول من غير إجباره.",
        motif: "موجة منخفضة تعبر أكثر من حافة.",
        sensation: "المادة تجيب حضورًا خارج الإطار.",
      },
    },
  },
  {
    id: "ascension",
    number: "09",
    code: "FRAGMENT_09_ASCENSION",
    name: "L'Ascension",
    preview: "Quelque chose monte sans se fermer.",
    reveal:
      "Le corps, le vêtement et la lumière apprennent une forme commune. La montée reste contenue, mais elle devient visible.",
    hook: "Montez sans refermer la couture.",
    resume:
      "Le corps, le vêtement et la lumière apprennent une forme commune. La montée reste contenue, mais elle devient visible.",
    fonction: "Élever la forme sans perdre la sobriété.",
    motif: "Un éclat vertical tenu par la couture.",
    sensation: "La montée reste calme, presque textile.",
    symbole: "✧",
    unlocked: false,
    i18n: {
      en: {
        name: "The Ascent",
        preview: "Something rises without closing.",
        reveal:
          "Body, garment and light learn a common form. The rise stays contained, yet becomes visible.",
        hook: "Rise without closing the seam.",
        resume:
          "Body, garment and light learn a common form. The rise stays contained, yet becomes visible.",
        fonction: "Lift the form without losing restraint.",
        motif: "A vertical glint held by the stitch.",
        sensation: "The rise remains calm, almost textile.",
      },
      ar: {
        name: "الصعود",
        preview: "شيء يصعد من غير أن ينغلق.",
        reveal: "يتعلم الجسد والقطعة والضوء شكلًا واحدًا. يبقى الصعود محتوى، لكنه يصبح مرئيًا.",
        hook: "اصعد من غير أن تغلق الخياطة.",
        resume: "يتعلم الجسد والقطعة والضوء شكلًا واحدًا. يبقى الصعود محتوى، لكنه يصبح مرئيًا.",
        fonction: "رفع الشكل من غير فقدان الرصانة.",
        motif: "ومضة عمودية تمسكها الغرزة.",
        sensation: "يبقى الصعود هادئًا، قريبًا من القماش.",
      },
    },
  },
  {
    id: "origine",
    number: "10",
    code: "FRAGMENT_10_ORIGINE",
    name: "L'Origine",
    preview: "Le centre recommence à respirer.",
    reveal:
      "Le tissu pèse différemment. Pas plus lourd, plus centré. Comme si tout ce qui avait été dispersé revenait tenir en un seul endroit.",
    hook: "Laissez passer ce qui ne vous appartient pas.",
    resume:
      "Le tissu pèse différemment. Pas plus lourd, plus centré. Comme si tout ce qui avait été dispersé revenait tenir en un seul endroit.",
    fonction: "Revenir au centre sans fermer le passage.",
    motif: "Un cercle brisé qui tient encore.",
    sensation: "La pièce devient plus calme, plus exacte.",
    symbole: "⊙",
    unlocked: false,
    i18n: {
      en: {
        name: "The Origin",
        preview: "The center begins to breathe again.",
        reveal:
          "The fabric weighs differently. Not heavier, more centered. As if everything scattered had returned to hold in one place.",
        hook: "Let pass what does not belong to you.",
        resume:
          "The fabric weighs differently. Not heavier, more centered. As if everything scattered had returned to hold in one place.",
        fonction: "Return to the center without closing the passage.",
        motif: "A broken circle that still holds.",
        sensation: "The piece becomes calmer, more exact.",
      },
      ar: {
        name: "الأصل",
        preview: "المركز يبدأ بالتنفس من جديد.",
        reveal:
          "يصير وزن القماش مختلفًا. ليس أثقل، بل أكثر تمركزًا. كأن كل ما تفرّق عاد ليمسك نفسه في موضع واحد.",
        hook: "دع ما لا يخصّك يمر.",
        resume:
          "يصير وزن القماش مختلفًا. ليس أثقل، بل أكثر تمركزًا. كأن كل ما تفرّق عاد ليمسك نفسه في موضع واحد.",
        fonction: "العودة إلى المركز من غير إغلاق الممر.",
        motif: "دائرة مكسورة ما زالت تمسك.",
        sensation: "تصير القطعة أهدأ، وأدق.",
      },
    },
  },
];

// Mode DÉMO MAX (build interne) : les 10 fragments visibles et déverrouillés.
export const fragments: Fragment[] = DEMO_MAX
  ? baseFragments.map((f) => ({ ...f, unlocked: true }))
  : baseFragments;

export const localizeFragment = <T extends Fragment | undefined | null>(
  fragment: T,
  lang: Lang,
): T => {
  if (!fragment || lang === "fr") return fragment;
  return { ...fragment, ...fragment.i18n?.[lang] } as T;
};

export const localizeFragments = (items: Fragment[], lang: Lang) =>
  items.map((fragment) => localizeFragment(fragment, lang)!);

export const getFragment = (id: string) => fragments.find((f) => f.id === id);
export const unlockedFragments = fragments.filter((f) => f.unlocked);
