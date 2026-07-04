import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["src/data", "src/pages", "src/components", "src/lib"];
const forbidden = [
  "SERVER_ONLY",
  "LE_SEUIL_CANON_FINAL",
  "SERVER_SIDE_LORE_MASTER",
  "Porteur Clos",
  "Les Architectes",
  "Architectes",
  "La Tisserande",
  "Tisserande",
  "Les Veilleurs",
  "Grand Scellement",
  "Veilleuse",
  "Artisans",
  "correction d'epreuve",
  "20 scans",
  "40 scans",
  "40 scans secret",
  "deep lore",
  "vous êtes Nahil",
  "tu es Nahil",
];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css"]);

/**
 * Détection de texte long embarqué côté client (anti-fuite de récit).
 *
 * Le roman complet ne doit JAMAIS être livré dans le bundle (cf.
 * clientSafeManifest.ts). On scanne `src/data/` (où vit la donnée narrative) à
 * la recherche de fichiers contenant beaucoup de LIGNES LONGUES — signature
 * d'un dump de prose (paragraphes de roman). Heuristique délimiteur-agnostique
 * et robuste (le français regorge d'apostrophes qui piègent une extraction de
 * littéraux). Les classes Tailwind vivent dans src/pages|components et ne sont
 * donc pas inspectées ici.
 *
 * `LONG_TEXT_ALLOW` baseline les fichiers de contenu INTENTIONNEL déjà validés
 * client-safe (roman canon non modifiable, lore fragments, quiz gaté). Le but
 * est de bloquer toute NOUVELLE prose embarquée par accident.
 */
const LONG_LINE = 240; // caractères : un paragraphe de roman dépasse, pas un libellé
const MAX_LONG_LINES = 4; // au-delà → probable dump de prose
const LONG_TEXT_ROOT = "src/data";
const LONG_TEXT_ALLOW = new Set([
  "storysegments.ts",
  "storysegments.en.ts",
  "storysegments.ar.ts",
  "storyunlocks.ts",
  "fragments.ts",
  "quiz.ts",
  "quizleclat.ts",
]);

const found = [];

function stripComments(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function countLongProseLines(content) {
  return content.split(/\r?\n/).filter((line) => line.trim().length > LONG_LINE).length;
}

async function walk(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }

    const ext = entry.name.slice(entry.name.lastIndexOf("."));
    if (!extensions.has(ext)) continue;

    const raw = await readFile(path, "utf8");
    const content = stripComments(raw);
    for (const pattern of forbidden) {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        found.push(`${path}: marqueur interdit « ${pattern} »`);
      }
    }

    // Texte long embarqué : seulement sous src/data, hors fichiers baseline.
    const normalizedDir = dir.replaceAll("\\", "/");
    if (
      normalizedDir.startsWith(LONG_TEXT_ROOT) &&
      !LONG_TEXT_ALLOW.has(entry.name.toLowerCase())
    ) {
      const longLines = countLongProseLines(raw);
      if (longLines > MAX_LONG_LINES) {
        found.push(
          `${path}: ${longLines} lignes de prose longue (> ${LONG_LINE} car.) — ` +
            `probable récit embarqué côté client (à servir via backend / lazy-load)`,
        );
      }
    }
  }
}

for (const root of roots) {
  await walk(root);
}

if (found.length) {
  console.error("Client-safe check failed:");
  for (const item of found) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Client-safe check passed.");
