// _gen_wings.js — Copie 10 ailes optimisées mobile (1 par fragment) vers le projet Unity.
// Source : ModelLibrary_Curated/AR_READY_SELECTION_20260515/01_WINGS_BACK_ATTACHMENT/
// Priorité : MOBILE_OPTIMIZED > MOBILE_LITE > RAW_COPY
const fs = require("fs");
const path = require("path");

const SRC_BASE =
  "D:/LECLAT/ModelLibrary_Curated/AR_READY_SELECTION_20260515/01_WINGS_BACK_ATTACHMENT";
const OUT = "D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/Assets/StreamingAssets/LECLAT/Models/back_wings";

// Mapping fragment → sous-dossier de la library (le MOBILE_OPTIMIZED est prioritaire)
const MAPPING = [
  { fragment: "eveil", dir: "005_MODEL_0188_MODEL_0188_MODEL_0188_angel_wings.glb", note: "sobres, parfaites pour le prologue (Fosse/Ishiguro tone)" },
  { fragment: "souffle", dir: "008_MODEL_0500_MODEL_0500_wing_379.glb", note: "légères, aériennes, idéales pour un fragment de souffle" },
  { fragment: "forge", dir: "004_MODEL_0312_MODEL_0312_dragon_wings_blue.glb", note: "puissantes, parfaites pour la Forge" },
  { fragment: "prisme", dir: "010_MODEL_0215_641bb1e8b1094feabfa2784d97f4a194_Textured.gltf", note: "géométriques, à facettes, idéales pour un prisme" },
  { fragment: "atome", dir: "001_MODEL_0324_scene.gltf", note: "structure atomique, petites particules" },
  { fragment: "eclipse", dir: "013_MODEL_0240_MODEL_0240_angel_wings_1_.glb", note: "sombres, parfaites pour une éclipse" },
  { fragment: "horizon", dir: "002_MODEL_0135_scene.gltf", note: "vaste, atmosphérique" },
  { fragment: "resonance", dir: "005_MODEL_0188_MODEL_0188_MODEL_0188_angel_wings.glb", note: "en backup si resonance non-optimisé (fallback sobre)" },
  { fragment: "ascension", dir: "014_MODEL_0252_MODEL_0252_angel-wings.glb", note: "verticales, parfaites pour l'ascension" },
  { fragment: "origine", dir: "012_MODEL_0225_MODEL_0225_wings.glb", note: "originelles, simples" },
];

function pickBest(d) {
  const dir = path.join(SRC_BASE, d);
  if (!fs.existsSync(dir)) return null;
  // Priorité : MOBILE_OPTIMIZED > MOBILE_LITE > RAW_COPY
  const optimized = path.join(dir, "MOBILE_OPTIMIZED");
  const lite = path.join(dir, "MOBILE_LITE");
  const raw = path.join(dir, "RAW_COPY");
  for (const base of [optimized, lite, raw]) {
    if (!fs.existsSync(base)) continue;
    const files = fs.readdirSync(base).filter((f) => /\.(glb|gltf)$/i.test(f));
    if (files.length) return path.join(base, files[0]);
  }
  return null;
}

function main() {
  console.log("Copie de 10 ailes optimisées mobile (1 par fragment)...\n");
  for (const { fragment, dir, note } of MAPPING) {
    const src = pickBest(dir);
    if (!src) {
      console.log(`  ${fragment.padEnd(12)} ⚠ source absente (${dir})`);
      continue;
    }
    const ext = path.extname(src);
    const outName = `FRAGMENT_${fragment.toUpperCase()}${ext}`;
    const dst = path.join(OUT, outName);
    fs.copyFileSync(src, dst);
    const stat = fs.statSync(dst);
    console.log(
      `  ${fragment.padEnd(12)} ✓ ${(stat.size / 1024).toFixed(0)} Ko  (${note})`,
    );
  }
  console.log(`\n✓ Terminé. Ailes dans :\n  ${OUT}`);
}

main();
