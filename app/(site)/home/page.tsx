import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChooseToolButton } from "@/components/ToolPicker";
import { TOOLS } from "@/lib/site";
import { Icon } from "@/components/Icon";
import prompts from "@/content/prompts.json";

export const metadata: Metadata = { title: "연수 안내" };

const WHO: Record<string, string> = {
  agy: "유료 구독이 없거나, 무료로 먼저 해 보고 싶은 선생님",
  codex: "ChatGPT Plus 이상을 이미 쓰고 있는 선생님",
  claude: "Claude Pro 이상을 이미 쓰고 있는 선생님",
};

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1 className="hero__title">
          검은 창에 한 문장을 쓰면
          <br />
          AI가 파일을 만듭니다
        </h1>
        <p className="lead">
          코딩을 몰라도 됩니다. 순서대로 따라 하면 90분 뒤 웹페이지 하나와 한글 문서 한 장이 남습니다. 실습마다
          업무용(학급 안내·가정통신문)과 수업용(퀴즈·활동지) 가운데 골라서 합니다.
        </p>

        <figure className="demo" aria-label="실습 화면 예시">
          <div className="demo__bar">바탕화면\ai-lab</div>
          <div className="demo__body">
            <p className="demo__line demo__line--cmd">C:\Users\선생님\Desktop\ai-lab&gt;start-agy</p>
            <p className="demo__line demo__line--you">&gt; {prompts.m2}</p>
            <p className="demo__line">● 양식에서 채울 칸 9개를 찾았습니다.</p>
            <p className="demo__line">● 메모를 읽고 칸마다 들어갈 문장을 썼습니다.</p>
            <p className="demo__line demo__line--done">● mission2/notice-result.hwpx 를 만들었습니다.</p>
          </div>
          <figcaption>실습 화면 예시. 실제 문구는 도구마다 조금 다릅니다.</figcaption>
        </figure>

        <div className="hero__actions">
          <Link className="button" href="/prepare">
            연수 전 준비부터 시작하기
          </Link>
          <Link className="button button--quiet" href="/start">
            이미 설치했어요
          </Link>
          <Link className="button button--quiet" href="/intro">
            LLM CLI가 뭔가요?
          </Link>
        </div>
      </section>

      <h2>오늘 남는 것</h2>
      <div className="results">
        <figure className="result">
          <Image
            src="/images/result-web.png"
            alt="휴대폰 화면에 열린 학급 안내 웹페이지. 담임 인사, 이번 주 알림, 시간표가 보인다."
            width={390}
            height={780}
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
          <figcaption>
            <strong>2교시</strong> 학급 안내(또는 수업 퀴즈) 웹페이지. Vercel에 올려 주소로 공유합니다.
          </figcaption>
        </figure>
        <figure className="result">
          <Image
            src="/images/result-notice.png"
            alt="한글 문서로 만든 가정통신문. 현장체험학습 안내와 회신서가 있다."
            width={794}
            height={1123}
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
          <figcaption>
            <strong>3교시</strong> 메모로 채운 가정통신문(또는 수업 활동지) .hwpx. 한글에서 바로 엽니다.
          </figcaption>
        </figure>
      </div>

      <h2>90분 시간표</h2>
      <table>
        <thead>
          <tr>
            <th>시간</th>
            <th>순서</th>
            <th>하는 일</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>연수 전</td>
            <td>
              <Link href="/intro"><Icon name="book" /> LLM CLI 알아보기</Link>
            </td>
            <td>어떤 도구이고 어떻게 일하는지 (5분 읽기)</td>
          </tr>
          <tr>
            <td>연수 전</td>
            <td>
              <Link href="/prepare"><Icon name="toolbox" /> 준비</Link>
            </td>
            <td>계정 준비, 한 줄 설치, 로그인 (30분)</td>
          </tr>
          <tr>
            <td>0–15분</td>
            <td>
              <Link href="/start"><Icon name="hello" /> 1교시 첫 만남</Link>
            </td>
            <td>AI에게 말 걸기, AI가 일하는 모습 지켜보기</td>
          </tr>
          <tr>
            <td>15–35분</td>
            <td>
              <Link href="/mission-1"><Icon name="globe" /> 2교시 웹페이지</Link>
            </td>
            <td>학급 안내 또는 수업 퀴즈 페이지 만들어 인터넷에 올리기</td>
          </tr>
          <tr>
            <td>35–70분</td>
            <td>
              <Link href="/mission-2"><Icon name="document" /> 3교시 한글 양식</Link>
            </td>
            <td>hwpx 스킬 설치하고 메모로 가정통신문 또는 수업 활동지 채우기</td>
          </tr>
          <tr>
            <td>70–90분</td>
            <td>
              <Link href="/wrap-up"><Icon name="party" /> 4교시 나누고 마무리</Link>
            </td>
            <td>갤러리 구경, 내일 쓸 곳 정하기</td>
          </tr>
        </tbody>
      </table>

      <h2>연수 뒤에도 보는 참고 자료</h2>
      <ul>
        <li>
          <Link href="/intro">LLM CLI 알아보기</Link> — 5분 개요
        </li>
        <li>
          <Link href="/files">만들 수 있는 파일과 부탁 예시</Link> — 수업·업무용 부탁 문장 모음
        </li>
        <li>
          <Link href="/commands">도구별 명령어와 사용 예시</Link> — 도구 안에서 쓰는 명령과 AI 두뇌(모델)
        </li>
        <li>
          <Link href="/install">직접 설치하기 (cmd)</Link> — 설치 프로그램이 안 될 때
        </li>
        <li>
          <Link href="/slides">선택 과제: 슬라이드 만들기</Link> — 디자인 스킬을 설치해 보기 좋은 PowerPoint 파일 만들기
        </li>
        <li>
          <Link href="/canva">부록: Canva 연결해 슬라이드 만들기</Link> — MCP와 플러그인 맛보기
        </li>
      </ul>

      <h2>어떤 도구를 쓸까요</h2>
      <p>쓰는 법은 셋 다 같습니다. 이미 쓰는 구독에 맞춰 고르세요.</p>
      <ul className="tools">
        {TOOLS.map((t) => (
          <li key={t.id} className="tool">
            <h3>{t.name}</h3>
            <p className="tool__who">{WHO[t.id]}</p>
            <dl>
              <dt>계정</dt>
              <dd>{t.account}</dd>
              <dt>비용</dt>
              <dd>{t.cost}</dd>
              <dt>기본 모델</dt>
              <dd>{t.model}</dd>
            </dl>
            <ChooseToolButton id={t.id} />
          </li>
        ))}
      </ul>
    </>
  );
}
