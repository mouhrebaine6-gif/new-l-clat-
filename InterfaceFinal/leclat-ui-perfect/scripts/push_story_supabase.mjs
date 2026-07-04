// Pousse les 90 segments (30 × fr/en/ar) vers public.story_segments (upsert).
// Nécessite la fenêtre d'écriture temporaire (policies story_seed_tmp_*).
import fs from "fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_ = env.VITE_SUPABASE_URL,
  KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!URL_ || !KEY) throw new Error("env Supabase manquant");

const load = (p) => {
  const s = fs.readFileSync(p, "utf8");
  return eval(s.slice(s.indexOf("= [") + 2, s.lastIndexOf("]") + 1));
};
const rows = [];
for (const [lang, path] of [
  ["fr", "src/data/storySegments.ts"],
  ["en", "src/data/storySegments.en.ts"],
  ["ar", "src/data/storySegments.ar.ts"],
]) {
  load(path).forEach((paragraphs, segment_index) =>
    rows.push({ lang, segment_index, paragraphs, updated_at: new Date().toISOString() }),
  );
}
console.log("rows:", rows.length);

const res = await fetch(`${URL_}/rest/v1/story_segments?on_conflict=lang,segment_index`, {
  method: "POST",
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  },
  body: JSON.stringify(rows),
});
console.log("HTTP", res.status);
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
console.log("UPSERT OK");
