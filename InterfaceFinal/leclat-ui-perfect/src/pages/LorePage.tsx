import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sceau, Ornement } from "@/components/Sceau";
import ficheProduit from "@/assets/editorial/fiche-produit.webp";
import { text, useI18n, type Localized } from "@/lib/i18n";

const glossary: Array<[Localized, Localized]> = [
  [
    text("L'Éclat", "L'ÉCLAT", "L'ÉCLAT"),
    text(
      "Une lumière basse, une faille, une manière de sentir que le réel n'est pas fermé.",
      "A low light, a rift, a way to feel that reality is not sealed.",
      "ضوء منخفض، شقّ، وطريقة للشعور بأن الواقع ليس مغلقًا.",
    ),
  ],
  [
    text("Le Voile", "The Veil", "السِّتار"),
    text(
      "La distance entre ce que l'on voit et ce qui attend derrière la surface.",
      "The distance between what is seen and what waits behind the surface.",
      "المسافة بين ما نراه وما ينتظر خلف السطح.",
    ),
  ],
  [
    text("Le Porteur", "The Bearer", "الحامل"),
    text(
      "La personne qui entre dans l'expérience. Le Porteur n'est pas Nahil : il découvre ses propres traces.",
      "The person who enters the experience. The Bearer is not Nahil: they discover their own traces.",
      "الشخص الذي يدخل التجربة. الحامل ليس ناهيل: إنه يكتشف أثره الخاص.",
    ),
  ],
  [
    text("Le vêtement", "The garment", "القطعة"),
    text(
      "Une pièce textile premium qui porte un signe, une matière, un indice, et parfois une réponse.",
      "A premium textile piece carrying a mark, a material, a clue, and sometimes an answer.",
      "قطعة نسيجية فاخرة تحمل علامة وخامة ودليلًا، وأحيانًا جوابًا.",
    ),
  ],
  [
    text("Les Fragments", "The Fragments", "الشذرات"),
    text(
      "Des seuils courts. Ils ouvrent une sensation, jamais toute l'histoire.",
      "Short thresholds. They open a sensation, never the whole story.",
      "عتبات قصيرة. تفتح إحساسًا، لا القصة كاملة.",
    ),
  ],
];

const figures: Array<[Localized, Localized]> = [
  [
    text("Nahil", "Nahil", "ناهيل"),
    text(
      "Un nom revient parfois dans le tissu. Personne ne vous le donne encore. Il laisse seulement une trace.",
      "A name sometimes returns through the fabric. No one gives it to you yet. It only leaves a trace.",
      "اسم يعود أحيانًا من داخل القماش. لا يقدّمه لك أحد بعد. يترك أثرًا فقط.",
    ),
  ],
  [
    text("La silhouette passée", "The passing silhouette", "الظل السابق"),
    text(
      "Quelqu'un est venu avant vous. Le signe ne raconte pas tout, il indique une direction.",
      "Someone came before you. The mark does not tell everything; it points toward a direction.",
      "جاء أحد قبلك. العلامة لا تقول كل شيء، بل تشير إلى اتجاه.",
    ),
  ],
  [
    text("Le seuil", "The threshold", "العتبة"),
    text(
      "Une frontière discrète : assez visible pour appeler, assez fermée pour rester précieuse.",
      "A discreet boundary: visible enough to call, closed enough to remain precious.",
      "حدّ خافت: ظاهر بما يكفي لينادي، ومغلق بما يكفي ليبقى ثمينًا.",
    ),
  ],
];

const rules = [
  text(
    "Le Porteur découvre, il ne possède pas l'histoire.",
    "The Bearer discovers; they do not own the story.",
    "الحامل يكتشف، ولا يمتلك القصة.",
  ),
  text(
    "Nahil reste une énigme, jamais une identité imposée.",
    "Nahil remains an enigma, never an imposed identity.",
    "يبقى ناهيل لغزًا، لا هوية مفروضة.",
  ),
  text(
    "Chaque fragment doit tenir en une sensation claire.",
    "Each fragment must hold as one clear sensation.",
    "كل شذرة يجب أن تقوم على إحساس واضح.",
  ),
  text(
    "Le textile passe avant l'explication.",
    "The textile comes before the explanation.",
    "النسيج يأتي قبل الشرح.",
  ),
  text(
    "Ce qui dort sous la faille ne remonte qu'au moment juste.",
    "What sleeps beneath the rift rises only at the right moment.",
    "ما ينام تحت الشق لا يصعد إلا في وقته.",
  ),
  text(
    "Le seuil laisse passer une lueur, jamais toute la chambre.",
    "The threshold lets through a glimmer, never the whole room.",
    "العتبة تسمح بلمحة، لا بالغرفة كلها.",
  ),
  text(
    "La sobriété protège le mystère.",
    "Restraint protects the mystery.",
    "الرصانة تحمي الغموض.",
  ),
];

const copy = {
  book: text("Livre I · Premiers indices", "Book I · First clues", "الكتاب الأول · دلائل أولى"),
  titleA: text("L'univers", "The world", "عالم"),
  titleB: text("de L'Éclat", "of L'ÉCLAT", "L'ÉCLAT"),
  intro: text(
    "Une porte d'entrée courte, sensorielle et volontairement incomplète. L'histoire existe, mais la surface visible ne livre que les premiers signes.",
    "A short, sensory, deliberately incomplete entry point. The story exists, but the visible surface only gives the first signs.",
    "مدخل قصير وحسّي وناقص عن قصد. القصة موجودة، لكن السطح المرئي لا يمنح إلا العلامات الأولى.",
  ),
  inviteEyebrow: text("Une invitation", "An invitation", "دعوة"),
  inviteTitle: text(
    "Dans un monde qui va trop vite, prenez le temps de choisir votre histoire.",
    "In a world that moves too fast, take the time to choose your story.",
    "في عالمٍ يمضي مسرعًا، خذ وقتك لتختار قصتك.",
  ),
  inviteBody: text(
    "Le roman de Nahil est un parcours : le deuil, les mains qui apprennent à tenir, et ce que l'on accepte enfin de garder. On n'entre pas pour consommer. On entre pour traverser.",
    "Nahil's novel is a passage: grief, hands learning to hold, and what we finally accept to keep. You do not enter to consume. You enter to cross.",
    "رواية ناهيل رحلة: الفقد، ويدان تتعلّمان أن تصمدا، وما نقبل أخيرًا أن نحتفظ به. لا تدخل لتستهلك، بل لتعبر.",
  ),
  openingLabel: text(
    "I — Avant le premier scan",
    "I — Before the first scan",
    "I — قبل المسح الأول",
  ),
  openingTitle: text(
    "On le remarquait avant de savoir pourquoi",
    "You noticed it before knowing why",
    "كان يُلاحَظ قبل معرفة السبب",
  ),
  opening: [
    text(
      "Un t-shirt noir. Épais. Sans marque visible. Bien tombé sur les épaules. Le genre de pièce qu'on garde parce qu'elle tient mieux que les autres et boit la lumière au lieu de la renvoyer.",
      "A black T-shirt. Heavy. No visible branding. Sitting cleanly on the shoulders. The kind of piece you keep because it holds better than the others and drinks the light instead of giving it back.",
      "تيشيرت أسود. كثيف. بلا علامة ظاهرة. يستقرّ على الكتفين بنقاء. من النوع الذي تحتفظ به لأنه يثبت أفضل من غيره ويشرب الضوء بدل أن يعيده.",
    ),
    text(
      "Sous le col, une ligne trop fine pour être un motif. Presque rien. Au début. La plupart s'arrêtaient là.",
      "Under the collar, a line too fine to be a motif. Almost nothing. At first. Most people stopped there.",
      "تحت الياقة، خط أدق من أن يكون نقشًا. شبه لا شيء. في البداية. كان معظم الناس يتوقفون هناك.",
    ),
    text(
      "Ils avaient raison. Un vêtement peut rester un vêtement très longtemps.",
      "They were right. A garment can remain a garment for a very long time.",
      "كانوا محقين. يمكن للقطعة أن تبقى قطعة لوقت طويل جدًا.",
    ),
    text(
      "Puis le tissu devient trop chaud à un endroit précis, pas brûlant, juste trop net pour être ignoré. Le dos commence à sentir quelque chose que les yeux n'ont pas encore vu. Une couture garde plus qu'une forme.",
      "Then the fabric grows too warm in one precise place, not burning, just too exact to ignore. The back begins to feel something the eyes have not yet seen. A seam holds more than a shape.",
      "ثم يصبح القماش دافئًا أكثر من اللازم في موضع محدد، لا يحرق، لكنه أدق من أن يُتجاهل. يبدأ الظهر بإحساس لم تره العين بعد. غرزة تحتفظ بأكثر من شكل.",
    ),
    text(
      "On ne comprend pas encore. On revient pourtant. Pas pour apprendre. Pour vérifier. Ce qu'il retient ne parle pas à tout le monde.",
      "You do not understand yet. Still, you return. Not to learn. To verify. What it holds does not speak to everyone.",
      "لا تفهم بعد. ومع ذلك تعود. لا لتتعلّم. بل لتتأكد. ما تحتفظ به لا يخاطب الجميع.",
    ),
    text(
      "Il faut le porter un peu avant qu'il cesse de se taire. Il faut l'avoir gardé sur soi dans une journée qui ne finissait pas, dans une nuit trop courte, dans ce moment exact où l'on voulait seulement un vêtement qui tient, et où il commençait déjà à vouloir davantage.",
      "You have to wear it for a while before it stops being silent. You have to have kept it on through a day that would not end, a night too short, that exact moment when all you wanted was a garment that holds, while it was already beginning to want more.",
      "يجب أن ترتديه قليلًا قبل أن يتوقف عن الصمت. يجب أن يبقى عليك في يوم لا ينتهي، في ليلة قصيرة جدًا، في تلك اللحظة التي أردت فيها فقط قطعة تثبت، بينما كانت هي قد بدأت تريد أكثر.",
    ),
    text(
      "Quand enfin un nom remonte de sa couture, il vient en dernier :",
      "When a name finally rises from its seam, it comes last:",
      "وحين يصعد اسم أخيرًا من خياطته، يأتي في النهاية:",
    ),
  ],
  bearerLabel: text("II — Le Porteur", "II — The Bearer", "II — الحامل"),
  manifesto: text(
    "est l'histoire d'une blessure cousue dans un vêtement, puis révélée par la lumière d'une application.",
    "is the story of a wound sewn into a garment, then revealed by the light of an app.",
    "حكاية جرحٍ مخيطٍ في ثوب، يكشفه ضوءُ تطبيق.",
  ),
  bearerTitle: text(
    "La personne qui franchit le seuil",
    "The one who crosses the threshold",
    "من يعبر العتبة",
  ),
  bearer: [
    text(
      "Vous êtes le Porteur. Cela ne fait pas de vous Nahil. Cela veut dire que le signe vous répond, ici, maintenant.",
      "You are the Bearer. That does not make you Nahil. It means the mark answers you, here and now.",
      "أنت الحامل. هذا لا يجعلك ناهيل. بل يعني أن العلامة تجيبك هنا والآن.",
    ),
    text(
      "Le scan ouvre un aperçu, un indice, une sensation. Les marques plus profondes ne se réveillent pas au premier passage.",
      "The scan opens a preview, a clue, a sensation. Deeper marks do not wake at the first passage.",
      "يفتح المسح لمحة ودليلًا وإحساسًا. العلامات الأعمق لا تستيقظ من العبور الأول.",
    ),
    text(
      "Le mystère avance par fragments, jamais par exposition complète.",
      "The mystery advances by fragments, never by full exposure.",
      "يتقدّم الغموض بالشذرات، لا بالكشف الكامل.",
    ),
  ],
  garmentLabel: text("III — Le vêtement", "III — The garment", "III — القطعة"),
  garmentTitle: text(
    "La mémoire logée dans le tissu",
    "Memory lodged in the fabric",
    "ذاكرة تسكن القماش",
  ),
  garment: [
    text(
      "Chaque pièce de L'Éclat porte un signe brodé, une coupe, une matière et une intention. Elle peut se porter sans connaître l'histoire.",
      "Every L'ÉCLAT piece carries an embroidered mark, a cut, a material and an intention. It can be worn without knowing the story.",
      "كل قطعة من L'ÉCLAT تحمل علامة مطرّزة وقصة وخامة ونية. يمكن ارتداؤها من غير معرفة القصة.",
    ),
    text(
      "Si vous scannez le signe, un passage court s'ouvre : un fragment, une image, une promesse.",
      "If you scan the mark, a short passage opens: a fragment, an image, a promise.",
      "إذا مسحت العلامة، تنفتح عتبة قصيرة: شذرة، صورة، ووعد.",
    ),
    text(
      "Si cela ne vous suffit pas, l'histoire commence là.",
      "If that is not enough, the story begins there.",
      "إن لم يكفِ ذلك، تبدأ القصة هناك.",
    ),
  ],
  signLabel: text("IV — Le signe", "IV — The mark", "IV — العلامة"),
  signA: text(
    "Inspiré du kanji 光 — lumière, éclat — le symbole L'ÉCLAT a été retravaillé comme un signe textile.",
    "Inspired by the kanji 光 — light, radiance — the L'ÉCLAT symbol was reworked as a textile mark.",
    "استُلهم رمز L'ÉCLAT من الكانجي 光، أي الضوء واللمعان، ثم أُعيد تشكيله كعلامة نسيجية.",
  ),
  signB: text(
    "La ligne diagonale n'est pas une simple coupure : elle représente la faille.",
    "The diagonal line is not a simple cut: it represents the rift.",
    "الخط المائل ليس قطعًا عاديًا: إنه يمثّل الشق.",
  ),
  signC: text(
    "Celle qui traverse la surface. Celle qui ouvre le passage. Celle par laquelle les fragments, les souvenirs et les possibilités commencent à apparaître.",
    "The one that crosses the surface. The one that opens the passage. The one through which fragments, memories and possibilities begin to appear.",
    "الذي يعبر السطح. الذي يفتح العتبة. الذي تبدأ عبره الشذرات والذكريات والاحتمالات بالظهور.",
  ),
  signD: text(
    "L'ÉCLAT n'est pas seulement un logo.",
    "L'ÉCLAT is not only a logo.",
    "L'ÉCLAT ليس مجرد شعار.",
  ),
  signE: text("C'est un seuil.", "It is a threshold.", "إنه عتبة."),
  pieceLabel: text("V — La pièce", "V — The piece", "V — القطعة"),
  anatomy: text("Anatomie d'un fragment porté", "Anatomy of a worn fragment", "تشريح شذرة تُرتدى"),
  anatomyText: text(
    "Chaque détail compte. Chaque finition a un sens. Né d'une intention, façonné avec exigence.",
    "Every detail matters. Every finish has meaning. Born from intention, shaped with precision.",
    "كل تفصيل مهم. كل لمسة نهائية لها معنى. وُلدت من نية، وصُنعت بدقة.",
  ),
  productAlt: text(
    "Fiche produit L'Éclat — matière, coupe, broderie premium, finitions",
    "L'ÉCLAT product sheet — material, cut, premium embroidery, finishes",
    "بطاقة منتج L'ÉCLAT — الخامة، القصة، التطريز الفاخر، اللمسات النهائية",
  ),
  drop: text(
    "Drop 01 · L'Éveil — 01 / 10",
    "Drop 01 · The Awakening — 01 / 10",
    "الإصدار 01 · اليقظة — 01 / 10",
  ),
  glossaryLabel: text("Lexique d'entrée", "Entry lexicon", "معجم الدخول"),
  glossaryTitle: text("Ce qui peut être dit", "What can be said", "ما يمكن قوله"),
  clues: text("Indices", "Clues", "دلائل"),
  toDiscover: text("Ce qui reste à découvrir", "What remains to discover", "ما يبقى لاكتشافه"),
  laws: text("Lois du seuil", "Threshold laws", "قوانين العتبة"),
  lawsTitle: text("Sept lois du Voile", "Seven laws of the Veil", "سبعة قوانين للسِّتار"),
  principle: text(
    "« Montrer d'abord. Expliquer ensuite, seulement si nécessaire. »",
    "“Show first. Explain later, only if necessary.”",
    "«أظهر أولًا. اشرح لاحقًا، فقط عند الضرورة.»",
  ),
  principleLabel: text("— Principe directeur", "— Guiding principle", "— المبدأ"),
};

export default function LorePage() {
  const { lang, tr } = useI18n();
  return (
    <div className="pb-28">
      <section className="px-6 pt-16 pb-28 text-center border-b border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 gradient-voile pointer-events-none" />
        <div className="absolute inset-0 ciel-poussiere opacity-40 anim-drift pointer-events-none" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-25 pointer-events-none">
          <Sceau className="w-72 h-72" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="relative pt-24"
        >
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-4">
            {tr(copy.book)}
          </p>
          <h1
            className={`font-serif-rituel mb-8 ${
              lang === "ar"
                ? "text-5xl sm:text-6xl leading-[1.15]"
                : "text-6xl leading-[0.9] sm:text-7xl sm:leading-[0.85]"
            }`}
          >
            {tr(copy.titleA)}
            <br />
            <em className="italic text-laiton">{tr(copy.titleB)}</em>
          </h1>
          <p className="text-sm text-voile-dim max-w-md mx-auto leading-relaxed">
            {tr(copy.intro)}
          </p>
          <Ornement className="mt-8 max-w-xs mx-auto" />
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2 }}
        className="border-t border-border/40 px-6 py-16 text-center"
      >
        <p className="mb-5 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
          {tr(copy.inviteEyebrow)}
        </p>
        <p className="mx-auto max-w-lg font-serif-rituel text-2xl leading-snug text-foreground sm:text-3xl">
          {tr(copy.inviteTitle)}
        </p>
        <p className="mx-auto mt-6 max-w-md font-serif-rituel italic text-base leading-relaxed text-voile-dim">
          {tr(copy.inviteBody)}
        </p>
        <Ornement className="mx-auto mt-8 max-w-xs" />
      </motion.section>

      <Section label={tr(copy.openingLabel)} title={tr(copy.openingTitle)}>
        {copy.opening.slice(0, -1).map((paragraph, index) => (
          <p key={index}>{tr(paragraph)}</p>
        ))}
        <p>
          {tr(copy.opening[copy.opening.length - 1])}{" "}
          <em className="text-laiton not-italic">{tr(text("Nahil", "Nahil", "ناهيل"))}</em>.
        </p>
      </Section>

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2 }}
        className="relative overflow-hidden border-t border-border/40 px-6 py-16"
      >
        <div className="absolute inset-0 gradient-voile pointer-events-none opacity-50" />
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-[0.12] pointer-events-none">
          <Sceau className="h-56 w-56" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <p className="mb-5 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
            {tr(copy.bearerLabel)}
          </p>
          <p className="font-serif-rituel text-3xl leading-snug text-foreground sm:text-4xl">
            <em className="not-italic text-laiton">L'ÉCLAT</em> {tr(copy.manifesto)}
          </p>
          <Ornement className="my-8 max-w-xs" />
          <h3 className="mb-5 font-serif-rituel text-2xl leading-tight text-voile">
            {tr(copy.bearerTitle)}
          </h3>
          <div className="space-y-4 font-serif-rituel text-xl leading-snug text-foreground/90">
            {copy.bearer.map((paragraph, index) => (
              <p key={index}>{tr(paragraph)}</p>
            ))}
          </div>
        </div>
      </motion.section>

      <Section label={tr(copy.garmentLabel)} title={tr(copy.garmentTitle)}>
        {copy.garment.map((paragraph, index) => (
          <p key={index}>{tr(paragraph)}</p>
        ))}
      </Section>

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2 }}
        className="border-t border-border/40 bg-noir-profond/40 px-6 py-14"
      >
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8 border border-border/50 bg-card/20 px-6 py-8 sm:px-8">
            <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
              {tr(copy.signLabel)}
            </p>
            <div className="space-y-6 font-serif-rituel text-2xl leading-snug text-foreground sm:text-3xl">
              <p>{tr(copy.signA)}</p>
              <Divider />
              <p>{tr(copy.signB)}</p>
              <Divider />
              <p className="text-voile-dim">{tr(copy.signC)}</p>
              <Divider />
              <div className="space-y-3 pt-1">
                <p>{tr(copy.signD)}</p>
                <p className="font-serif-rituel italic text-5xl leading-none text-laiton sm:text-6xl">
                  {tr(copy.signE)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2 }}
        className="border-t border-border/40 px-6 py-14"
      >
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-4">
          {tr(copy.pieceLabel)}
        </p>
        <h2 className="font-serif-rituel text-4xl leading-tight mb-3">{tr(copy.anatomy)}</h2>
        <p className="font-serif-rituel italic text-lg text-voile-dim leading-snug mb-8 max-w-xl">
          {tr(copy.anatomyText)}
        </p>
        <div className="relative border border-border/40 bg-noir-profond overflow-hidden">
          <img
            src={ficheProduit}
            alt={tr(copy.productAlt)}
            loading="lazy"
            className="w-full h-auto block"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-noir-profond/20" />
        </div>
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim mt-4 text-center">
          {tr(copy.drop)}
        </p>
      </motion.section>

      <section className="px-6 py-14 border-t border-border/40">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-4">
          {tr(copy.glossaryLabel)}
        </p>
        <h2 className="font-serif-rituel text-4xl mb-8">{tr(copy.glossaryTitle)}</h2>
        <Accordion type="single" collapsible className="border-t border-border/60">
          {glossary.map(([term, def]) => (
            <AccordionItem key={tr(term)} value={tr(term)} className="border-b border-border/60">
              <AccordionTrigger className="font-serif-rituel text-2xl py-5 hover:no-underline hover:text-laiton">
                {tr(term)}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-voile-dim leading-relaxed pb-5">
                {tr(def)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="px-6 py-14 border-t border-border/40">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-4">
          {tr(copy.clues)}
        </p>
        <h2 className="font-serif-rituel text-4xl mb-8">{tr(copy.toDiscover)}</h2>
        <div className="space-y-8">
          {figures.map(([name, desc]) => (
            <div key={tr(name)} className="border-l border-laiton/40 pl-5">
              <h3 className="font-serif-rituel text-2xl mb-2">{tr(name)}</h3>
              <p className="text-sm text-voile-dim leading-relaxed">{tr(desc)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-14 border-t border-border/40">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-4">
          {tr(copy.laws)}
        </p>
        <h2 className="font-serif-rituel text-4xl mb-10">{tr(copy.lawsTitle)}</h2>
        <ol className="space-y-8">
          {rules.map((rule, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="flex gap-5"
            >
              <span className="font-mono-eclat text-[10px] tracking-rituel text-laiton pt-2 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-serif-rituel text-2xl leading-snug">{tr(rule)}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="px-6 py-16 text-center border-t border-border/40">
        <p className="font-serif-rituel italic text-xl text-voile-dim leading-snug max-w-md mx-auto">
          {tr(copy.principle)}
        </p>
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mt-6">
          {tr(copy.principleLabel)}
        </p>
      </section>
    </div>
  );
}

const Section = ({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 1 }}
    className="px-6 py-14 border-t border-border/40 space-y-5"
  >
    <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">{label}</p>
    <h2 className="font-serif-rituel text-4xl leading-tight mb-6">{title}</h2>
    <div className="space-y-4 font-serif-rituel text-xl leading-snug text-foreground">
      {children}
    </div>
  </motion.section>
);

const Divider = () => <div className="h-px w-14 bg-voile-dim/50" aria-hidden="true" />;
