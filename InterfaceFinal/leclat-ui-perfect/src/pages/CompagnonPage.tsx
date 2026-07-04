import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Lock, ScanLine } from "lucide-react";
import { useStoryScanCounts } from "@/hooks/useStoryScanCounts";
import { fragmentsRemainingForLore, isStoryComplete } from "@/lib/loreAccess";
import { Ornement, Sceau } from "@/components/Sceau";
import { Button } from "@/components/ui/button";
import { text, useI18n, type Lang } from "@/lib/i18n";

/**
 * Compagnon de lecture — récompense GATÉE, anti-spoiler.
 *
 * Contenu = analyses littéraires (docs/lore/analyse_*.md, PARTIE 1 + 2). Ces
 * textes révèlent l'intrigue ET la fin : ils ne sont JAMAIS exposés dans
 * Histoire / Indices public, et ne sont chargés (chunk séparé, lazy) qu'une
 * fois le roman achevé. À terme : à servir côté serveur sur accès confirmé.
 */

// Loaders lazy par langue (chunks séparés, hors bundle initial).
const LORE_LOADERS = import.meta.glob("../../docs/lore/analyse_*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const PART1_RE: Record<Lang, RegExp> = {
  fr: /^#\s+PARTIE\s+1\b/m,
  en: /^#\s+PART\s+1\b/m,
  ar: /^#\s+الجزء الأول(?=\s|$)/m,
};
const PART2_RE: Record<Lang, RegExp> = {
  fr: /^#\s+PARTIE\s+2\b/m,
  en: /^#\s+PART\s+2\b/m,
  ar: /^#\s+الجزء الثاني(?=\s|$)/m,
};
const PART3_RE: Record<Lang, RegExp> = {
  fr: /^#\s+PARTIE\s+3\b/m,
  en: /^#\s+PART\s+3\b/m,
  ar: /^#\s+الجزء الثالث(?=\s|$)/m,
};
const PART4_RE: Record<Lang, RegExp> = {
  fr: /^#\s+PARTIE\s+4\b/m,
  en: /^#\s+PART\s+4\b/m,
  ar: /^#\s+الجزء الرابع(?=\s|$)/m,
};

const sliceAt = (raw: string, from: number, to: number) =>
  raw.slice(from < 0 ? 0 : from, to < 0 ? raw.length : to).trim();

/** Découpe le markdown en trois volets ; ignore la PARTIE 3 (ancien quiz). */
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
}

const copy = {
  eyebrow: text("Compagnon de lecture", "Reading companion", "رفيق القراءة"),
  title: text("Le Seuil, relu", "The Threshold, reread", "العتبة، إعادة قراءة"),
  intro: text(
    "Trois volets — l'architecture, les symboles, puis les noms que le roman ne dit jamais.",
    "Three parts — the architecture, the symbols, then the names the novel never says.",
    "ثلاثة أقسام — البنية، الرموز، ثمّ الأسماء التي لا تقولها الرواية أبدًا.",
  ),
  analyseI: text("I · Architecture", "I · Architecture", "١ · البنية"),
  analyseII: text("II · Symboles", "II · Symbols", "٢ · الرموز"),
  analyseIII: text("III · Les Noms", "III · The Names", "٣ · الأسماء"),
  back: text("Retour", "Back", "رجوع"),
  loading: text("Le Voile se lève…", "The Veil lifts…", "يرتفع السِّتار…"),
  error: text(
    "Le compagnon est indisponible pour l'instant.",
    "The companion is unavailable for now.",
    "الرفيق غير متاح حاليًا.",
  ),
  // Écran verrouillé
  lockedEyebrow: text("Scellé", "Sealed", "مختوم"),
  lockedTitle: text("Compagnon scellé", "Companion sealed", "الرفيق مختوم"),
  spoiler: text(
    "⚠ Ces pages dévoilent toute l'intrigue et la fin du roman.",
    "⚠ These pages reveal the whole plot and the ending of the novel.",
    "⚠ تكشف هذه الصفحات كامل الحبكة ونهاية الرواية.",
  ),
  lockedBody: text(
    "Le compagnon de lecture s'ouvre quand vous avez mené les dix fragments à leur palier le plus profond.",
    "The reading companion opens once you have brought all ten fragments to their deepest tier.",
    "يُفتح رفيق القراءة بعد أن تبلغ بالشذرات العشر جميعها أعمق عتبة لها.",
  ),
  remaining: text("Fragments à approfondir", "Fragments left to deepen", "شذرات تبقى لتعميقها"),
  goScan: text("Reprendre la lecture", "Resume reading", "تابع القراءة"),
  seal: text("COMPAGNON · LE SEUIL · ", "COMPANION · THE THRESHOLD · ", "الرفيق · العتبة · "),
};

export default function CompagnonPage() {
  const { lang, tr } = useI18n();
  const { fragmentScanCounts } = useStoryScanCounts();
  const unlocked = isStoryComplete(fragmentScanCounts);

  if (!unlocked) {
    const remaining = fragmentsRemainingForLore(fragmentScanCounts);
    return (
      <article className="pb-28">
        <section className="relative overflow-hidden px-6 pt-16 pb-10 text-center">
          <div className="absolute inset-0 ciel-poussiere opacity-40 anim-drift pointer-events-none" />
          <div className="relative mx-auto max-w-md">
            <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-laiton/30 text-laiton">
              <Lock className="h-7 w-7" strokeWidth={1.25} />
            </span>
            <p className="mb-3 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
              {tr(copy.lockedEyebrow)}
            </p>
            <h1 className="font-serif-rituel text-4xl leading-none sm:text-5xl">
              {tr(copy.lockedTitle)}
            </h1>
            <p className="mt-6 inline-flex items-center gap-2 border border-laiton/30 px-3 py-2 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton/90">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />
              {tr(copy.spoiler)}
            </p>
            <p className="mt-6 font-serif-rituel text-lg leading-snug text-voile-dim">
              {tr(copy.lockedBody)}
            </p>
            <p className="mt-5 font-mono-eclat text-[10px] uppercase tracking-rituel text-voile-dim">
              {tr(copy.remaining)} · {remaining}/10
            </p>
            <Ornement className="mx-auto my-8 max-w-[10rem]" />
            <div className="flex flex-col gap-3">
              <Button asChild variant="rituel" size="lg" className="min-h-12">
                <Link to="/scan">
                  <ScanLine className="h-4 w-4" strokeWidth={1.25} />
                  {tr(copy.goScan)}
                </Link>
              </Button>
              <Button asChild variant="pierre" size="lg" className="min-h-12">
                <Link to="/histoire">
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.25} />
                  {tr(copy.back)}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </article>
    );
  }

  return <CompagnonContent lang={lang} tr={tr} />;
}

/* ─────────────────────────────────────────── */
/*  Contenu déverrouillé (chargé en lazy)       */
/* ─────────────────────────────────────────── */

const CompagnonContent = ({ lang, tr }: { lang: Lang; tr: ReturnType<typeof useI18n>["tr"] }) => {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [raw, setRaw] = useState("");
  const [tab, setTab] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    const key = Object.keys(LORE_LOADERS).find((k) =>
      k.toLowerCase().endsWith(`analyse_${lang}.md`),
    );
    const loader = key ? LORE_LOADERS[key] : undefined;
    if (!loader) {
      setStatus("error");
      return;
    }
    loader()
      .then((content) => {
        if (cancelled) return;
        setRaw(content);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const analyses = useMemo(
    () => (raw ? extractAnalyses(raw, lang) : { one: "", two: "", three: "" }),
    [raw, lang],
  );
  const active = tab === 1 ? analyses.one : tab === 2 ? analyses.two : analyses.three;

  return (
    <article className="pb-28">
      <section className="relative overflow-hidden border-b border-border/40 px-6 pt-12 pb-9 text-center">
        <div className="absolute inset-0 ciel-poussiere opacity-45 anim-drift pointer-events-none" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-15 pointer-events-none">
          <Sceau className="h-72 w-72" label={tr(copy.seal)} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <p className="mb-3 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
            {tr(copy.eyebrow)}
          </p>
          <h1 className="font-serif-rituel text-4xl leading-none sm:text-6xl">{tr(copy.title)}</h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-voile-dim">
            {tr(copy.intro)}
          </p>
        </motion.div>
      </section>

      <div className="sticky top-14 z-20 border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTab(n)}
              aria-pressed={tab === n}
              className={`tap min-h-11 border px-3 font-mono-eclat text-[10px] uppercase tracking-rituel transition ${
                tab === n
                  ? "border-laiton bg-laiton/15 text-laiton"
                  : "border-border/60 text-voile-dim hover:text-laiton"
              }`}
            >
              {tr(n === 1 ? copy.analyseI : n === 2 ? copy.analyseII : copy.analyseIII)}
            </button>
          ))}
        </div>
      </div>

      <section className="px-6 py-9">
        <div className="mx-auto max-w-xl">
          {status === "loading" && (
            <p className="py-16 text-center font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton anim-respire">
              {tr(copy.loading)}
            </p>
          )}
          {status === "error" && (
            <p className="py-16 text-center font-serif-rituel italic text-voile-dim">
              {tr(copy.error)}
            </p>
          )}
          {status === "ready" && <LoreMarkdown source={active} />}
        </div>
      </section>

      <div className="px-6">
        <div className="mx-auto max-w-xl">
          <Button asChild variant="pierre" size="lg" className="min-h-12 w-full">
            <Link to="/histoire">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.25} />
              {tr(copy.back)}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
};

/* ─────────────────────────────────────────── */
/*  Rendu Markdown minimal (sans dépendance)    */
/* ─────────────────────────────────────────── */

function renderInline(textValue: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let i = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(textValue)) !== null) {
    if (match.index > last) nodes.push(textValue.slice(last, match.index));
    if (match[1]) nodes.push(<strong key={`${keyPrefix}-b${i}`}>{match[1]}</strong>);
    else if (match[2]) nodes.push(<em key={`${keyPrefix}-i${i}`}>{match[2]}</em>);
    else if (match[3])
      nodes.push(
        <code key={`${keyPrefix}-c${i}`} className="font-mono-eclat text-[0.85em] text-laiton">
          {match[3]}
        </code>,
      );
    last = match.index + match[0].length;
    i++;
  }
  if (last < textValue.length) nodes.push(textValue.slice(last));
  return nodes;
}

const isTableSeparator = (line: string) =>
  /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");
const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

function LoreMarkdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.split(/\r?\n/);
  let paragraph: string[] = [];
  let list: string[] = [];
  let table: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const t = paragraph.join(" ").trim();
    if (t)
      blocks.push(
        <p
          key={`p${key++}`}
          className="mb-4 font-serif-rituel text-base leading-relaxed text-voile-dim"
        >
          {renderInline(t, `p${key}`)}
        </p>,
      );
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`u${key++}`} className="mb-5 space-y-2 ps-5">
        {list.map((item, idx) => (
          <li
            key={idx}
            className="list-disc font-serif-rituel text-base leading-relaxed text-voile-dim marker:text-laiton"
          >
            {renderInline(item, `u${key}-${idx}`)}
          </li>
        ))}
      </ul>,
    );
    list = [];
  };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter((r) => !isTableSeparator(r)).map(splitRow);
    if (rows.length) {
      const [head, ...body] = rows;
      blocks.push(
        <div key={`t${key++}`} className="mb-5 overflow-x-auto border border-border/50">
          <table className="w-full border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-laiton/30">
                {head.map((cell, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-2 text-start font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton"
                  >
                    {renderInline(cell, `th${key}-${idx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, r) => (
                <tr key={r} className="border-b border-border/30">
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className="px-3 py-2 align-top font-serif-rituel leading-snug text-voile-dim"
                    >
                      {renderInline(cell, `td${key}-${r}-${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    }
    table = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }
    if (table.length) flushTable();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const content = renderInline(heading[2], `h${key}`);
      if (level <= 1)
        blocks.push(
          <h2
            key={`h${key++}`}
            className="mb-4 mt-8 font-serif-rituel text-3xl leading-tight first:mt-0"
          >
            {content}
          </h2>,
        );
      else if (level === 2)
        blocks.push(
          <h3 key={`h${key++}`} className="mb-3 mt-7 font-serif-rituel text-2xl leading-tight">
            {content}
          </h3>,
        );
      else
        blocks.push(
          <h4
            key={`h${key++}`}
            className="mb-2 mt-5 font-mono-eclat text-[11px] uppercase tracking-rituel text-laiton"
          >
            {content}
          </h4>,
        );
      continue;
    }
    const listItem = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
    if (listItem) {
      flushParagraph();
      list.push(listItem[1]);
      continue;
    }
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote
          key={`q${key++}`}
          className="mb-4 border-s-2 border-laiton/50 ps-4 font-serif-rituel text-lg italic leading-snug text-foreground/80"
        >
          {renderInline(quote[1], `q${key}`)}
        </blockquote>,
      );
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  flushTable();

  return <Fragment>{blocks}</Fragment>;
}
