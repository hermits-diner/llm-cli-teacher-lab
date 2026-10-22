import type { LibraryItem } from "@/components/PromptLibrary";
import classMiddle from "./class-middle.json";
import classHigh from "./class-high.json";
import classCommon from "./class-common.json";
import workCommon from "./work-common.json";
import workAdmin from "./work-admin.json";
import workMiddle from "./work-middle.json";
import workHigh from "./work-high.json";

// Display order of the groups; an item whose group is not listed here fails the build check.
export const GROUPS: Record<LibraryItem["kind"], string[]> = {
  class: [
    "수업 공통",
    "국어",
    "영어",
    "수학",
    "사회",
    "역사",
    "도덕·윤리",
    "과학",
    "기술·가정",
    "정보",
    "음악",
    "미술",
    "체육",
    "제2외국어·한문",
    "진로",
  ],
  work: [
    "담임·학급 운영",
    "학부모 소통",
    "상담·생활지도",
    "평가",
    "학교생활기록부",
    "공문·기안·보고",
    "회의·행사",
    "예산·물품",
    "부서 업무",
    "자유학기·진로탐색",
    "고교학점제",
    "진로·진학",
    "연수·자기 계발",
  ],
};

const order = (i: LibraryItem) => GROUPS[i.kind].indexOf(i.group);

const all = [classCommon, classMiddle, classHigh, workCommon, workAdmin, workMiddle, workHigh].flat() as LibraryItem[];

// The JSON files are written by hand (and by agents), so a typo stops the build here.
const SKILL: Record<string, string | undefined> = { ".hwpx": "hwpx", ".pptx": "frontend-design" };
const seen = new Set<string>();
for (const i of all) {
  const where = `prompt-library ${i.id}`;
  if (seen.has(i.id)) throw new Error(`${where}: duplicate id`);
  seen.add(i.id);
  if (!["middle", "high", "all"].includes(i.level)) throw new Error(`${where}: bad level ${i.level}`);
  if (!(i.kind in GROUPS) || order(i) === -1) throw new Error(`${where}: unknown group ${i.kind}/${i.group}`);
  if (i.skill !== SKILL[i.output]) throw new Error(`${where}: skill ${i.skill} does not match output ${i.output}`);
  if (!i.title || !i.pain || !i.prompt) throw new Error(`${where}: empty field`);
}

export const LIBRARY: LibraryItem[] = all.sort((a, b) =>
  a.kind === b.kind ? order(a) - order(b) : a.kind === "class" ? -1 : 1,
);
