// Rebuild the practice HWPX forms from docs/forms/*.create.json.
//
//   CLAW_HWP_SCRIPTS=<full claw-hwp skills/hwp/scripts dir> node scripts/make-forms.mjs
//
// create.js needs the full upstream engine (rhwp WASM), which is NOT shipped in the
// practice pack, so point CLAW_HWP_SCRIPTS at an upstream checkout (commit 05cf0cb).
// The sample is then filled the way teachers do it in period 3: with the hwpx skill
// (jkf87/hwpx-skill) and Python. HWPX_SKILL_SCRIPTS overrides its scripts folder.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const engine = process.env.CLAW_HWP_SCRIPTS;
if (!engine || !fs.existsSync(path.join(engine, "create.js"))) {
  console.error("Set CLAW_HWP_SCRIPTS to the upstream claw-hwp skills/hwp/scripts directory.");
  process.exit(1);
}

function run(script, payload) {
  const r = spawnSync(process.execPath, [script], { cwd: root, input: Buffer.from(payload, "utf8"), encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  if (out.status === "error" || out.ok === false) throw new Error(`${path.basename(script)}: ${out.message || out.error}`);
  return out;
}

// Paragraph 0 also carries the section definition and ignores apply_text_style size in
// the rhwp renderer, so each form starts with a small info line and the title comes second.
// -h: the high-school copies (가상고등학교); the rest is the middle-school set.
for (const name of ["notice-form", "notice-form-h", "worksheet-form", "worksheet-form-h"]) {
  const def = fs.readFileSync(path.join(root, "docs/forms", `${name}.create.json`), "utf8");
  run(path.join(engine, "create.js"), def);
  console.log(`built ${JSON.parse(def).path}`);
}

const skill = process.env.HWPX_SKILL_SCRIPTS || path.join(os.homedir(), ".agents", "skills", "hwpx", "scripts");
const values = JSON.parse(fs.readFileSync(path.join(root, "docs/forms/notice-sample.values.json"), "utf8"));
const map = Object.fromEntries(Object.entries(values).map(([k, v]) => [k.startsWith("{{") ? k : `{{${k}}}`, v]));
const mapFile = path.join(os.tmpdir(), "notice-sample.map.json");
fs.writeFileSync(mapFile, JSON.stringify(map));
const fill = spawnSync(
  "python",
  [
    path.join(skill, "fill_hwpx.py"),
    "replace",
    "practice-pack/mission2/notice-form.hwpx",
    "practice-pack/samples/mission2/notice-sample.hwpx",
    "--map",
    mapFile,
  ],
  { cwd: root, encoding: "utf8", env: { ...process.env, PYTHONUTF8: "1" } },
);
if (fill.status !== 0) throw new Error(`sample fill failed: ${fill.stdout}${fill.stderr}`);
console.log("built practice-pack/samples/mission2/notice-sample.hwpx");
