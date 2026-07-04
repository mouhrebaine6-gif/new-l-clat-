import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE || "http://localhost:4179";
const results = [];
const ok = (name, cond, detail = "") => {
  results.push({ name, pass: Boolean(cond), detail });
  console.log(`${cond ? "PASS" : "FAIL"} — ${name}${detail ? " :: " + detail : ""}`);
};

const ALL_FRAGMENTS = [
  "eveil",
  "souffle",
  "forge",
  "prisme",
  "atome",
  "eclipse",
  "horizon",
  "resonance",
  "ascension",
  "origine",
];

function seedScript(lang, scans) {
  return `(() => {
    localStorage.setItem("eclat_lang", ${JSON.stringify(lang)});
    const all = ${JSON.stringify(ALL_FRAGMENTS)};
    localStorage.setItem("eclat_porteur_v1", JSON.stringify({
      name: "Porteur", onboarded: true, serment: true,
      collected: ${scans > 0 ? "all" : "[]"},
      fragmentScanCounts: Object.fromEntries(all.map((id) => [id, ${scans}])),
    }));
  })()`;
}

async function newCtx(browser, { lang = "fr", scans = 40 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(seedScript(lang, scans));
  return ctx;
}

async function launchBrowser() {
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel });
    } catch {
      /* try next */
    }
  }
  return await chromium.launch();
}

async function waitForPage(page) {
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
}

/** Ouvre le palier d'un niveau (Surface/Lien/Sceau) du 1er fragment (déplié par défaut). */
async function openLevel(page, levelLabel) {
  await waitForPage(page);
  const palier = page.getByRole("button", { name: levelLabel }).first();
  try {
    await palier.waitFor({ state: "visible", timeout: 8000 });
  } catch {
    await page
      .getByRole("button", { name: /Éveil|Awakening|اليقظة/ })
      .first()
      .click();
    await palier.waitFor({ state: "visible", timeout: 8000 });
  }
  await palier.scrollIntoViewIfNeeded();
  await palier.click();
  await page.waitForTimeout(400);
}

async function playToResult(page) {
  for (let guard = 0; guard < 12; guard++) {
    const done = await page
      .getByText(/Palier éprouvé|Sceau maîtrisé|Tier tested|Seal mastered/i)
      .count();
    if (done) return true;
    const opts = page.locator('[data-testid="quiz-option"]');
    if ((await opts.count()) === 0) return false;
    await opts.first().click();
    await page.waitForTimeout(120);
    const confirm = page.getByRole("button", { name: /Confirmer|Confirm/ }).first();
    if ((await confirm.count()) > 0 && (await confirm.isEnabled().catch(() => false))) {
      await confirm.click();
      await page.waitForTimeout(250);
    }
    const advance = page
      .getByRole("button", { name: /Question suivante|Voir le résultat|Next question|See result/ })
      .first();
    if ((await advance.count()) > 0) {
      await advance.click();
      await page.waitForTimeout(300);
    }
  }
  return false;
}

// Débordement du CONTENU réel, en ignorant les calques fixed/pointer-events:none
// et le contenu clippé par un ancêtre overflow (ex. table défilable).
const overflowX = (page) =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    let maxRight = vw;
    let minLeft = 0;
    const clipped = (el) => {
      let n = el.parentElement;
      while (n && n !== document.body) {
        const ox = getComputedStyle(n).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden") return true;
        n = n.parentElement;
      }
      return false;
    };
    for (const el of document.querySelectorAll("body *")) {
      const s = getComputedStyle(el);
      if (s.position === "fixed" || s.pointerEvents === "none") continue;
      if (clipped(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > maxRight) maxRight = r.right;
      if (r.left < minLeft) minLeft = r.left;
    }
    return Math.round(Math.max(maxRight - vw, -minLeft));
  });

const isDisabled = async (page, re) => {
  const b = page.getByRole("button", { name: re }).first();
  return (await b.count()) > 0 ? b.isDisabled() : null;
};

const browser = await launchBrowser();
try {
  // ── 1) FLUX COMPLET (FR, 40 scans) + avancement « maîtrisés 10/10 » ──
  {
    const ctx = await newCtx(browser, { lang: "fr", scans: 40 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/quiz`, { waitUntil: "load" });
    await waitForPage(page);

    const h1 = (await page.locator("h1").first().innerText()).trim();
    ok(
      "/quiz rend la QuizPage (pas 404)",
      h1.length > 0 && !/not found|404/i.test(h1),
      `h1="${h1}"`,
    );

    const mastered = await page.getByText(/10\s*\/\s*10/).count();
    ok("Avancement « Fragments maîtrisés 10/10 » à 40 scans", mastered > 0);

    await openLevel(page, /Surface/);
    const optCount = await page.locator('[data-testid="quiz-option"]').count();
    ok("Surface ouvrable → question affichée", optCount === 4, `options=${optCount}`);
    ok("Flux complet → écran de résultat", await playToResult(page));
    ok("Pas de débordement horizontal (390px)", (await overflowX(page)) <= 2);
    await page.screenshot({ path: "qa-quiz-mobile-fr.png" });
    await ctx.close();
  }

  // ── 2) TRILINGUE (sans retombée FR) ──
  {
    const ctx = await newCtx(browser, { lang: "en", scans: 40 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/quiz`, { waitUntil: "load" });
    await openLevel(page, /Surface/);
    const prompt = (await page.locator("h2").first().innerText()).trim();
    ok(
      "EN : question en anglais (pas de retombée FR)",
      /taped|workshop|door/i.test(prompt) && !/scotch|atelier/i.test(prompt),
      `h2="${prompt.slice(0, 50)}"`,
    );
    await ctx.close();
  }
  {
    const ctx = await newCtx(browser, { lang: "ar", scans: 40 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/quiz`, { waitUntil: "load" });
    await waitForPage(page);
    const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
    ok("AR : document RTL (dir=rtl)", dir === "rtl", `dir=${dir}`);
    await openLevel(page, /السطح/);
    const prompt = (await page.locator("h2").first().innerText()).trim();
    ok(
      "AR : question en arabe (pas FR)",
      /[؀-ۿ]/.test(prompt) && !/scotch|atelier/i.test(prompt),
      `h2="${prompt.slice(0, 36)}"`,
    );
    ok("AR : pas de débordement horizontal (390px)", (await overflowX(page)) <= 2);
    await page.screenshot({ path: "qa-quiz-mobile-ar.png" });
    await ctx.close();
  }

  // ── 3) GATING ANTI-SPOILER (la matrice 0/1/20/40) ──
  {
    // 3a — 0 scan : AUCUN palier ouvrable + AUCUN texte de question/option dans le DOM
    const ctx = await newCtx(browser, { lang: "fr", scans: 0 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/quiz`, { waitUntil: "load" });
    await waitForPage(page);
    ok("0 scan : Surface verrouillée", (await isDisabled(page, /Surface/)) === true);
    ok("0 scan : Lien verrouillé", (await isDisabled(page, /Lien|Bond/)) === true);
    ok("0 scan : Sceau verrouillé", (await isDisabled(page, /Sceau|Seal/)) === true);
    const body0 = (await page.evaluate(() => document.body.innerText)).toLowerCase();
    ok(
      "0 scan : AUCUN texte de question/option dans le DOM (anti-spoiler)",
      !body0.includes("scotch") && !body0.includes("inventaire") && !body0.includes("atelier"),
    );
    await page.screenshot({ path: "qa-quiz-sealed-0scan.png" });
    await ctx.close();
  }
  {
    // 3b — exactement 1 scan : Surface ouvrable, Lien/Sceau scellés
    const ctx = await newCtx(browser, { lang: "fr", scans: 1 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/quiz`, { waitUntil: "load" });
    await waitForPage(page);
    ok("1 scan : Surface ouvrable", (await isDisabled(page, /Surface/)) === false);
    ok("1 scan : Lien encore scellé", (await isDisabled(page, /Lien|Bond/)) === true);
    ok("1 scan : Sceau encore scellé", (await isDisabled(page, /Sceau|Seal/)) === true);
    const hasNeed = await page.getByText(/Encore\s+\d+\s+scans/i).count();
    ok("1 scan : « encore N scans » affiché sur les paliers scellés", hasNeed > 0);
    await ctx.close();
  }
  {
    // 3c — 20 scans : Lien ouvrable, Sceau scellé
    const ctx = await newCtx(browser, { lang: "fr", scans: 20 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/quiz`, { waitUntil: "load" });
    await waitForPage(page);
    ok("20 scans : Lien ouvrable", (await isDisabled(page, /Lien|Bond/)) === false);
    ok("20 scans : Sceau encore scellé", (await isDisabled(page, /Sceau|Seal/)) === true);
    await ctx.close();
  }
  {
    // 3d — 40 scans : Sceau ouvrable
    const ctx = await newCtx(browser, { lang: "fr", scans: 40 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/quiz`, { waitUntil: "load" });
    await waitForPage(page);
    ok("40 scans : Sceau ouvrable", (await isDisabled(page, /Sceau|Seal/)) === false);
    await ctx.close();
  }

  // ── 4) COMPAGNON gaté (inchangé) : verrouillé avant, accessible après ──
  {
    const ctx = await newCtx(browser, { lang: "fr", scans: 0 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/compagnon`, { waitUntil: "load" });
    await waitForPage(page);
    ok(
      "Compagnon VERROUILLÉ avant le palier profond",
      (await page.getByText(/Compagnon scellé|Companion sealed/i).count()) > 0,
    );
    ok(
      "Aucune analyse exposée quand verrouillé",
      (await page.getByRole("button", { name: /Analyse I|Analysis I/ }).count()) === 0,
    );
    await ctx.close();
  }
  {
    const ctx = await newCtx(browser, { lang: "fr", scans: 40 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/compagnon`, { waitUntil: "load" });
    await waitForPage(page);
    await page
      .getByRole("button", { name: /Analyse I|Analysis I/ })
      .first()
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {});
    ok(
      "Compagnon ACCESSIBLE après roman achevé (10/10)",
      (await page.getByRole("button", { name: /Analyse I|Analysis I/ }).count()) > 0,
    );
    await ctx.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) {
  console.error("FAILED:", failed.map((f) => f.name).join(" | "));
  process.exit(1);
}
console.log("OK — captures: qa-quiz-mobile-fr/ar.png, qa-quiz-sealed-0scan.png");
