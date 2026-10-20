// Run the real mission prompts through each CLI on a fresh copy of the practice pack
// and check the results. Uses the logged-in accounts on this PC (consumes some quota).
//
//   node scripts/verify-missions.mjs [--tools claude,codex,agy] [--missions m1,m2,m2x] [--runs 1] [--out <dir>]
//
// Runs with permission prompts disabled because nobody is there to click "approve";
// each run gets its own throwaway folder.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { unzipSync } from "fflate";

const root = path.resolve(import.meta.dirname, "..");
const prompts = JSON.parse(fs.readFileSync(path.join(root, "content/prompts.json"), "utf8"));
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : process.argv[i + 1];
};
const tools = arg("tools", "claude,codex,agy").split(",");
const missions = arg("missions", "m1,m2,m2x").split(",");
const runs = Number(arg("runs", "1"));
const outRoot = arg("out", path.join(os.tmpdir(), `ai-lab-verify-${Date.now()}`));
const TIMEOUT_MS = 8 * 60 * 1000;

const local = process.env.LOCALAPPDATA;
const home = os.homedir();
const exe = {
  claude: path.join(home, ".local", "bin", "claude.exe"),
  // VERIFY_CODEX_EXE: test a newer Codex build without updating the installed one
  codex: process.env.VERIFY_CODEX_EXE || path.join(local, "Programs", "OpenAI", "Codex", "bin", "codex.exe"),
  agy: path.join(local, "agy", "bin", "agy.exe"),
};
const command = {
  claude: (p) => [exe.claude, ["-p", p, "--dangerously-skip-permissions", "--output-format", "json"]],
  // -m: a personal ~/.codex/config.toml may pin a model ChatGPT sign-in cannot use;
  // a fresh teacher install has no such file, so pin the account's listed default here.
  codex: (p) => [
    exe.codex,
    ["exec", "--skip-git-repo-check", "-s", "workspace-write", "-m", process.env.VERIFY_CODEX_MODEL || "gpt-6-luna", p],
  ],
  agy: (p) => [exe.agy, ["-p", p, "--dangerously-skip-permissions", "--output-format", "json"]],
};

function extractPack(dir) {
  const files = unzipSync(fs.readFileSync(path.join(root, "public", "ai-lab.zip")));
  for (const [name, bytes] of Object.entries(files)) {
    const target = path.join(dir, name);
    if (name.endsWith("/")) fs.mkdirSync(target, { recursive: true });
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
    }
  }
}

const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const hwpxText = (dir, f) =>
  spawnSync(process.execPath, ["tools/hwpx-fill.mjs", "--text", f], { cwd: dir, encoding: "utf8" }).stdout;

const checks = {
  m1(dir) {
    const f = path.join(dir, "mission1/site/index.html");
    if (!fs.existsSync(f)) return ["index.html 없음"];
    const html = fs.readFileSync(f, "utf8");
    const problems = [];
    if (html.length < 1500) problems.push(`너무 짧음(${html.length}자)`);
    if (!/name=["']viewport["']/.test(html)) problems.push("viewport 없음");
    if (/<(script|link)[^>]+(src|href)=["']https?:/i.test(html)) problems.push("외부 리소스 사용");
    return problems;
  },
  m2(dir, before) {
    const f = path.join(dir, "mission2/notice-result.hwpx");
    if (!fs.existsSync(f)) return ["notice-result.hwpx 없음"];
    const problems = [];
    if (fs.readFileSync(f).subarray(0, 2).toString() !== "PK") problems.push("ZIP 아님");
    const text = hwpxText(dir, "mission2/notice-result.hwpx");
    if (text.includes("{{")) problems.push("빈 칸 남음");
    for (const k of ["미래과학관", "12일", "5일"]) if (!text.includes(k)) problems.push(`'${k}' 없음`);
    // a sentence that only exists in samples/ - the agent should write its own text
    if (text.includes("다양한 직업 세계를 직접 보고 느끼며")) problems.push("완성 예시 문장을 복사함");
    if (sha(path.join(dir, "mission2/notice-form.hwpx")) !== before.notice) problems.push("원본 양식이 바뀜");
    return problems;
  },
  m2x(dir, before) {
    const f = path.join(dir, "mission2/worksheet-result.hwpx");
    if (!fs.existsSync(f)) return ["worksheet-result.hwpx 없음"];
    const problems = [];
    const text = hwpxText(dir, "mission2/worksheet-result.hwpx");
    if (text.includes("{{")) problems.push("빈 칸 남음");
    for (const k of ["정보", "순서도"]) if (!text.includes(k)) problems.push(`'${k}' 없음`);
    if (sha(path.join(dir, "mission2/worksheet-form.hwpx")) !== before.worksheet) problems.push("원본 양식이 바뀜");
    return problems;
  },
};

function runOne(tool, mission, n) {
  const dir = path.join(outRoot, `${tool}-${mission}-${n}`);
  fs.mkdirSync(dir, { recursive: true });
  extractPack(dir);
  const before = {
    notice: sha(path.join(dir, "mission2/notice-form.hwpx")),
    worksheet: sha(path.join(dir, "mission2/worksheet-form.hwpx")),
  };
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k === "CLAUDECODE" || k.startsWith("CLAUDE_CODE_")) delete env[k];
  const [bin, args] = command[tool](prompts[mission]);
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(bin, args, { cwd: dir, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    const timer = setTimeout(() => child.kill(), TIMEOUT_MS);
    child.on("close", (code) => {
      clearTimeout(timer);
      fs.writeFileSync(path.join(dir, "_agent-output.txt"), out);
      const problems = checks[mission](dir, before);
      resolve({ tool, mission, run: n, seconds: Math.round((Date.now() - started) / 1000), exit: code, ok: problems.length === 0, problems, dir });
    });
  });
}

fs.mkdirSync(outRoot, { recursive: true });
console.log(`output: ${outRoot}`);
// Tools run in parallel; each tool's missions run one after another to stay under rate limits.
const results = (
  await Promise.all(
    tools.map(async (tool) => {
      const mine = [];
      for (let n = 1; n <= runs; n++)
        for (const m of missions) {
          const r = await runOne(tool, m, n);
          console.log(`${r.ok ? "PASS" : "FAIL"} ${tool} ${m} #${n} ${r.seconds}s ${r.problems.join("; ")}`);
          mine.push(r);
        }
      return mine;
    }),
  )
).flat();
fs.writeFileSync(path.join(outRoot, "summary.json"), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
