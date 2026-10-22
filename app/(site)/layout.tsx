import Link from "next/link";
import { Copyright } from "@/components/Copyright";
import { Presenter, PresentToggle } from "@/components/Presenter";
import { Timetable } from "@/components/Timetable";
import { ToolPicker } from "@/components/ToolPicker";
import { ThemePicker } from "@/components/ThemePicker";
import { VERIFIED_ON, VERSIONS } from "@/lib/site";

// Header, timetable strip and footer for every page except the cover at "/".
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <header className="site-header">
        <Link href="/home" className="site-title">
          LLM CLI 기반 수업자료제작 및 업무활용
        </Link>
        <nav className="header-links" aria-label="참고 페이지">
          <Link href="/prompts" className="prompts-link">
            프롬프트 모음
          </Link>
          <Link href="/help" className="help-link">
            막혔어요
          </Link>
        </nav>
        <ThemePicker />
        <PresentToggle />
        <ToolPicker />
      </header>
      <Timetable />
      <main id="main" className="page">
        {children}
      </main>
      <Presenter />
      <footer className="site-footer">
        <p>
          {VERIFIED_ON}에 이 순서대로 직접 실행해 확인했습니다. Antigravity CLI {VERSIONS.agy}, Codex CLI{" "}
          {VERSIONS.codex}, Claude Code {VERSIONS.claude}. 도구는 자주 바뀌므로 화면이 조금 다를 수 있습니다.
        </p>
        <p className="site-footer__links">
          <Link href="/help">막혔을 때 보는 페이지</Link>
          <Link href="/">표지로</Link>
        </p>
        <Copyright />
      </footer>
    </>
  );
}
