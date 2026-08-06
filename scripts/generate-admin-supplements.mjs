/**
 * Generate admin locale supplements by reusing main-locale strings where keys match.
 * Run: node scripts/generate-admin-supplements.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadAdminPartial(file) {
  let s = fs.readFileSync(file, "utf8");
  s = s.replace(/^import[\s\S]*?;\r?\n/gm, "");
  s = s.replace(/\} as const;\s*$/m, "}");
  s = s.replace(/export default[\s\S]*$/m, "");
  const m = s.match(/const admin\w+ = (\{[\s\S]*\});?\s*$/);
  if (!m) throw new Error(`parse fail ${file}`);
  return new Function(`return ${m[1]}`)();
}

function loadMainLocale(loc) {
  const file = path.join(root, `lib/i18n/locales/${loc === "zh" ? "zh" : loc}.ts`);
  const raw = fs.readFileSync(file, "utf8");
  const marker = loc === "zh" ? "const zh = {" : loc === "he" ? "const he = {" : "const ar = {";
  const start = raw.indexOf(marker);
  const end = raw.indexOf("\n  admin:");
  if (start === -1 || end === -1) throw new Error(`main locale parse fail ${file}`);
  let body = raw.slice(start + marker.length - 1, end).trim();
  if (body.endsWith(",")) body = body.slice(0, -1);
  return new Function(`return ${body}`)();
}

function extractKeys(obj, prefix = "") {
  const keys = [];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...extractKeys(v, p));
      else keys.push(p);
    }
  }
  return keys;
}

function getAt(obj, dotPath) {
  return dotPath.split(".").reduce((o, k) => o?.[k], obj);
}

function setAt(obj, dotPath, value) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function buildMissingTree(en, partial) {
  const tree = {};
  const partialSet = new Set(extractKeys(partial));
  for (const k of extractKeys(en)) {
    if (!partialSet.has(k)) setAt(tree, k, getAt(en, k));
  }
  return tree;
}

/** Try to find a translated string in the main app locale. */
function lookupMain(main, dotPath, enValue) {
  const direct = getAt(main, dotPath.replace(/^pages\./, ""));
  if (typeof direct === "string" && direct !== enValue) return direct;

  const parts = dotPath.split(".");
  const leaf = parts[parts.length - 1];

  // pages.faq.title -> faq.title
  if (parts[0] === "pages" && parts.length >= 3) {
    const section = parts[1];
    const subPath = parts.slice(2).join(".");
    const fromPage = getAt(main, `${section}.${subPath}`);
    if (typeof fromPage === "string" && fromPage !== enValue) return fromPage;
    const fromFaq = section === "faq" ? getAt(main.faq, subPath) : undefined;
    if (typeof fromFaq === "string" && fromFaq !== enValue) return fromFaq;
  }

  if (parts[0] === "common") {
    const fromCommon = getAt(main.common, leaf);
    if (typeof fromCommon === "string" && fromCommon !== enValue) return fromCommon;
  }

  return undefined;
}

function serialize(obj, indent = 2) {
  const pad = (n) => " ".repeat(n);
  function ser(val, level) {
    if (typeof val === "string") {
      return JSON.stringify(val);
    }
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const entries = Object.entries(val);
      if (entries.length === 0) return "{}";
      const inner = entries
        .map(([k, v]) => `${pad(level + 2)}${/^[a-zA-Z_][\w]*$/.test(k) ? k : JSON.stringify(k)}: ${ser(v, level + 2)}`)
        .join(",\n");
      return `{\n${inner}\n${pad(level)}}`;
    }
    return JSON.stringify(val);
  }
  return ser(obj, 0);
}

const en = loadAdminPartial(path.join(root, "lib/i18n/locales/admin/en.ts"));

for (const loc of ["ar", "he", "zh"]) {
  const partial = loadAdminPartial(path.join(root, `lib/i18n/locales/admin/${loc}.ts`));
  const missing = buildMissingTree(en, partial);
  const mainLocale = loadMainLocale(loc);

  const supplement = {};
  let mapped = 0;
  let unmapped = 0;
  for (const k of extractKeys(missing)) {
    const enVal = getAt(missing, k);
    const found = lookupMain(mainLocale, k, enVal);
    if (found) {
      setAt(supplement, k, found);
      mapped++;
    } else {
      setAt(supplement, k, enVal);
      unmapped++;
    }
  }

  const outDir = path.join(root, "lib/i18n/locales/admin/supplements");
  fs.mkdirSync(outDir, { recursive: true });
  const varName = `admin${loc.charAt(0).toUpperCase() + loc.slice(1)}Supplement`;
  const content = `// Auto-generated supplement — ${mapped} reused from main locale, ${unmapped} need review\nexport const ${varName} = ${serialize(supplement)};\n`;
  fs.writeFileSync(path.join(outDir, `${loc}.ts`), content);
  console.log(`${loc}: mapped ${mapped}, still English ${unmapped}`);
}
