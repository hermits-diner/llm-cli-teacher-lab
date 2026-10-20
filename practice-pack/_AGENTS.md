# 연수 실습 폴더 — AI 에이전트 지침

이 폴더는 교사 연수 실습용입니다. 사용자는 코딩이 처음인 선생님입니다.

## 대화 방식
- 항상 한국어로, 쉬운 말로 짧게 답합니다. 전문 용어는 풀어서 설명합니다.
- 작업 전에 무엇을 할지 한두 문장으로 먼저 말합니다.
- 작업이 끝나면 **만든 파일의 위치**와 **확인하는 방법**(예: 파일 탐색기에서 더블클릭)을 알려 줍니다.

## 지켜야 할 것
- 이 폴더 안에서만 파일을 만들고 고칩니다. 다른 폴더는 건드리지 않습니다.
- 학생 이름·연락처·성적 같은 개인정보를 만들거나 묻지 않습니다. 예시가 필요하면 '가상' 데이터를 씁니다.
- 프로그램을 설치하지 않습니다(npm install, pip install, winget 등). 필요한 도구는 이미 준비되어 있습니다.
- Python은 쓰지 않습니다(설치되어 있지 않습니다). 파일 처리가 필요하면 `node` 를 씁니다.
- 운영체제는 Windows입니다. 명령의 경로는 슬래시(`/`)로 씁니다.
- `samples/` 폴더는 선생님이 보는 완성 예시입니다. 작업할 때 열어 보거나 내용을 가져다 쓰지 않습니다. 항상 메모와 요청을 바탕으로 새로 씁니다.

## 미션 1 — 웹페이지 만들기
- 결과물은 `mission1/site/index.html` **한 파일**로 만듭니다. CSS와 JavaScript도 이 파일 안에 넣습니다.
- 외부 라이브러리·외부 이미지 없이 이 파일 하나만으로 열려야 합니다(그대로 Netlify에 올립니다).
- 휴대폰에서도 보기 좋게 만듭니다.

## 미션 2 — 한글(HWPX) 양식 채우기
`.hwpx` 양식의 `{{칸이름}}` 을 채울 때는 **반드시** 아래 순서를 따릅니다(스킬 `school-hwpx` 와 같은 내용).

1. 칸 목록 보기: `node tools/hwpx-fill.mjs --list mission2/notice-form.hwpx`
2. 메모 읽기: `mission2/notice-memo.txt`
3. 값 파일 쓰기: 칸 이름을 키로 하는 JSON을 `mission2/notice-values.json` 에 저장합니다. 여러 줄은 `\n` 으로 씁니다.
4. 채우기: `node tools/hwpx-fill.mjs mission2/notice-form.hwpx mission2/notice-values.json mission2/notice-result.hwpx`
5. 출력의 `"ok": true` 를 확인합니다. `false` 이면 알려 준 칸을 값 파일에서 고쳐 4번을 다시 실행합니다.
6. 내용 확인: `node tools/hwpx-fill.mjs --text mission2/notice-result.hwpx`

다른 양식도 같습니다. 예: `worksheet-form.hwpx` + `worksheet-memo.txt` → `worksheet-result.hwpx`

하지 말 것: `.hwpx` 를 직접 압축 해제·수정하기, `echo` 나 파이프(`|`)로 JSON 넘기기, 원본 양식(`*-form.hwpx`) 덮어쓰기.
