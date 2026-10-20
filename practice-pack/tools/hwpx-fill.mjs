#!/usr/bin/env node
// Fill {{placeholders}} in a .hwpx form from a UTF-8 JSON file.
//
//   node tools/hwpx-fill.mjs --list <form.hwpx>
//   node tools/hwpx-fill.mjs --text <file.hwpx>
//   node tools/hwpx-fill.mjs <form.hwpx> <values.json> <result.hwpx>
//
// values.json: { "제목": "...", "본문": "line1\nline2" }  (keys with or without {{ }})
//
// Why a wrapper: hwpx-edit.js only reads JSON from stdin, and piping Korean text
// through Windows PowerShell 5.1 silently turns it into "?". Here the JSON is read
// from a file and handed to the engine as UTF-8 bytes. "\n" in a value becomes a
// real HWPX line break (<hp:lineBreak/>) instead of a raw newline character.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const engine = path.join(here, 'claw-hwp', 'scripts');
const { unzipSync, zipSync, strFromU8, strToU8 } = await import(
  url.pathToFileURL(path.join(engine, 'vendor', 'fflate', 'index.mjs')).href
);

const LB = ''; // private-use sentinel, swapped for <hp:lineBreak/> after filling
const PLACEHOLDER = /\{\{[^{}]+\}\}/g;

function die(msg) {
  console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
  process.exit(1);
}

function readHwpx(file) {
  if (!fs.existsSync(file)) die(`파일이 없습니다: ${file}`);
  const bytes = fs.readFileSync(file);
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4b)) die(`.hwpx(ZIP) 파일이 아닙니다: ${file}`);
  return unzipSync(bytes);
}

function sectionTexts(files) {
  return Object.keys(files)
    .filter((n) => /^Contents\/section\d+\.xml$/.test(n))
    .sort()
    .map((n) => strFromU8(files[n]));
}

const ENTITIES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

// Text as the reader sees it: strip tags so {{key}} split across runs still shows,
// one table row per line, and decode XML entities so "&" in a value compares equal.
function visibleText(files) {
  return sectionTexts(files)
    .map((xml) =>
      xml
        .replace(/<hp:tc\b[\s\S]*?<\/hp:tc>/g, (cell) =>
          cell.replace(/<hp:lineBreak\/>|<\/hp:p>/g, ' ').replace(/<\/hp:tc>$/, ' | '),
        )
        .replace(/ \| <\/hp:tr>/g, '\n')
        .replace(/<hp:lineBreak\/>/g, '\n')
        .replace(/<\/hp:p>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&(lt|gt|amp|quot|apos);/g, (_, e) => ENTITIES[e]),
    )
    .join('\n');
}

// Teachers may press Enter inside a value while editing in Notepad; JSON forbids raw
// newlines in strings, so escape them instead of failing.
function parseLenient(text) {
  try {
    return JSON.parse(text);
  } catch {
    let out = '';
    let inString = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inString && ch === '\\') { out += ch + text[++i]; continue; }
      if (ch === '"') inString = !inString;
      if (inString && ch === '\n') out += '\\n';
      else if (inString && ch === '\r') continue;
      else if (inString && ch === '\t') out += '\\t';
      else out += ch;
    }
    return JSON.parse(out);
  }
}

function listPlaceholders(form) {
  const found = [...new Set(visibleText(readHwpx(form)).match(PLACEHOLDER) || [])];
  console.log(JSON.stringify({ ok: true, form, placeholders: found }, null, 2));
}

function fill(form, valuesFile, out) {
  if (!fs.existsSync(valuesFile)) die(`값 파일이 없습니다: ${valuesFile}`);
  let raw;
  try {
    raw = parseLenient(fs.readFileSync(valuesFile, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    die(`값 파일 JSON 형식 오류: ${e.message}`);
  }
  const values = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = k.startsWith('{{') ? k : `{{${k}}}`;
    values[key] = String(v).replace(/\r\n?/g, '\n').replace(/\n/g, LB);
  }

  const before = [...new Set(visibleText(readHwpx(form)).match(PLACEHOLDER) || [])];
  const payload = JSON.stringify({
    path: path.resolve(form),
    output: path.resolve(out),
    operations: [{ type: 'fill_template', values }],
  });
  const run = spawnSync(process.execPath, [path.join(engine, 'hwpx-edit.js')], {
    input: Buffer.from(payload, 'utf8'),
    encoding: 'utf8',
  });
  let res;
  try {
    res = JSON.parse(run.stdout);
  } catch {
    die(`엔진 실행 실패: ${run.stderr || run.stdout}`);
  }
  if (!res.ok) die(`엔진 오류: ${res.error}`);

  const files = readHwpx(out);
  for (const name of Object.keys(files)) {
    if (!/^Contents\/section\d+\.xml$/.test(name)) continue;
    const xml = strFromU8(files[name]);
    if (xml.includes(LB)) files[name] = strToU8(xml.split(LB).join('<hp:lineBreak/>'));
  }
  const zippable = { mimetype: [files.mimetype, { level: 0 }] };
  for (const [n, b] of Object.entries(files)) if (n !== 'mimetype') zippable[n] = b;
  fs.writeFileSync(out, zipSync(zippable, { level: 6 }));

  // Self-check: nothing left unfilled, and Korean text survived intact.
  const text = visibleText(readHwpx(out));
  const left = [...new Set(text.match(PLACEHOLDER) || [])];
  const unknown = Object.keys(values).filter((k) => !before.includes(k));
  const broken = Object.entries(values)
    .filter(([, v]) => v && !text.includes(v.split(LB)[0].slice(0, 20)))
    .map(([k]) => k);
  const ok = left.length === 0 && broken.length === 0;
  console.log(JSON.stringify({
    ok,
    output: out,
    filled: res.results[0].perKey,
    notFilledYet: left,
    keysNotInForm: unknown,
    textCheckFailed: broken,
    next: ok ? '결과 파일을 한글/한컴 뷰어/rhwp로 열어 확인하세요.' : '비어 있는 칸이나 깨진 글자가 있습니다. 값 파일을 고친 뒤 다시 실행하세요.',
  }, null, 2));
  process.exit(ok ? 0 : 2);
}

const [a, b, c] = process.argv.slice(2);
if (a === '--list' && b) listPlaceholders(b);
else if (a === '--text' && b) console.log(visibleText(readHwpx(b)).replace(/\n{3,}/g, '\n\n'));
else if (a && b && c) fill(a, b, c);
else die('사용법: node tools/hwpx-fill.mjs --list <양식.hwpx> | --text <파일.hwpx> | <양식.hwpx> <값.json> <결과.hwpx>');
