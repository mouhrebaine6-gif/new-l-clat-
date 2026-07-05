// Garde-fou arabe : normalise NFC les fichiers touchés et signale tout changement.
import fs from "fs";
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, "utf8");
  const nfc = src.normalize("NFC");
  if (src !== nfc) { fs.writeFileSync(f, nfc, "utf8"); console.log("NORMALISÉ:", f); }
  else console.log("déjà NFC:", f);
}
