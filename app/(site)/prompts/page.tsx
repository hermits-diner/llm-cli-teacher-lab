import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/Callout";
import { More } from "@/components/More";
import { PromptLibrary } from "@/components/PromptLibrary";
import { GROUPS, LIBRARY } from "@/content/prompt-library";

export const metadata: Metadata = { title: "프롬프트 모음" };

export default function PromptsPage() {
  return (
    <>
      <h1>수업·업무 프롬프트 모음</h1>
      <p className="lead">
        중·고등학교 선생님들이 시간을 가장 많이 쓰는 일을 골라, 검은 창의 AI(agy·codex·claude)에게 그대로 붙여넣을 수
        있는 부탁 문장을 모았습니다. 학교급, 수업·업무, 교과·업무 분야로 골라 보세요.
      </p>

      <h2>쓰는 법</h2>
      <ol>
        <li>
          일할 폴더(예: <code>바탕화면\2학기 수행평가</code>)에 필요한 파일을 모으고, 그 폴더의 주소 표시줄에{" "}
          <code>cmd</code> 를 입력해 검은 창을 엽니다. <code>agy</code>·<code>codex</code>·<code>claude</code> 를 입력해
          AI를 켭니다. 이렇게 켜면 AI가 파일을 바꾸기 전에 허락을 묻습니다.
        </li>
        <li>
          문장을 복사해 붙여넣기 전에 <strong>[대괄호]</strong> 부분을 내 내용으로 바꿉니다. 파일 이름은 그대로 적거나,{" "}
          <kbd>@</kbd> 를 쳐서 목록에서 고릅니다.
        </li>
        <li>
          결과 파일을 열어 내용·날짜·정답을 <strong>직접 확인</strong>하고, 고칠 점은 말로 다시 부탁합니다.
        </li>
      </ol>
      <p>
        한글(.hwpx) 결과물은 <Link href="/mission-2">문서 작업</Link> 에서 설치한 hwpx 스킬, 슬라이드는{" "}
        <Link href="/slides">슬라이드 제작</Link> 의 디자인 스킬을 씁니다. 엑셀(.xlsx) 결과물은 AI가 필요한 Python
        부품을 설치해 만듭니다.
      </p>

      <Callout kind="warn" title="학생 개인정보는 넣지 않기">
        학생 이름·연락처·성적·상담 내용 같은 개인정보가 든 파일은 AI에게 주지 않습니다. 필요하면 이름을 "학생A" 처럼
        바꾼 자료로 부탁하고, 결과에 실제 이름을 넣는 일은 내 컴퓨터에서 직접 합니다. 학교생활기록부 문장은 AI가 쓴
        초안을 그대로 옮기지 말고, 내가 관찰한 사실에 맞게 직접 고쳐 씁니다.
      </Callout>

      <More title="어떤 어려움을 골랐나요">
        <p>2025~2026년 교원단체 설문과 국제 조사, 교육부 지침을 살펴보고 시간을 가장 많이 빼앗는 일부터 골랐습니다.</p>
        <ul>
          <li>
            교사 90.8%가 "업무의 40% 이상이 행정업무"라고 답했습니다(
            <a href="https://www.heraldk.com/article/2026051222450061727" target="_blank" rel="noopener noreferrer">
              교총, 2026
            </a>
            ). 한국 중학교 교사의 행정업무는 주 6시간으로 OECD 평균의 두 배이고, 스트레스 1위는 학부모 민원이었습니다(
            <a href="https://www.segye.com/newsView/20251010513649" target="_blank" rel="noopener noreferrer">
              TALIS 2024
            </a>
            ).
          </li>
          <li>
            학교생활기록부는 교사 한 명이 150~200명의 세특을 씁니다. 2026학년도 기재요령은 AI 결과물을 그대로 입력하는 것을
            금지하고, 교사가 관찰한 내용을 다듬고 점검하는 보조로만 쓰게 합니다. 그래서 이 모음의 생기부 문장은 모두{" "}
            <strong>내 메모를 정리·점검</strong> 하는 부탁입니다.
          </li>
          <li>
            고등학교는 고교학점제로 여러 과목을 맡고, 과목 선택 상담과 최소 성취수준 보장지도 기록이 늘었습니다(
            <a href="https://www.hangyo.com/mobile/article.html?no=104780" target="_blank" rel="noopener noreferrer">
              교총, 2025
            </a>
            ). 중학교는 생활지도와 기초학력, 자유학기 운영 부담이 큽니다.
          </li>
        </ul>
      </More>

      <PromptLibrary items={LIBRARY} groups={GROUPS} />
    </>
  );
}
