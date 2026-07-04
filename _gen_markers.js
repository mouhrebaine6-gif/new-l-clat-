// _gen_markers.js — Génère 10 marqueurs AR (JPG 512x512 qualité 90) depuis les visuels buildés.
// Usage : node _gen_markers.js
const fs = require("fs");
const path = require("path");
const sharp = require(
  "D:/LECLAT/InterfaceFinal/leclat-ui-perfect/node_modules/sharp",
);

const SRC = "D:/LECLAT/InterfaceFinal/leclat-ui-perfect/public/fragments";
const OUT_STREAMING = "D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/Assets/StreamingAssets/LECLAT/Markers";
const OUT_RESOURCES = "D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/Assets/Resources/LECLAT";

const FRAGMENTS = [
  "eveil", "souffle", "forge", "prisme", "atome",
  "eclipse", "horizon", "resonance", "ascension", "origine",
];

const MARKER_SIZE = 512; // px, optimal pour ARCore + Vuforia
const QUALITY = 90;      // JPG quality

async function makeMarker(frag) {
  const srcPath = path.join(SRC, `${frag}.jpg`);
  if (!fs.existsSync(srcPath)) {
    console.warn(`  ⚠ source absente: ${srcPath}`);
    return false;
  }
  const outName = `FRAGMENT_${frag.toUpperCase()}_MARKER.jpg`;
  const outStreaming = path.join(OUT_STREAMING, outName);
  const outResources = path.join(OUT_RESOURCES, outName);

  await sharp(srcPath)
    .resize(MARKER_SIZE, MARKER_SIZE, { fit: "cover", position: "center" })
    .sharpen({ sigma: 1.2 }) // Augmente les features AR (contraste local)
    .normalize()             // Étire l'histogramme pour max de contraste
    .modulate({ saturation: 1.1 }) // Couleurs un peu plus saturées
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: false })
    .toFile(outStreaming);

  // Copie dans Resources/ pour chargement runtime si besoin
  fs.copyFileSync(outStreaming, outResources);

  return true;
}

async function main() {
  console.log("Génération de 10 marqueurs AR...\n");
  for (const f of FRAGMENTS) {
    process.stdout.write(`  ${f.padEnd(12)} ... `);
    const ok = await makeMarker(f);
    console.log(ok ? "✓" : "✗");
  }
  console.log(`\n✓ Terminé. Markers dans :\n  ${OUT_STREAMING}\n  ${OUT_RESOURCES}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
