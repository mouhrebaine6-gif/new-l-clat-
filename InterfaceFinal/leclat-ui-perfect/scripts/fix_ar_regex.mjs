// \b ne fonctionne pas après un caractère arabe en JS (non "word char") →
// les regex AR du Compagnon ne matchaient jamais. Remplacé par (?=\s|$).
import fs from "fs";

const p = "src/pages/CompagnonPage.tsx";
let s = fs.readFileSync(p, "utf8");
const before = s;
s = s.replace(/ar: \/\^#\\s\+(الجزء [^\\]+)\\b\/m/g, "ar: /^#\\s+$1(?=\\s|$)/m");
const n = (before.match(/ar: \/\^#\\s\+الجزء/g) || []).length;
const fixed = (s.match(/\(\?=\\s\|\$\)/g) || []).length;
if (fixed !== n || n < 4) throw new Error(`corrigées ${fixed}/${n}`);
fs.writeFileSync(p, s.normalize("NFC"), "utf8");
console.log(`OK — ${fixed} regex AR corrigées`);
