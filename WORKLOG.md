# 작업 기록 (WORKLOG)

교사 대상 LLM CLI 연수 웹사이트 작업 기록. 날짜별로 누적한다.
계획 원본: `~/.claude/plans/llm-immutable-book.md`

---

## 2026-10-21

### 0. 사전 조사로 확정한 것

- **Gemini CLI는 다루지 않는다.** 2026-06-18부터 무료·AI Pro 사용자 요청 처리가 중단되었고, 후속 제품이 Antigravity CLI(`agy`)다.
- **세 도구의 cmd 설치 명령은 공식 문서 문자열 그대로 쓴다.**
  - agy·claude: `curl ... install.cmd`
  - codex: cmd에서 `powershell -ExecutionPolicy ByPass -c "irm ... | iex"`
- **세 CLI 모두 Node가 필요 없다.** 하지만 claw-hwp(HWPX 엔진)와 netlify-cli는 Node가 필요하다.
- **HWPX 엔진은 claw-hwp를 고른다.**
  - 이유: MIT LICENSE 파일이 있고, Node만 있으면 되며, vendor가 들어 있어 npm install이 필요 없다.
  - jkf87/hwpx-skill은 README에만 MIT라고 적혀 있고 LICENSE 파일이 없다. Canine89와 new_hwpx_master는 라이선스 표기가 없다. → 재배포하지 않는다.
- **Netlify는 "로그인한 상태로 Drop"을 쓴다.**
  - 비로그인으로 Drop에 올리면 비밀번호가 걸리고, 이후 정지·삭제된다.
  - 2026-07-28 이후 가입한 계정은 사이트가 비공개로 시작하므로 사전에 공개 설정을 바꿔야 한다.

### 1. 스파이크: 미션 2(HWPX 양식 채우기)가 되는가

**엔진 고정**
- claw-hwp 커밋 `05cf0cb3351391a526cefb585f5886f9745226ec` (v1.5.58, 2026-10-20)
- 실제 엔진 위치: `plugins/claw-hwp/skills/hwp/scripts/`. vendor로 fflate·rhwp·cfb를 포함하며 각각 LICENSE가 있다. 크기 6.3MB.

**발견 1 — `secure-fill`은 미션 2에 맞지 않는다**
- secure-fill은 개인정보 값이 모델 맥락에 들어가지 않게 하는 전용 도구다. profile 파일을 읽는 것 자체를 금지한다.
- 미션 2에서는 AI가 메모를 읽고 본문을 써야 하므로 목적이 정반대다.
- → `{{자리표시자}}` 양식 + `hwpx-edit.js`의 `fill_template`으로 간다.

**발견 2 — PowerShell 5.1 파이프로 JSON을 넘기면 실패한다**
- 재현 명령: `powershell.exe`(5.1.26100)에서 `Get-Content fill.json -Raw -Encoding UTF8 | node hwpx-edit.js`
- 결과: `{"ok":false,"error":"invalid JSON on stdin: Unexpected token '﻿' ..."}` (앞에 BOM이 붙음)
- 교사 PC의 에이전트는 Git Bash가 없어서 PowerShell 5.1로 명령을 실행할 가능성이 크다. 그러면 SKILL.md 예시(`echo '{...}' | node ...`)를 그대로 따라 하다가 실패한다.
- → 래퍼 `tools/hwpx-fill.mjs`를 만든다.
  - JSON은 **파일**로 받는다.
  - Node가 엔진의 stdin에 UTF-8 바이트를 직접 넘긴다.

**발견 3 — 값 안의 줄바꿈이 문자 그대로 저장된다**
- `fill_template`에 `"본문": "첫줄\n둘째줄"`을 넣으면 XML에 `<hp:t>첫줄\n둘째줄</hp:t>`처럼 줄바꿈 문자가 그대로 들어간다. HWPX의 정식 줄바꿈은 `<hp:lineBreak/>`다.
- → 래퍼가 처리한다.
  1. 채우기 전에 `\n`을 사용자 정의 영역 문자 U+E000으로 바꾼다.
  2. 채운 뒤 section XML에서 U+E000을 `<hp:lineBreak/>`로 치환한다.
  3. mimetype을 첫 항목에 STORED로 두고 다시 압축한다.

**확인한 방법**
- PowerShell 5.1에서 `node tools\hwpx-fill.mjs --list` 실행 → 자리표시자 9개가 나열됨
- 채우기 실행 → `ok:true`, 9칸 모두 1회씩 치환, 남은 `{{` 0개, 한글 검사 통과
- XML 확인: `<hp:lineBreak/>` 1개, 첫 항목은 `mimetype`
- rhwp 미리보기(claw-hwp `preview-server.js`)로 렌더링 → 본문이 두 줄로 나뉘고 한글이 정상 표시됨
- hwpx-edit.js가 `linesegarray` 캐시를 이미 지워 주는 것도 확인했다(코드 230·564행). 그래서 래퍼에서는 따로 처리하지 않는다.

**남은 일**
- 시험용 양식은 제목이 본문 크기로 나오고, 머리글 칸("항목/내용")이 세로로 꺾여 보인다. 실제 양식은 디자인을 다듬어 다시 만든다.
- 이 PC에 한컴오피스 2022가 설치되어 있다. 한컴 COM 자동화는 보안 확인 팝업이 바탕화면에 떠서 멈출 위험이 있어 쓰지 않았다. 한글에서의 최종 확인은 사람이 직접 연다.

### 2. 스캐폴드

- `create-next-app`은 폴더 이름("LLM CLI Usage")이 npm 이름 규칙에 걸려 실패하므로 설정 파일을 직접 작성했다.
- TypeScript 최신판은 7.0.2(네이티브 구현)다. Next 16 도구 체인과의 호환이 불확실하므로 **5.9.3으로 고정**했다.
- **한글·공백 경로(`바탕 화면\LLM CLI Usage`)에서 `next build`(Turbopack)가 성공**했다. MDX 표와 코드 블록도 정상이다. → 경로를 옮기지 않는다.
- Playwright MCP가 작업 폴더에 `.playwright-mcp/`를 만든다. → `.gitignore`에 추가했다.

### 3. 실습 폴더(practice-pack) 제작

- **엔진을 최소한으로 줄였다(6.3MB → 381KB).** `hwpx-edit.js`가 fflate 하나에만 의존한다는 것을 확인하고(90행 import), 그 둘과 LICENSE만 넣었다. rhwp WASM(4.5MB)은 양식을 만들 때만 필요하므로 저장소 밖에서만 쓴다. 출처와 커밋은 `practice-pack/tools/claw-hwp/NOTICE.md`에 적었다.
- **양식 2종(가정통신문, 수업 활동지)은 `docs/forms/*.create.json` 정의로 만든다.** 다시 만들 때는 `CLAW_HWP_SCRIPTS=<원본 scripts 경로> node scripts/make-forms.mjs`를 실행한다.
  - 함정 1: 새 문서를 만들 때 `insert_para_line`은 지원되지 않는다(`unknown op type`). 기존 .hwp를 편집할 때만 쓸 수 있는 연산이다.
  - 함정 2: 결과 파일이 이미 있으면 create.js가 덮어쓰기를 거부한다. 정의 파일에 `"allow_overwrite": true`를 넣었다.
  - 함정 3: **첫 문단(para 0)에는 `apply_text_style`로 바꾼 글자 크기가 적용되지 않는다.** charPr id 8(24pt)은 만들어지는데, 첫 문단의 run만 charPr 0을 가리켰다. hwpx-edit로 다시 지정하면 줄 높이는 커지지만 rhwp는 여전히 작게 그렸다. 그래서 첫 문단을 학교 정보 줄(작은 글씨)로 두고 제목을 두 번째 문단으로 옮겨 해결했다. 렌더링 화면으로 확인했다.
- **래퍼 `tools/hwpx-fill.mjs` 보완 내용**
  - `--text` 모드를 추가했다. 표는 한 행을 한 줄로 출력한다.
  - XML 엔티티를 디코딩한다. 디코딩하지 않으면 값에 `&`나 `<`가 들어갈 때 자체 검사가 거짓 실패한다.
  - 문자열 안의 실제 줄바꿈을 받아들인다(parseLenient). 메모장에서 값 파일을 고치다 Enter를 칠 수 있기 때문이다.
  - 시험: `{"제목":"A & B <테스트>"}`와 실제 줄바꿈이 섞인 JSON으로 채우기에 성공했다. 일부 칸만 채우면 `ok:false`와 함께 남은 칸 목록을 보여 준다.
- **에이전트용 파일의 이름**: 저장소에서는 `_AGENTS.md`, `_CLAUDE.md`, `_agents/`로 두고, zip을 만들 때 `AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`(스킬 복사본)로 바꾼다. 사이트를 개발하는 에이전트가 실습용 지침을 읽어 버리는 것을 막기 위해서다.
- **zip을 만들 때 하는 검사**(`scripts/make-downloads.mjs`)
  - 필수 항목 19개가 있는지 확인한다.
  - .cmd/.bat에 ASCII 외 문자가 있으면 빌드를 실패시키고, 줄바꿈은 CRLF로 바꾼다.
  - 로컬 시험에서 나온 산출물(`*-result.hwpx`, `*-values.json`, `mission1/site/*`)은 제외한다.
  - 결과: 145KB, Windows 기본 tar로 풀었을 때 런처 파일이 `DOS batch file, ASCII text, with CRLF line terminators`로 확인되었다.

### 4. setup.bat

- **공식 설치기를 실행하지 않고 내용만 받아 확인했다.** claude·agy의 install.cmd는 모두 `setlocal`과 `exit /b`만 쓰므로 `call`로 불러도 우리 bat이 끝나지 않는다.
  - claude 설치기는 `stable`, `latest`, 버전 번호를 인자로 받는다.
  - agy 설치기는 이미 설치돼 있으면 안내만 출력하고 exit 0으로 끝난다(43~50행). `%CMDCMDLINE%`에 `& | ; < > ^`가 들어 있으면 중단된다.
  - codex install.ps1은 `CODEX_NON_INTERACTIVE`가 켜져 있으면 끝에 묻는 "Start Codex now?" 질문을 건너뛴다.
- **함정: Git Bash에서 cmd를 거쳐 `tar`를 실행하면 GNU tar가 먼저 잡힌다.** 결과는 `tar: Cannot connect to \C: resolve failed`였다. 교사 PC에도 Git 같은 프로그램이 다른 tar나 curl을 PATH에 넣었을 수 있다. 그래서 bat에서 **`%SystemRoot%\System32\tar.exe`와 `curl.exe`를 전체 경로로** 부른다.
- **Windows tar의 `-xkf` 동작**: 이미 있는 파일은 덮어쓰지 않고, 종료 코드는 0이다. README를 고쳐 둔 뒤 다시 풀어도 고친 내용이 남는 것을 확인했다. 그래서 기존 폴더를 덮어쓸지 묻는 질문 없이 `-xkf`를 쓴다.
- **Node는 포터블 zip v24.22.0(2026-10-14 LTS)을 받고 `certutil -hashfile` SHA256으로 검증한다.** x64와 arm64 해시를 모두 bat에 넣었다. winget과 MSI(UAC)를 쓰지 않는다.
- **네트워크 점검 처리**: 설치 모드에서는 점검 실패를 경고로만 남기고, 실제 오류는 각 설치 단계가 보고한다. HEAD 요청을 거부하는 사이트 때문에 거짓 실패가 날 수 있어서다. 점검 모드(4)에서만 E03으로 처리한다. Codex를 골랐는데 PowerShell이 막혀 있으면 E07로 바로 멈춘다.
- **확인한 방법**
  - 점검 모드: 사이트 9곳 접속, PowerShell 실행, 쓰기 권한이 모두 OK였고 로그가 기록되었다.
  - 설치 모드(agy, 시험용 폴더와 로컬 서버 사용): 실습 폴더 OK, Node v24.22.0 OK(SHA256 일치), agy OK.
  - 이 과정에서 **agy가 1.3.5에서 1.4.3으로 스스로 업데이트된 것**을 발견했다. → 사이트에 검증일과 버전을 표시한다.
- 시험할 때는 `AI_LAB_DIR`, `AI_LAB_SITE` 환경변수로 폴더와 사이트 주소를 바꿀 수 있게 했다. 인자 `setup.bat check|claude|codex|agy`를 주면 메뉴를 건너뛴다.

### 5. 세 CLI로 실제 미션 검증 (`scripts/verify-missions.mjs`)

- 1차(1회씩) 결과: agy와 claude는 미션 3개를 모두 통과했다. codex는 3개 모두 5~10초 만에 실패했다.

| 도구 | 웹페이지 | 가정통신문 | 활동지 |
|---|---|---|---|
| Antigravity 1.4.3 | 56초 | 80초 | 75초 |
| Claude Code 2.1.304 | 196초 | 91초 | 59초 |
| Codex 0.163.0 | 57초 | 62초 | 75초 |

- **Codex 실패 원인 추적**
  1. 증상: `The 'gpt-5.6-sol' model is not supported when using Codex with a ChatGPT account`
  2. 개인 설정 `~/.codex/config.toml`의 `model`을 우회해 `-m gpt-6-luna`로 실행해도 같은 오류가 났다.
  3. `codex doctor` 결과는 인증 정상, 0.163.0 업데이트 있음이었다.
  4. **스크래치 폴더에 최신판(npm `@openai/codex@latest` = 0.163.0)을 따로 설치해 같은 로그인으로 실행하니 세 모델 모두 정상 응답했다.** → 원인은 오래된 클라이언트였다. 사용자의 설치본은 건드리지 않았다.
  5. → `/help`에 "codex update" 안내를 넣었다. 검증 스크립트는 `VERIFY_CODEX_EXE`로 다른 실행 파일을 쓸 수 있게 했다.
- **완성본 복사 문제**
  - agy의 가정통신문 결과가 `notice-sample.hwpx`의 문장과 똑같았다. 같은 폴더에 있던 완성본을 읽고 가져다 쓴 것이다. 파일은 정상이지만 "AI가 메모로 문장을 쓴다"는 실습 의도가 깨진다.
  - claude는 새로 썼다.
  - → 완성본을 `samples/`로 옮기고, AGENTS.md와 스킬에 "samples/는 사람용, 참고·복사 금지" 규칙을 넣었다. 검증 스크립트에는 완성본에만 있는 문장이 결과에 나오는지 검사하는 항목을 추가했다.
- 두 도구 모두 의도한 절차를 따른 것을 확인했다. `notice-values.json`을 만든 뒤 래퍼로 채웠다.

### 6. 사이트

- 디자인 방향(frontend-design 스킬 기준)
  - **내비게이션을 학교 시간표(교시)로 만들었다.** 90분 수업이 실제로 순서가 있는 흐름이라서다.
  - 명령 블록은 Windows cmd 색(Campbell, #0C0C0C·#CCCCCC)을 그대로 써서 교사 화면과 같아 보이게 했다.
  - "AI에게 말하기"는 볼펜 파랑, 주의는 빨간 색연필, 완료한 단계는 빨간 "확인" 도장으로 표시한다.
  - 크림 배경, 테라코타 색, 대문자 레이블, `→` 버튼은 쓰지 않았다.
- ` ```cmd `, ` ```prompt `, ` ```screen ` 펜스를 `mdx-components`의 `pre`가 각각 Cmd, Prompt, 출력 화면으로 바꾼다.
- 도구 선택은 `<head>` 인라인 스크립트가 `html[data-tool]`을 화면을 그리기 전에 설정하고, CSS로 숨긴다. 하이드레이션 깜빡임이 없다.
- 프롬프트는 `content/prompts.json` 한 곳에 두고 사이트와 검증 스크립트가 함께 쓴다. **사이트에 보이는 문장이 곧 검증한 문장이다.**
- 함정: Tailwind preflight가 h1~h3의 굵기와 목록 기호를 초기화한다. → `.page h1~h3 {font-weight:700}`를 넣고, 클래스 없는 목록에만 기호를 복원했다.

### 하지 않기로 한 것

- 한컴 COM으로 PDF를 만들어 확인하는 방법: 보안 확인 팝업이 바탕화면에 떠서 자동화가 멈출 수 있다. 한글에서의 최종 확인은 사람이 직접 연다.
- 사용자의 Codex 업데이트, 개인 설정 수정: 환경을 바꾸는 일이라 하지 않았다. 최신판은 스크래치 폴더에 따로 설치해서 검증했다.

### 7. 공개·배포 (사용자 확인 후)

- GitHub 공개 저장소: https://github.com/hermits-diner/llm-cli-teacher-lab
- Vercel 프로젝트 `llm-cli-teacher-lab`을 hermit-s-diner 팀에 만들고 GitHub와 연결했다. 운영 주소는 https://llm-cli-teacher-lab.vercel.app 이다.
  - 함정: `vercel project add`로 프로젝트를 만들면 Framework Preset이 **Other**로 잡힌다. 그대로 두면 `public/`만 정적으로 서빙된다. → `vercel.json`에 `"framework": "nextjs"`를 고정했다.
  - `vercel link`가 `.gitignore`에 `.vercel`과 `.env*`를 덧붙였다. 기존 규칙과 겹치는 내용이라 지웠다.
- 운영 주소에서 확인한 것
  - 모든 페이지가 200을 반환한다.
  - `/setup.bat`: `Content-Disposition: attachment`, ASCII, CRLF, 사이트 주소 포함
  - `/ai-lab.zip`: 148KB
  - `/api/gallery`: DB를 아직 연결하지 않아 503이다(의도한 동작).
- **운영 주소에서 받은 setup.bat으로 설치 흐름 전체(agy)가 OK였다.**
- 런처 확인: 시스템 Node가 없는 PATH(`System32;Windows`만 남김)에서 `start-agy.cmd`가 `tools\node\node.exe` v24.22.0과 agy를 찾았다.
- 모바일 폭(390px)에서 8개 페이지 × 3개 도구, 24가지 경우 모두 가로 넘침이 없었다(iframe으로 측정).
- Neon 연결은 Marketplace 약관 동의(브라우저)가 필요해서 사용자 조치를 기다리는 중이다.

### 8. 자동 보안 리뷰 반영: 검증 스크립트의 권한 축소

- 지적: verify-missions가 `--dangerously-skip-permissions`로 에이전트를 실행한다.
- 조치
  - Claude: `--permission-mode acceptEdits --allowedTools Read,Write,Edit,Glob,Grep,Bash(node:*)`
  - agy: per-command 허용 목록 플래그가 없어서 `--sandbox`(터미널 제한)를 추가했다.
  - Codex: 원래 `workspace-write` 샌드박스였으므로 그대로 두었다.
- 재검증 결과 4/4 통과(agy m1·m2, claude m1·m2)

### 9. 미션 1 소요 시간 줄이기

- Claude의 미션 1 소요 시간이 회차마다 늘었다. 196초 → 293초 → 417초였고, 그때마다 결과물이 229줄 → 399줄 → 705줄로 커졌다. 20분짜리 2교시에 7분 대기는 지나치게 길다.
- AGENTS.md 미션 1 항목에 "첫 버전은 간결하게(300줄 안팎), 꾸밈은 고칠 때"라는 규칙을 넣었다.
- 재측정 결과:

| 도구 | 소요 시간 | 결과 줄 수 |
|---|---|---|
| Claude | 195초 | 250줄 |
| agy | 64초 | 302줄 |
| Codex | 46초 | 138줄 |

- 세 도구 모두 통과했다. "빨리 만들고 말로 다듬는다"는 2교시의 학습 흐름과도 맞는다.

### 10. 결과물 갤러리 DB(Neon) 연결과 끝까지 시험

- 사용자가 Marketplace 약관에 동의한 뒤 `vercel integration add neon --name llm-cli-gallery --plan free_v3 -m region=sin1 -m auth=false`로 만들었다.
  - 지역 `sin1`(싱가포르): Neon이 고를 수 있게 해 주는 지역 중 한국에서 가장 가깝다.
  - `auth=false`: 갤러리에는 로그인 기능이 없어서 Neon Auth를 켜지 않았다.
  - `DATABASE_URL` 등이 production·preview·development 세 환경에 자동으로 들어갔다. **프리뷰 배포도 같은 DB를 쓴다.**
- `npm run db:init` → `gallery_posts ready (0 rows)`
- `GALLERY_ADMIN_KEY`: 무작위 24자를 세 환경에 넣었다. production·preview에는 Secret으로 저장되어 대시보드에서 다시 볼 수 없다. 키는 사용자에게 따로 전달했고 저장소에는 없다.
- `vercel.json`에 `"regions": ["sin1"]`를 넣어 함수를 DB 옆으로 옮겼다. 응답 헤더 `X-Vercel-Id: icn1::sin1::…`(서울 엣지 → 싱가포르 함수)로 확인했다.

**CLI가 덧붙인 것(삽질 기록)**
- `vercel integration add`는 DB만 만드는 게 아니다. **Neon 에이전트 스킬 24개 파일을 `.agents/skills/`, `.claude/skills/`에 설치하고 `skills-lock.json`도 만든다.** 사이트와 관계없고 공개 저장소에 올라가므로 지웠다. 이 폴더들은 방금 생긴 것이었고 안에는 Neon 스킬만 있었다.
- `vercel integration add`와 `vercel env pull`은 **실행할 때마다 `.gitignore` 끝에 `.env*`를 붙인다.** 기존 `.env`·`.env.*`·`!.env.example` 규칙과 겹친다. 게다가 맨 끝에 붙으므로 `!.env.example` 예외를 무효로 만든다. 매번 `git checkout -- .gitignore`로 되돌렸다. 앞으로도 env pull 뒤에는 `git status`를 확인할 것.

**API 시험** (임시 스크립트, 같은 시험을 로컬과 운영에서 실행)
- 운영: 18/18 통과
  - 정상 등록: 경로·쿼리를 떼고 origin만 저장되는지, 스킴이 없거나 대문자인 주소도 받는지
  - 중복 409
  - netlify가 아닌 주소, `evil.netlify.app.example.com`, `http://`, 사용자 정보가 붙은 주소 → 400
  - 없는 사이트(404) → "그 주소에 사이트가 없습니다"
  - 잘못된 도구, 제로폭·bidi 문자만 있는 닉네임, 21자 닉네임, 깨진 JSON → 400
  - 숨기기: 키 없음·틀린 키 401, 올바른 키 200, 숨긴 글은 목록에서 빠짐
- 로컬(같은 Neon DB 사용)
  - 위와 같은 시험 18/18
  - 참여 코드 켬(`Lab26`, 소문자 `lab26`으로 보냄): 20/20. 코드가 틀리거나 없으면 403, 대소문자는 무시함
  - `GALLERY_OPEN=false`: 등록하면 403 "지금은 갤러리 등록을 받지 않습니다."
  - 임시 설정은 시험 후 `.env.local`에서 지웠다.
- 하지 못한 것: **비공개 Netlify 사이트(401/403) 안내 문구는 실제 비공개 사이트로 시험하지 못했다.** 공개된 비공개 사이트 예시를 구할 수 없었다. 코드 경로는 404 처리와 같은 구조다. 리허설 때 교사가 Make public 전에 올려 보면 확인된다.

**화면 시험에서 찾은 버그와 수정**
- 증상(운영에서만 재현): 등록하면 "갤러리에 올렸습니다."가 뜨는데 목록은 `0개`로 남는다. 강사가 숨기기를 눌러도 글이 그대로 보인다.
- 원인: 목록 API는 CDN에 `s-maxage=5, stale-while-revalidate=10`으로 최대 15초 캐시된다. 클라이언트의 `cache: "no-store"`는 브라우저 캐시만 건너뛰고 Vercel CDN 캐시는 건너뛰지 못한다. 로컬 dev에는 CDN이 없어 API 시험에서는 드러나지 않았다.
- 검토한 선택지
  - 캐시를 끄기: 교사 수십 명이 10초마다 조회하므로 캐시는 두는 게 맞다.
  - 등록 직후에만 `?t=시각`으로 캐시를 우회하기: 다음 폴링에서 오래된 캐시가 오면 글이 사라졌다가 다시 나타난다.
  - **채택:** 이 브라우저가 올린 글(`mine`)과 숨긴 글(`hiddenIds`)을 캐시 목록에 합쳐 보여 준다. 서버가 등록 응답에 글 정보를 돌려주므로 추가 요청이 없고, 캐시가 따라오면 id로 중복을 없앤다.
- 확인(운영, Playwright)
  - 등록 즉시 "시험-즉시 … Codex CLI, 방금"이 맨 위에 보였다. 22초 뒤 캐시가 갱신돼도 2개 그대로, 중복이 없었다.
  - `?admin=1`에서 키를 입력하자 숨기기 버튼이 생겼다. 누르면 즉시 목록에서 빠졌다.
  - 새로고침해도 sessionStorage에 키가 남아 입력칸 없이 버튼이 보였다.
- 정리: 시험 글은 모두 SQL로 지웠다(`nickname LIKE '시험-%'`인 행만 지우고, 다른 행이 있으면 멈추도록 함). 갤러리는 0행에서 시작한다. 숨김만 하면 UNIQUE(origin) 때문에 그 주소를 다시 쓸 수 없으므로 시험 데이터는 지우는 편이 낫다.
- 하지 않은 것
  - 틀린 관리 키를 넣으면 입력칸이 조용히 다시 나타날 뿐 오류 문구가 없다. 강사 혼자 쓰는 기능이라 그대로 두었다.
  - `GALLERY_CODE`와 `NEXT_PUBLIC_GALLERY_BACKUP_URL`은 운영에 설정하지 않았다. 연수 당일 강사가 정할 값이다.
