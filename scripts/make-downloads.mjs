// Build the files teachers download:
//   practice-pack/       -> public/ai-lab.zip   (extracted to C:\ai-lab by setup.bat)
//   downloads-src/setup.bat -> public/setup.bat
//
// In the repo, agent instruction files live under "_" names (_AGENTS.md, _agents/) so the
// agent developing this site does not pick them up; they get their real names in the zip.
import fs from "node:fs";
import path from "node:path";
import { zipSync, unzipSync } from "fflate";

const root = path.resolve(import.meta.dirname, "..");
const pack = path.join(root, "practice-pack");
const outDir = path.join(root, "public");
const { siteUrl } = JSON.parse(fs.readFileSync(path.join(root, "site.config.json"), "utf8"));

// Local test leftovers that must never ship.
const EXCLUDE = [/^mission1\/site\/./, /-result\.hwpx$/, /-values\.json$/, /(^|\/)\.DS_Store$/, /(^|\/)Thumbs\.db$/];

const REQUIRED = [
  "AGENTS.md",
  "CLAUDE.md",
  "README.txt",
  "start-agy.cmd",
  "start-codex.cmd",
  "start-claude.cmd",
  ".agents/skills/school-hwpx/SKILL.md",
  ".claude/skills/school-hwpx/SKILL.md",
  "tools/hwpx-fill.mjs",
  "tools/claw-hwp/LICENSE",
  "tools/claw-hwp/scripts/hwpx-edit.js",
  "tools/claw-hwp/scripts/vendor/fflate/index.mjs",
  "mission1/site/",
  "mission2/notice-form.hwpx",
  "mission2/notice-memo.txt",
  "mission2/worksheet-form.hwpx",
  "mission2/worksheet-memo.txt",
  "samples/mission1/index.html",
  "samples/mission2/notice-sample.hwpx",
];

function walk(dir, prefix = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = prefix + e.name;
    return e.isDirectory() ? walk(path.join(dir, e.name), rel + "/") : [rel];
  });
}

function shippedNames(rel) {
  if (rel === "_AGENTS.md") return ["AGENTS.md"];
  if (rel === "_CLAUDE.md") return ["CLAUDE.md"];
  if (rel.startsWith("_agents/")) {
    const rest = rel.slice("_agents/".length);
    return [`.agents/${rest}`, `.claude/${rest}`];
  }
  return [rel];
}

// cmd.exe parses batch files in the OEM code page and needs CRLF: Korean text breaks
// the parser, and LF-only files break labels/goto. Enforce ASCII, normalize to CRLF.
function batchBytes(file, label) {
  const text = fs.readFileSync(file, "utf8");
  const bad = text.split(/\r?\n/).findIndex((line) => /[^\x00-\x7F]/.test(line));
  if (bad !== -1) throw new Error(`${label}: non-ASCII character on line ${bad + 1}`);
  return Buffer.from(text.replace(/\r?\n/g, "\r\n"), "ascii");
}

const entries = { "mission1/site/": new Uint8Array(0) };
for (const rel of walk(pack)) {
  if (EXCLUDE.some((re) => re.test(rel))) continue;
  const file = path.join(pack, rel);
  const bytes = /\.(cmd|bat)$/i.test(rel) ? batchBytes(file, `practice-pack/${rel}`) : fs.readFileSync(file);
  for (const name of shippedNames(rel)) entries[name] = new Uint8Array(bytes);
}

const zip = zipSync(entries, { level: 9 });
const names = Object.keys(unzipSync(zip));
const missing = REQUIRED.filter((n) => !names.includes(n));
if (missing.length) throw new Error(`ai-lab.zip is missing: ${missing.join(", ")}`);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "ai-lab.zip"), zip);
console.log(`public/ai-lab.zip  ${names.length} entries, ${(zip.length / 1024).toFixed(0)} KB`);

const batSrc = path.join(root, "downloads-src", "setup.bat");
if (fs.existsSync(batSrc)) {
  const bat = batchBytes(batSrc, "downloads-src/setup.bat");
  if (!bat.toString("ascii").includes(siteUrl)) throw new Error(`setup.bat does not point at ${siteUrl}`);
  fs.writeFileSync(path.join(outDir, "setup.bat"), bat);
  console.log(`public/setup.bat   ${bat.length} bytes, CRLF, ASCII`);
} else {
  console.warn("downloads-src/setup.bat not found yet - skipped");
}
