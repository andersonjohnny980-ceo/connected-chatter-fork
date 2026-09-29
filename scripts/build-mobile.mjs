/**
 * Builds the offline-capable bundle that ships inside the Android APK.
 *
 * Everything the app needs (HTML, styles, scripts, icons, animation player,
 * the Supabase client) is copied into mobile/www, so the phone never fetches
 * the app itself over the network. Backend URL + publishable key are injected
 * at build time exactly like the web route does.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "mobile", "www");

async function readEnv() {
  const env = { ...process.env };
  try {
    const raw = await fs.readFile(path.join(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env in CI — values come from repository secrets */
  }
  return env;
}

async function copyInto(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

async function copyDir(from, to) {
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const e of entries) {
    const src = path.join(from, e.name);
    const dst = path.join(to, e.name);
    if (e.isDirectory()) await copyDir(src, dst);
    else await copyInto(src, dst);
  }
}

const env = await readEnv();
let fallback = {};
try {
  fallback = JSON.parse(await fs.readFile(path.join(root, "mobile", "env.json"), "utf8"));
} catch {
  /* optional */
}
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || fallback.url || "";
const key = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || fallback.key || "";
if (!url || !key) {
  console.error(
    "Missing backend configuration. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (publishable key is safe to expose).",
  );
  process.exit(1);
}

let html = await fs.readFile(path.join(root, "src", "xchat-app.html"), "utf8");
const configScript = `<script>window.__XCHAT_CONFIG__=${JSON.stringify({ url, key }).replaceAll("<", "\\u003c")};</script>`;
html = html
  .replace('<script src="/lottie.min.js" defer></script>', `${configScript}\n<script src="/lottie.min.js" defer></script>`)
  .replaceAll("__SUPABASE_URL__", url)
  .replaceAll("__SUPABASE_PUBLISHABLE_KEY__", key)
  // Inside the APK every asset is local and relative.
  .replaceAll('src="/', 'src="')
  .replaceAll('href="/', 'href="');

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out, "index.html"), html, "utf8");

const publicDir = path.join(root, "public");
for (const name of [
  "lottie.min.js",
  "native-bridge.js",
  "manifest.webmanifest",
  "splash.json",
  "favicon.png",
  "favicon.ico",
]) {
  try {
    await copyInto(path.join(publicDir, name), path.join(out, name));
  } catch {
    console.warn(`skipped missing ${name}`);
  }
}
await copyDir(path.join(publicDir, "icons"), path.join(out, "icons"));
await copyDir(path.join(publicDir, "vendor"), path.join(out, "vendor"));

console.log(`mobile bundle ready: ${path.relative(root, out)}`);
