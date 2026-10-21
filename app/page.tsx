import type { Metadata } from "next";
import Link from "next/link";
import { CoverKeys } from "@/components/CoverKeys";
import { SITE_URL, TOOLS } from "@/lib/site";

export const metadata: Metadata = { title: { absolute: "교사를 위한 AI 에이전트 코딩 (LLM CLI 활용)" } };

// The title slide. Shown on the projector while teachers arrive, so the site
// address is large enough to read from the back of the room.
export default function Cover() {
  const host = SITE_URL.replace(/^https?:\/\//, "");
  return (
    <main className="cover" aria-label="연수 표지">
      <CoverKeys href="/home" />
      <header className="cover__top">
        <span className="cover__tag">교사 연수 · 90분 실습</span>
        <span className="cover__tag cover__tag--tools">{TOOLS.map((t) => t.name).join(" · ")}</span>
      </header>
      <div className="cover__body">
        <h1 className="cover__title">
          <span className="cover__kicker">교사를 위한</span>
          AI 에이전트 코딩
          <span className="cover__subtitle">
            <mark>LLM CLI</mark> 활용
          </span>
        </h1>
        <p className="cover__sub">
          검은 창에 한 문장을 쓰면 AI가 파일을 만듭니다. 코딩은 몰라도 됩니다. 90분 뒤에는 학급 안내 웹페이지
          하나와 가정통신문 한 장이 남습니다.
        </p>
        <div className="cover__actions">
          <Link className="button cover__enter" href="/home">
            들어가기 →
          </Link>
          <Link className="button button--quiet" href="/intro">
            LLM CLI가 뭔가요?
          </Link>
        </div>
        <p className="cover__speaker">
          <span className="cover__speaker-name">강사 오정훈</span>
          <span>부산동고등학교 교육정보부장</span>
          <span>2025~2026 부산시교육청 디지털역량강화 직무연수 강사 · 2025~2026 AI 프롬프트 엔지니어링 선도교사</span>
        </p>
      </div>
      <footer className="cover__foot">
        <span className="cover__url">{host}</span>
        <span className="cover__hint">
          <kbd>Enter</kbd> 또는 <kbd>→</kbd> 키를 눌러도 들어갑니다
        </span>
      </footer>
    </main>
  );
}
