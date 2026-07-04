import { chromium } from "@playwright/test";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const port = Number(process.env.LECLAT_PREVIEW_PORT || 4180);
const baseUrl = `http://127.0.0.1:${port}`;
const outDir = path.resolve(process.cwd(), "artifacts", "screenshots");
const edgePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const npmCli =
  process.env.npm_execpath ||
  (process.env.APPDATA
    ? path.join(process.env.APPDATA, "npm", "node_modules", "npm", "bin", "npm-cli.js")
    : "npm");

const waitForServer = (url, timeoutMs = 30_000) =>
  new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Preview did not start at ${url}`));
          return;
        }
        setTimeout(tick, 500);
      });
    };
    tick();
  });

const runNpm = (args) =>
  new Promise((resolve, reject) => {
    const child =
      npmCli === "npm"
        ? spawn("npm", args, { cwd: process.cwd(), stdio: "inherit" })
        : spawn(process.execPath, [npmCli, ...args], { cwd: process.cwd(), stdio: "inherit" });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`npm ${args.join(" ")} exited ${code}`)),
    );
  });

await runNpm(["run", "build:unity"]);

fs.mkdirSync(outDir, { recursive: true });
const preview =
  npmCli === "npm"
    ? spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)], {
        cwd: process.cwd(),
        stdio: "inherit",
      })
    : spawn(
        process.execPath,
        [npmCli, "run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)],
        {
          cwd: process.cwd(),
          stdio: "inherit",
        },
      );

try {
  await waitForServer(baseUrl);
  const browser = await chromium.launch(
    fs.existsSync(edgePath)
      ? {
          executablePath: edgePath,
          headless: true,
          args: ["--autoplay-policy=no-user-gesture-required"],
        }
      : { channel: "msedge", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] },
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await context.addInitScript(() => {
    localStorage.setItem(
      "eclat_porteur_v1",
      JSON.stringify({
        name: "Porteur",
        sceauId: "LV-777-AR",
        collected: ["eveil"],
        scans: 3,
        createdAt: Date.now(),
        serment: true,
        onboarded: true,
        intention: "Voir ce que le Voile cache encore.",
      }),
    );
  });

  for (const [name, route] of [
    ["home", "/#/"],
    ["scan", "/#/scan"],
    ["boutique", "/#/boutique"],
    ["fragments", "/#/fragments"],
    ["profil", "/#/profil"],
  ]) {
    const page = await context.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
    console.log(`captured ${name}`);
    await page.close();
  }

  const readFragmentVideos = (page) =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll("video[data-fragment-video='1']")).map((video, i) => {
        const rect = video.getBoundingClientRect();
        return {
          i,
          paused: video.paused,
          readyState: video.readyState,
          currentTime: Number(video.currentTime.toFixed(2)),
          visible: rect.bottom > 0 && rect.top < window.innerHeight,
        };
      }),
    );

  const assertFocusedFragmentPlayback = async (page, label) => {
    const videos = await readFragmentVideos(page);
    const playing = videos.filter((video) => !video.paused);
    const playingVisible = playing.filter((video) => video.visible);

    if (videos.length !== 10) {
      throw new Error(`${label}: expected 10 fragment videos, found ${videos.length}`);
    }
    if (playing.length !== 1 || playingVisible.length !== 1) {
      throw new Error(
        `${label}: expected exactly one visible fragment video playing, got ${playing.length} total / ${playingVisible.length} visible`,
      );
    }
    if (playingVisible[0].currentTime <= 0) {
      throw new Error(`${label}: active fragment video did not advance`);
    }
  };

  const fragmentsPage = await context.newPage();
  await fragmentsPage.goto(`${baseUrl}/#/fragments`, { waitUntil: "domcontentloaded" });
  await fragmentsPage.waitForTimeout(2400);
  await assertFocusedFragmentPlayback(fragmentsPage, "fragments top");
  await fragmentsPage.evaluate(() => window.scrollTo({ top: 880, behavior: "instant" }));
  await fragmentsPage.waitForTimeout(2200);
  await assertFocusedFragmentPlayback(fragmentsPage, "fragments scroll");
  await fragmentsPage.close();
  console.log("verified focused fragment video playback");

  const page = await context.newPage();
  await page.goto(`${baseUrl}/#/scan`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    window.__eclat__?.receive({
      type: "SCAN_RESULT",
      payload: {
        qr_token: `qa-eveil-${Date.now()}`,
        fragment_hint: "eveil",
        timestamp: Date.now(),
      },
      ts: Date.now(),
      bridgeVersion: "1.0.0",
      nonce: window.__eclat__?.sessionNonce,
    });
  });
  await page.waitForTimeout(3400);
  await page.screenshot({ path: path.join(outDir, "scan-reveal.png"), fullPage: false });
  await page.close();

  await browser.close();
  console.log(`visual smoke complete: ${outDir}`);
} finally {
  preview.kill();
  if (process.platform === "win32") {
    spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `$p = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`,
      ],
      { stdio: "ignore" },
    );
  }
}
