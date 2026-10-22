import config from "@/site.config.json";
import type { IconName } from "@/components/Icon";

export const SITE_URL = config.siteUrl;
export const VERIFIED_ON = config.verifiedOn;
export const VERSIONS = config.versions;

// Padlet board teachers post to when the gallery DB is down. Anyone with the
// link can post without logging in; NEXT_PUBLIC_GALLERY_BACKUP_URL overrides it.
export const GALLERY_BACKUP_URL =
  process.env.NEXT_PUBLIC_GALLERY_BACKUP_URL || "https://padlet.com/busandonggo/padlet-s024pf1ertgi2rh4hr4m";

export type ToolId = "agy" | "codex" | "claude";

export const TOOLS: {
  id: ToolId;
  name: string;
  launcher: string;
  account: string;
  cost: string;
  model: string; // default model as of VERIFIED_ON; details on /commands
}[] = [
  {
    id: "agy",
    name: "Antigravity CLI",
    launcher: "start-agy",
    account: "개인 Gmail 계정",
    cost: "무료로 시작 (주간 사용량 한도)",
    model: "Gemini 3.8 Flash",
  },
  {
    id: "codex",
    name: "Codex CLI",
    launcher: "start-codex",
    account: "ChatGPT 계정",
    cost: "ChatGPT 유료 요금제(Plus 이상)",
    model: "GPT-6.1 Sol",
  },
  {
    id: "claude",
    name: "Claude Code",
    launcher: "start-claude",
    account: "Claude 계정",
    cost: "Claude Pro 이상 (무료 요금제 불가)",
    model: "Claude Opus 5.5",
  },
];

export const DEFAULT_TOOL: ToolId = "agy";

// School level: each practice shows one 업무 and one 수업 example for the chosen level.
export type LevelId = "middle" | "high";

export const LEVELS: { id: LevelId; name: string }[] = [
  { id: "middle", name: "중학교" },
  { id: "high", name: "고등학교" },
];

export const DEFAULT_LEVEL: LevelId = "middle";

// The 90-minute session, in order. Shown as the timetable strip on every page.
// `also` lists other routes that belong to the same period.
export const PERIODS: { href: string; also?: string[]; title: string; icon: IconName }[] =
  [
    { href: "/intro", title: "LLM CLI란", icon: "book" },
    { href: "/prepare", also: ["/install", "/setup-guide"], title: "준비", icon: "toolbox" },
    { href: "/start", title: "첫 만남", icon: "hello" },
    { href: "/mission-2", title: "문서 작업", icon: "document" },
    { href: "/mission-1", title: "웹앱 제작", icon: "globe" },
    { href: "/slides", title: "슬라이드 제작", icon: "slides" },
    {
      href: "/wrap-up",
      also: ["/gallery", "/files", "/commands", "/canva", "/mcp"],
      title: "나누고 마무리",
      icon: "party",
    },
  ];
