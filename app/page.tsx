import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CoverKeys } from "@/components/CoverKeys";
import { SITE_URL, TOOLS } from "@/lib/site";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: { absolute: "LLM CLI 기반 수업자료제작 및 업무활용" } };

// The title slide. Shown on the projector while teachers arrive, so the site
// address is large enough to read from the back of the room. The two results
// of the day lie on the right like handouts on a desk, with a QR code stuck
// beside them for teachers to open the site on their phones.
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
        <div className="cover__text">
          <h1 className="cover__title">
            <span className="cover__kicker">
              <mark>LLM CLI</mark> 기반
            </span>
            수업자료제작
            <br />및 업무활용
          </h1>
          <p className="cover__sub">
            검은 창에 한 문장을 쓰면 AI가 파일을 만듭니다. 코딩은 몰라도 됩니다. 90분 뒤에는 학급 안내 웹페이지
            하나와 가정통신문 한 장이 남습니다.
          </p>
          <div className="cover__actions">
            <Link className="button button--lg" href="/home">
              들어가기 →
            </Link>
            <Link className="button button--quiet button--lg" href="/intro">
              LLM CLI가 뭔가요?
            </Link>
          </div>
          <p className="cover__speaker">
            <span className="cover__speaker-name">강사 오정훈</span>
            <span>부산동고등학교 교육정보부장</span>
            <span>2025~2026 부산시교육청 디지털역량강화 직무연수 강사 · 2025~2026 AI 프롬프트 엔지니어링 선도교사</span>
          </p>
        </div>
        <figure className="cover__art">
          <Image
            className="cover__art-notice"
            src="/images/result-notice.png"
            alt="한글로 만든 가정통신문. 현장체험학습 안내와 회신서가 있다."
            width={794}
            height={1123}
            priority
          />
          <Image
            className="cover__art-web"
            src="/images/result-web.png"
            alt="휴대폰 화면에 열린 학급 안내 웹페이지"
            width={390}
            height={780}
            priority
          />
          <div className="cover__qr">
            <Image src="/images/site-qr.png" alt="이 사이트 주소의 QR 코드" width={180} height={180} unoptimized />
            <span>휴대폰으로 열기</span>
          </div>
          <figcaption>
            <Icon name="globe" /> 2교시 학급 안내 웹페이지 · <Icon name="document" /> 3교시 가정통신문
          </figcaption>
        </figure>
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
