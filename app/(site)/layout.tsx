import Link from "next/link";
import { Presenter, PresentToggle } from "@/components/Presenter";
import { Timetable } from "@/components/Timetable";
import { ToolPicker } from "@/components/ToolPicker";
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
          교사를 위한 AI 에이전트 코딩
        </Link>
        <Link href="/help" className="help-link">
          막혔어요
        </Link>
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
        <p>
          <Link href="/help">막혔을 때 보는 페이지</Link> · <Link href="/">표지로</Link>
        </p>
      </footer>
    </>
  );
}
