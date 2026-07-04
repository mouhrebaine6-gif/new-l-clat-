import { readFileSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const sourceDir = resolve(projectRoot, "dist");
const unityProjectDir = resolveUnityProjectDir();
const targetDir = resolveUnityWebUiTarget();
const BLOCKED_UNITY_WEBUI_EXTENSIONS = new Set([
  ".bak",
  ".jsx",
  ".log",
  ".map",
  ".meta",
  ".tmp",
  ".ts",
  ".tsx",
]);

await assertWebBuildFile(join(sourceDir, "index.html"));
const unityRoot = await resolveUnityRoot(targetDir);
await assertUnityProject(unityRoot);
assertInsideStreamingAssets(unityRoot, targetDir);

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });
await copyDirectory(sourceDir, targetDir);

const indexHtml = await readFile(join(targetDir, "index.html"), "utf8");
await writeFile(
  join(targetDir, "build-info.json"),
  JSON.stringify(
    {
      name: "LECLAT WebUI Unity build",
      copiedAtUtc: new Date().toISOString(),
      sourceDir: normalize(sourceDir),
      targetDir: normalize(targetDir),
      indexBytes: Buffer.byteLength(indexHtml),
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(`Copied Unity WebUI to ${normalize(targetDir)}`);

function resolveUnityProjectDir() {
  if (process.env.LECLAT_UNITY_PROJECT_DIR) {
    return resolve(process.env.LECLAT_UNITY_PROJECT_DIR);
  }

  const hubProjectPath = findUnityHubProjectPath("LECLAT_AR_Mobile");
  return hubProjectPath ? resolve(hubProjectPath) : "";
}

function resolveUnityWebUiTarget() {
  if (process.env.LECLAT_UNITY_WEBUI_DIR) {
    return resolve(process.env.LECLAT_UNITY_WEBUI_DIR);
  }

  if (unityProjectDir) {
    return resolve(unityProjectDir, "Assets", "StreamingAssets", "LECLAT", "WebUI");
  }

  throw new Error(
    [
      "Missing Unity target. No usable LECLAT Unity project was detected.",
      "Unity Hub is checked automatically for a project named LECLAT_AR_Mobile.",
      "Set one of these environment variables before running build:unity:",
      "  LECLAT_UNITY_PROJECT_DIR=D:/path/to/active/UnityProject",
      "  LECLAT_UNITY_WEBUI_DIR=D:/path/to/active/UnityProject/Assets/StreamingAssets/LECLAT/WebUI",
    ].join("\n"),
  );
}

async function resolveUnityRoot(webUiDir) {
  if (unityProjectDir) return unityProjectDir;

  let current = resolve(webUiDir);
  for (let i = 0; i < 12; i++) {
    if (
      (await isFile(join(current, "ProjectSettings", "ProjectVersion.txt"))) &&
      (await isDir(join(current, "Assets")))
    ) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error(
    `Cannot find a Unity project root above ${normalize(webUiDir)}. ` +
      "Expected ProjectSettings/ProjectVersion.txt and Assets/.",
  );
}

async function assertUnityProject(root) {
  const projectVersionPath = join(root, "ProjectSettings", "ProjectVersion.txt");
  if (!(await isFile(projectVersionPath))) {
    throw new Error(
      [
        `Unity project folder was detected, but it is not available or not valid: ${normalize(root)}`,
        `Missing required Unity file: ${normalize(projectVersionPath)}`,
        "If this project exists in Unity Hub, restore or move the physical folder to this path,",
        "or set LECLAT_UNITY_PROJECT_DIR to the real active Unity project path.",
      ].join("\n"),
    );
  }

  if (!(await isDir(join(root, "Assets")))) {
    throw new Error(`Unity project is missing Assets directory: ${normalize(root)}`);
  }
}

function assertInsideStreamingAssets(root, destination) {
  const streamingRoot = resolve(root, "Assets", "StreamingAssets");
  const dest = normalizeLower(destination);
  const allowedRoot = normalizeLower(streamingRoot);
  if (dest !== allowedRoot && !dest.startsWith(`${allowedRoot}/`)) {
    throw new Error(
      `Refusing to copy WebUI outside Assets/StreamingAssets: ${normalize(destination)}`,
    );
  }
}

async function copyDirectory(from, to) {
  await mkdir(to, { recursive: true });
  const entries = await readdir(from, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(from, entry.name);
    const targetPath = join(to, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      const extension = extname(entry.name).toLowerCase();
      if (BLOCKED_UNITY_WEBUI_EXTENSIONS.has(extension)) {
        throw new Error(
          `Refusing to copy non-runtime file into Unity WebUI: ${normalize(sourcePath)}`,
        );
      }
      await copyFile(sourcePath, targetPath);
    }
  }
}

async function assertWebBuildFile(path) {
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) {
    throw new Error(`Unity WebUI build is missing required file: ${path}`);
  }
}

async function isFile(path) {
  const info = await stat(path).catch(() => null);
  return Boolean(info?.isFile());
}

async function isDir(path) {
  const info = await stat(path).catch(() => null);
  return Boolean(info?.isDirectory());
}

function findUnityHubProjectPath(projectTitle) {
  const configCandidates = [
    process.env.APPDATA ? join(process.env.APPDATA, "UnityHub", "projects-v1.json") : "",
    join(homedir(), "AppData", "Roaming", "UnityHub", "projects-v1.json"),
  ].filter(Boolean);

  for (const configPath of configCandidates) {
    try {
      const raw = readFileSync(configPath, "utf8");
      const parsed = JSON.parse(raw);
      const projects = parsed?.data && typeof parsed.data === "object" ? parsed.data : {};

      for (const [key, project] of Object.entries(projects)) {
        const path = typeof project?.path === "string" ? project.path : key;
        const title = typeof project?.title === "string" ? project.title : "";
        if (title === projectTitle || normalize(path).endsWith(`/${projectTitle}`)) {
          return path;
        }
      }
    } catch {
      // Unity Hub config is optional. Explicit env vars remain the authoritative fallback.
    }
  }

  return "";
}

function normalize(path) {
  return path.replaceAll("\\", "/");
}

function normalizeLower(path) {
  return normalize(resolve(path)).toLowerCase();
}
