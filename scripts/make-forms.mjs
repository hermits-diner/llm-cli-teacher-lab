// Rebuild the practice HWPX forms from docs/forms/*.create.json.
//
//   CLAW_HWP_SCRIPTS=<full claw-hwp skills/hwp/scripts dir> node scripts/make-forms.mjs
//
// create.js needs the full upstream engine (rhwp WASM), which is NOT shipped in the
// practice pack, so point CLAW_HWP_SCRIPTS at an upstream checkout (commit 05cf0cb).
import fs from "node:fs";
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
for (const name of ["notice", "worksheet"]) {
  const def = fs.readFileSync(path.join(root, "docs/forms", `${name}-form.create.json`), "utf8");
  run(path.join(engine, "create.js"), def);
  console.log(`built ${JSON.parse(def).path}`);
}

const fill = spawnSync(
  process.execPath,
  ["practice-pack/tools/hwpx-fill.mjs", "practice-pack/mission2/notice-form.hwpx", "docs/forms/notice-sample.values.json", "practice-pack/samples/mission2/notice-sample.hwpx"],
  { cwd: root, encoding: "utf8" },
);
if (fill.status !== 0) throw new Error(`sample fill failed: ${fill.stdout}`);
console.log("built practice-pack/samples/mission2/notice-sample.hwpx");
