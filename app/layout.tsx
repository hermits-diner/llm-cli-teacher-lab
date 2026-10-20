import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import Link from "next/link";
import { Timetable } from "@/components/Timetable";
import { ToolPicker, toolBootScript } from "@/components/ToolPicker";
import { DEFAULT_TOOL, VERIFIED_ON, VERSIONS } from "@/lib/site";
import "./globals.css";

const plex = IBM_Plex_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: { default: "LLM CLI 교사 연수", template: "%s | LLM CLI 교사 연수" },
  description: "명령창에서 AI에게 일을 시켜 보는 90분 실습. 따라 하면 웹페이지와 가정통신문이 완성됩니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-tool={DEFAULT_TOOL} className={plex.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: toolBootScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          본문으로 건너뛰기
        </a>
        <header className="site-header">
          <Link href="/" className="site-title">
            LLM CLI 교사 연수
          </Link>
          <Link href="/help" className="help-link">
            막혔어요
          </Link>
          <ToolPicker />
        </header>
        <Timetable />
        <main id="main" className="page">
          {children}
        </main>
        <footer className="site-footer">
          <p>
            {VERIFIED_ON}에 이 순서대로 직접 실행해 확인했습니다. Antigravity CLI {VERSIONS.agy}, Codex CLI{" "}
            {VERSIONS.codex}, Claude Code {VERSIONS.claude}. 도구는 자주 바뀌므로 화면이 조금 다를 수 있습니다.
          </p>
          <p>
            <Link href="/help">막혔을 때 보는 페이지</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
