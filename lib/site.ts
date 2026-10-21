import config from "@/site.config.json";

export const SITE_URL = config.siteUrl;
export const VERIFIED_ON = config.verifiedOn;
export const VERSIONS = config.versions;

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

// The 90-minute session, in order. Shown as the timetable strip on every page.
// `also` lists other routes that belong to the same period.
export const PERIODS: { href: string; also?: string[]; label: string; title: string; time: string }[] = [
  { href: "/intro", label: "미리 읽기", title: "LLM CLI란", time: "5분" },
  { href: "/prepare", label: "연수 전", title: "준비", time: "30분" },
  { href: "/start", label: "1교시", title: "첫 만남", time: "10분" },
  { href: "/mission-1", label: "2교시", title: "웹페이지", time: "20분" },
  { href: "/mission-2", label: "3교시", title: "가정통신문", time: "35분" },
  { href: "/wrap-up", also: ["/gallery", "/files", "/commands"], label: "4교시", title: "나누고 마무리", time: "20분" },
];
