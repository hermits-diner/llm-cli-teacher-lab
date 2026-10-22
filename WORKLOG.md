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

### 11. 연수 런처에 자동 승인 켜기 (사용자 결정)

- 사용자가 "전부 승인"을 골랐다. 안전장치가 있는 자동 모드(`--mode auto`, `--permission-mode auto`, `workspace-write` + `never`)도 함께 제시했다.
  - `start-agy.cmd`: `agy --dangerously-skip-permissions`
  - `start-claude.cmd`: `claude --dangerously-skip-permissions`
  - `start-codex.cmd`: `codex --dangerously-bypass-approvals-and-sandbox`
- 수업 흐름을 "부탁 → 결재 → 확인 → 고치기"에서 **"부탁 → 확인 → 고치기"**로 바꿨다. 1교시 "결재 요청 읽기" 단계는 **"지켜보고 멈추기"(Esc)**로 바꿨다. 소개·2·3·4교시·홈·도움말·파일 페이지의 결재 문구도 함께 고쳤다.
- 허락 질문이 사라진 대신 업무 지침서(`_AGENTS.md`)에 규칙을 넣었다. "파일 지우기, 이 폴더 밖의 파일 읽기·쓰기는 먼저 묻고 기다린다."
- 4교시와 소개 페이지에 안내를 넣었다. "연수용 실행 파일만 자동 승인이고, 평소에는 `agy`·`codex`·`claude` 만 입력해 허락을 묻는 방식으로 쓴다."
- **첫 실행 화면 확인** (빈 폴더에 zip을 풀고 런처를 가상 터미널로 실행, `@lydell/node-pty` + `@xterm/headless`)
  - Codex: 폴더 신뢰 질문 없이 바로 `permissions: YOLO mode`. 준비 페이지의 "trust" 단계를 이 표시 확인으로 바꿨다.
  - Claude: "Yes, I trust this folder" 다음에 `⏵⏵ bypass permissions on`
  - agy: "Yes, I trust this folder" 다음에 바로 입력창. 모드 표시는 없다.
  - **확인 못 한 것**: 처음 쓰는 PC에서 Claude가 띄우는 Bypass Permissions 경고 화면. 이 PC는 경고 없이 바로 켜졌다(예전에 수락한 것으로 보인다). 이 PC의 설정 파일을 보려던 확인은 자동 모드 검사에 막혔다. 준비 페이지에는 "경고 화면이 나오면 **Yes, I accept**"를 넣었다. → Windows Sandbox 시험 때 실제 문구를 확인할 것.
- **동작 확인** (세 도구 모두 같은 런처로 실행)
  - "hello.txt 만들고 `node -v` 실행" → 세 도구 모두 허락 질문 없이 완료
  - "hello.txt 지워 줘" → agy·Claude는 지침대로 먼저 물어보고 지우지 않았다. **Codex는 바로 지웠다.** 사용자가 직접 지우라고 한 경우라 지시를 따른 것으로 볼 수도 있지만, 지침의 "먼저 묻기"는 지키지 않았다. 지침은 안내일 뿐 강제가 아니다.
- `verify-missions`는 보안 리뷰(8번)에서 좁힌 권한을 그대로 둔다. 교사 런처와 플래그가 다르다는 점에 주의할 것.

### 12. 이모지 → 선화 아이콘, 표지 QR, 제목 변경, 색상 테마, 바이브 코딩 슬라이드

- 이모지 9종을 `components/Icon.tsx`의 볼펜 선화 SVG로 바꿨다(currentColor). 👋는 "말 걸기"에 맞춰 말풍선으로 그렸다.
- 표지에 사이트 QR을 스티커 카드로 넣었다(사용자가 준 PNG, 해독해서 운영 주소인 것을 확인). 카드는 모든 테마에서 흰 바탕을 쓰고, 900px 이하에서는 숨긴다. 캡처 화면으로 읽기 시험: 1280·1424·1920 폭 모두 성공.
- 제목: "LLM CLI 기반 수업자료제작 및 업무활용"(사용자 표기 그대로)
- 색상 테마: 자동·주간·야간·칠판. 부트 스크립트가 "자동"을 day/night로 풀어 `html[data-theme]`에 넣으므로, CSS는 구체적인 테마만 다룬다. 바꾸는 것은 원시 색상뿐이고, 연한 배경색은 `color-mix`로 만든다. cmd 블록은 모든 테마에서 Campbell 색을 유지한다.
- "LLM CLI 알아보기"에 "에이전트 코딩(바이브 코딩)의 순서" 절과 흐름도(`AgentFlow`)를 넣었다. 발표 모드에서 한 장(4/8)이다.
- 함정
  - `mdx-components.tsx`에 부품을 등록해도, 이미 떠 있는 dev 서버에는 반영되지 않는다("Expected component … to be defined"). 서버를 다시 띄워야 한다.
  - Chrome `--headless --screenshot`은 390px처럼 좁은 폭을 정확히 그리지 못한다. 폭 측정과 캡처는 puppeteer-core의 setViewport로 한다.

### 13. 갤러리 예비 게시판(Padlet)

- 사용자 Padlet 계정의 학교 작업공간 "부산동고등학교"에 보드를 만들었다: https://padlet.com/busandonggo/padlet-s024pf1ertgi2rh4hr4m
  - 계정에서 보드를 만들 수 있는 작업공간이 이것 하나뿐이었다.
  - 링크가 있으면 로그인 없이 쓸 수 있다(visitor writer). 웹·프로필 공개(isPublished)는 껐다.
  - 글쓰기 칸: 제목은 닉네임(필수), 본문은 주소와 도구(필수), 첨부는 끔
- Vercel 환경변수는 이 PC에서 바꿀 수 없었다(MCP는 다른 계정, CLI는 로그인 안 됨). 그래서 `lib/site.ts`의 `GALLERY_BACKUP_URL` 기본값으로 넣었다. `NEXT_PUBLIC_GALLERY_BACKUP_URL`을 설정하면 그 값이 우선한다.
- 시험: `DATABASE_URL=`로 비우고 `next start` → API 503, 갤러리에 "예비 게시판" 링크가 위 Padlet으로 나왔다.
- DB 위치(Neon MCP로 조회): Neon 조직 "Vercel: Hermit's Diner", 프로젝트 `llm-cli-gallery`(noisy-darkness-63955754), aws-ap-southeast-1, PG 18, Free. 로컬 `.env.local`에는 지금 DB 주소가 없다(OIDC 토큰만 있음).

### 14. websitesondisplay 참고: 톤 정리와 갤러리 미리보기 격자

- 참고 사이트는 `ondisplay.website`다(사용자가 적은 `ondsiplay.website`는 열리지 않았다). 특징은 따뜻한 검정(#16140D)과 회색 글자, Geist·Geist Mono, 그림자 없음, 머리카락 선, 썸네일 4열 격자.
- 사용자가 "톤 정리 + 갤러리 격자"를 골랐다.
  - 글꼴: 본문 영문 Inter → Geist. `--font-label`(Geist Mono, 대문자, 자간)을 메뉴와 레이블에 쓴다. 손글씨(Gaegu)는 표지와 메모 몇 곳에만 남겼다.
  - `--shadow-card: none`, 모서리 2~4px. 표지 학습지의 `--shadow-paper`는 유지한다.
  - 야간 테마를 남색에서 따뜻한 검정으로 바꿨다.
- 갤러리: 카드마다 iframe 미리보기를 넣었다(400% 크기로 그린 뒤 0.25배로 축소, `sandbox="allow-scripts"`, pointer-events 없음). 카드 전체를 링크로 만들려고 `::after`로 늘렸다. 목록은 본문 폭을 벗어나 76rem까지 넓어진다.
- 시험: puppeteer로 `/api/gallery` 응답을 가로채 예시 글 5개를 넣었다. 운영 DB에는 쓰지 않았다. 주간·야간·칠판, 390px에서 확인했다.

### 15. 데스크톱·Full HD 화면에 맞추기

- 발견: 1440~1920px 화면에서도 본문이 `--measure: 44rem`(약 700px) 기둥에 갇혀 모바일 화면처럼 보였다. 1536px 창에서 "오늘 남는 것" 카드가 한 장에 약 347px였다. 발표 모드에서는 `.results`가 `13rem`으로 고정돼 1920×1080 슬라이드에서 312px였고, 화면 오른쪽 절반이 비었다.
- 고친 것 (`app/globals.css`)
  - 기본 글자: `106.25%` → `clamp(106.25%, 0.625vw + 0.5rem, 125%)`. 1440px 이하에서는 지금처럼 17px, 1920px에서는 20px다. 크기가 모두 rem이라 폭·여백·제목이 함께 커진다. 발표 모드는 `html[data-present]`의 자체 크기가 우선한다.
  - 본문 폭 `--measure` 44rem → 72rem. 문단·목록은 `--measure-text`(46rem)로 줄 길이를 유지하고, 카드·cmd 창·표·단계 상자만 넓게 쓴다.
  - 홈 히어로: 64rem 이상에서 제목은 가로 전체, 그 아래 왼쪽에 설명과 버튼, 오른쪽에 실습 화면 예시. 왼쪽 단을 1.15fr로 둔 이유는 버튼 3개(합계 595px)가 1:1(569px)에서는 줄이 바뀌었기 때문이다. 발표 모드에는 적용하지 않는다(`html:not([data-present])`).
  - 교시 사진에 `max-height: 20rem`. 폭이 넓어지면 16:6 사진이 446px까지 커져 첫 화면에서 실습 단계를 가렸다.
  - 발표 모드 결과 카드: `min(22rem, 40vh)`. 1080 화면에서 432×576px. 이보다 크면 제목과 카드가 한 슬라이드에 들어가지 않아 둘로 쪼개진다.
- 결과 이미지 선명도
  - `public/images/result-web.png`가 390×780(1배)이라 688px로 늘어나 흐렸다. `practice-pack/samples/mission1/index.html`을 같은 390×780 화면, deviceScaleFactor 2로 다시 찍어 780×1560으로 바꿨다. 구도와 줄바꿈은 원본과 같다.
  - 홈의 결과 `<Image>` 두 개에 `sizes="(min-width: 1024px) 45vw, 100vw"`를 넣었다. 고정 `width`만 있으면 표시 폭과 상관없이 640/828 후보만 만든다.
- 확인
  - 1280·1366·1920 폭에서 `/home`, `/mission-1`, `/intro`, `/commands`, `/gallery` 모두 가로 넘침 없음. 히어로 버튼은 세 폭 모두 한 줄.
  - 1920×1080: 본문 1440px, "오늘 남는 것" 카드 688×917px(제목·카드·설명이 한 화면). 표지는 스크롤 없이 한 화면.
  - 발표 모드 1920×1080: 홈은 여전히 6장, 3번 슬라이드에 카드가 한 번에 들어간다.
  - `npm run typecheck` 통과.
  - 노트북: 1280×720·1280×800·1366×768에서는 기본 글자가 이전과 같은 17px다. 반분할(640·683·768·960폭)에서도 5개 페이지 모두 가로 넘침이 없고, 예전처럼 한 단으로 쌓인다. 발표 모드는 1280×720·1366×768·1536×864·1920×1080 모두 홈이 6장이고, 모든 슬라이드가 화면 안에 들어간다(1280×720에서 가장 긴 슬라이드 아래 끝 672px).
- 남은 과제 (노트북, 커밋 뒤 검토) → 16번에서 고쳤다
  - 1280×720·1366×768에서 "오늘 남는 것" 카드가 584×779px로 화면 높이보다 크다. 카드 높이를 약 75vh로 묶는 방안이 있다.
  - 같은 화면에서 교시 사진 높이가 340px(이전 약 250px)라 첫 화면에서 실습 단계가 더 밀린다. `max-height: min(20rem, 35vh)`로 바꾸면 720에서 252px가 된다.
- 함정
  - Playwright 캡처에서 CDP `Emulation.setDeviceMetricsOverride`로 배율을 2로 올려도 `page.screenshot({ scale: 'device' })`는 1배로 줄여 저장한다. `browser.newContext({ deviceScaleFactor: 2 })`로 새 컨텍스트를 만들어야 2배로 나온다. 또 기본 스크롤바(15px)가 폭을 줄여 줄바꿈이 달라지므로 `html { scrollbar-width: none }`을 넣고 찍는다.
  - 이미지를 바꿔도 dev 서버는 `.next/dev/cache/images`의 예전 최적화 결과를 계속 준다. 그 폴더를 지워야 반영된다.
  - pull 직후 `tsc`가 `.next/types/validator.ts`의 예전 경로(`app/gallery/page.js`) 때문에 실패했다. 05:01 빌드가 남긴 파일이다. `npx next typegen`으로 다시 만들면 통과한다.
  - Playwright MCP 창은 사용자도 함께 보고 조작한다(확대 배율 110%, `P` 키 발표 모드). 측정값이 이상하면 `devicePixelRatio`와 `data-present`부터 확인한다.
- 하지 않은 것
  - 갤러리 격자의 76rem 넓히기(`margin-inline` 계산)는 그대로 뒀다. 본문이 72rem이 되면서 양옆으로 2rem씩만 더 나온다. 1280px 창에서는 계산상 양옆 28px씩 나와 화면 안에 들어간다(로컬에는 DB 주소가 없어 글이 있는 격자로는 측정하지 못했다).
  - 모바일 전용 조정은 하지 않았다(사용자: "모바일용이 아니다"). 좁은 화면에서는 기존처럼 한 단으로 쌓인다.

### 16. 노트북 화면 보완 (15번의 남은 과제)

- 결과 카드: `.results`에 `max-width: calc(2 * 56vh + 1.25rem)`를 넣었다. 카드가 3:4라 폭 56vh가 높이 75vh다. 카드 하나에 `max-height`를 주는 방법은 `object-fit: cover` 때문에 미리보기 아래쪽이 잘리고, 카드 하나에 `max-width`를 주면 칸 안에서 왼쪽으로 붙어 두 카드 사이가 벌어져서 쓰지 않았다.
- 교시 사진: `max-height: 20rem` → `min(20rem, 35vh)`. 발표 모드는 `height: 32vh`가 더 작아서 영향이 없다.
- 확인 (별도 브라우저 컨텍스트에서 측정)
  - 카드: 1280×720 403×538, 1366×768 430×573, 1536×864 484×645, 1920×1080 605×806 (모두 75vh). 640·960 반분할은 컨테이너가 더 좁아 그대로(285×380, 445×593).
  - 사진: 720 높이에서 252px(이전 레이아웃의 약 250px과 같음), 1080에서 378px.
  - 1280×720 화면 캡처: "오늘 남는 것" 제목·카드 두 장·설명이 한 화면, 2교시 첫 화면에 "이번 시간에 남는 것" 안내까지 보인다.
  - 6개 폭 × 5개 페이지 모두 가로 넘침 없음. 발표 모드 홈은 1280×720·1366×768·1920×1080 모두 6장.

### 17. Node.js 설치 실패 대비 (setup.bat, 막혔어요 E04)

- 발견 (코드 읽기와 재현)
  - Node.js 확인 단계가 `node -v`의 실패를 검사하지 않았다. 실행할 수 없는 가짜 `node.exe`(글자 파일)를 두고 그 부분만 떼어 돌리면 `[ OK ] Node.js ?`가 나왔다. 보안 프로그램이 실행을 막거나 32비트 Windows이면 결과 화면이 "All done"으로 끝나고, 3교시에야 문제가 드러난다.
  - Node.js 단계가 실패하면 AI 도구 단계를 건너뛰고 결과 화면으로 갔다. 세 CLI는 Node가 필요 없는데(1번) Node 하나 때문에 1교시부터 막혔다.
  - Node.js 23부터 32비트 Windows판이 없다. v24.22.0 `SHASUMS256.txt`에 `win-x86`이 0개다(v22.12.0은 6개). 그런데 bat은 x86 PC에서도 x64판을 받았다.
  - E04 도움말은 "끊김·손상·백신"만 다뤘다. 학교망 차단, 실행 차단, 32비트는 안내하지 않았다.
- 고친 것 (`downloads-src/setup.bat`, `app/(site)/help/page.mdx`)
  - A. `node -v` 결과가 비었거나 `v`로 시작하지 않으면 `[FAIL] node.exe is there but does not run` → E04.
    - 32비트 Windows는 1단계에서 `[WARN]`을 띄운다. 4단계에서는 내려받지 않고 바로 E04로 처리한다.
    - 점검 모드(4)도 32비트이면 E04로 끝낸다.
  - B. Node.js가 실패해도 5단계(AI 도구 설치)로 넘어간다.
    - AI 도구가 OK이면 결과 화면에 E04와 함께 "지금 시작할 수 있다, 한글 양식 실습 전에 Node.js를 고쳐라"를 보여 준다. 이어서 다음 할 일을 보여 주고 폴더를 연다.
    - AI 도구도 실패하면 E05를 먼저 보이고, Node.js 도움말 주소를 한 줄 더 붙인다.
  - C. 막혔어요 E04: `Could not prepare Node.js` 바로 위 줄로 경우를 찾게 했다.
    - 끊김·학교망 차단 → 다시 실행, 핫스팟
    - `checksum mismatch` → 보안 프로그램, certutil
    - `does not run` → 백신 예외, 개인 노트북
    - `32-bit Windows` → 64비트 PC
    - AI 도구 줄이 OK면 1·2교시는 할 수 있다고 적었다.
- 왜 이렇게 했나
  - 64비트 Windows에서 32비트 cmd가 돌 때도 `PROCESSOR_ARCHITECTURE`는 x86이다. 이때는 x64 Node가 돌아간다. 그래서 `PROCESSOR_ARCHITEW6432`가 없을 때만 32비트로 본다.
  - 점검 모드의 E04는 1단계가 아니라 결과 화면 직전에, 다른 오류가 없을 때만 넣는다. 1단계에서 `AL_ERR`를 채우면 뒤의 인터넷 점검이 `if not defined AL_ERR` 때문에 E03을 넣지 못한다.
  - 오류 코드를 여러 개 담는 구조로 바꾸지 않았다. 둘 다 실패한 경우에만 한 줄을 더 붙여 결과 화면 흐름의 변경을 줄였다.
- 확인 방법
  - `public/setup.bat`을 복사해 시험용 폴더와 로컬 서버(`AI_LAB_DIR`, `AI_LAB_SITE`)로 실행했다. 도구는 agy를 골랐다.
  - 탐색기 창이 뜨지 않도록 복사본의 `start` 줄은 표시 문구로 바꿨다.
- 확인 결과
  - T1 정상: Node v24.22.0을 실제로 내려받았고, agy 1.4.3 OK, "All done". 이전과 같다.
  - T2 실행되지 않는 node.exe: `does not run` → Node FAIL, agy OK. E04와 "ready, you can start now", 다음 할 일이 나온다.
  - T3 내려받기 실패(복사본에서 버전을 v0.0.0으로 바꿈): curl 404, T2와 같은 결과.
  - T4 32비트(복사본에서 `AL_NODE_ARCH=x86`): 1단계 WARN, 4단계는 내려받기 없이 FAIL, agy OK, E04.
  - T5 Node와 AI 도구가 둘 다 실패(복사본에서 agy 경로를 없는 파일로 바꿈): E05와 `Node.js : .../help#E04`가 나오고, 시작 안내와 폴더 열기는 없다.
  - 점검 모드
    - 정상 → "looks ready"
    - `PROCESSOR_ARCHITECTURE=x86` → WARN, E04
    - 실제 32비트 cmd(`SysWOW64\cmd.exe`, x86/AMD64) → 경고 없이 "looks ready"
  - 실행에 실패해도 cmd는 `>` 대상 파일을 먼저 비운다(크기 0). 그래서 이전 실행의 버전 파일이 남지 않으며, 지우는 줄을 넣지 않았다.
  - 막혔어요: 개발 서버 `/help` 200, E04 목록 4개.
- 삽질
  - Git Bash의 `sed`로 bat 복사본을 만들면 CR이 모두 빠진다(CR 415 → 0). LF만 있는 bat은 레이블과 goto가 깨져 시험이 틀어진다. `perl -pi -e 's/\r?\n/\r\n/'`로 되돌렸다.
  - 패턴에 `\agy\bin\`처럼 백슬래시를 쓰면 치환이 오류 없이 적용되지 않았다. T5 처음 두 번은 agy가 OK로 나왔다. `.`으로 대신 맞췄다. 시험 조건이 실제로 들어갔는지(`grep nope`)부터 확인할 것.
  - 64비트 cmd에 `PROCESSOR_ARCHITEW6432=AMD64`를 환경변수로 넘겨도, Windows가 프로세스를 만들 때 두 변수를 원래 값으로 되돌린다(로그에 `arch=AMD64`). 32비트 cmd는 `SysWOW64\cmd.exe`로 직접 시험해야 한다.
- 하지 않은 것
  - certutil이 막힌 경우를 "손상"과 구분하는 코드는 넣지 않았다. 드물어서 도움말에서만 안내한다.
  - 실제 32비트 Windows PC와 보안 프로그램이 실행을 막는 PC에서는 시험하지 못했다. 모두 흉내 낸 조건이다.
  - 32비트 Windows에 세 AI 도구가 설치되는지는 확인하지 않았다. 안 되면 E05로 나온다.
  - 이 PC에는 agy가 이미 설치되어 있어, 설치 프로그램은 "already installed"로 끝났다. 새 PC에서 agy를 설치하는 경로는 이번에 바꾸지 않았고 다시 시험하지도 않았다.
  - Node.js 없이 3교시를 대신하는 방법(예: 완성 예시 사용)은 이번에 만들지 않았다.

## 2026-10-22

### 18. 배포처를 Netlify에서 Vercel로 바꾸기: 결정과 Vercel Drop 리허설

- 결정 (사용자)
  - 2교시 배포를 Netlify Drop에서 Vercel Drop(vercel.com/drop, 2026-06 출시)으로 바꾼다.
  - 이유
    - 계정 하나로 마무리의 "GitHub 연결 → 자동 게시"까지 이어진다. 지금은 Netlify(2교시)와 Vercel(마무리) 두 계정이 필요하다.
    - Netlify의 비공개 시작(2026-07-28 이후 가입 계정)과 Make public 단계가 없어진다.
    - 무료 배포 횟수: Netlify 월 20번 안팎, Vercel Hobby 하루 100번.
    - 연수 사이트가 이미 vercel.app이라 학교망에서 열어야 할 도메인이 하나 준다.
  - 근거: https://vercel.com/docs/drop , https://vercel.com/kb/guide/vercel-drop-vs-netlify-drop , https://vercel.com/docs/deployment-protection
- 리허설 방법
  - hermit-s-diner 팀(Hobby)에 로그인된 Chrome으로 `practice-pack/samples/mission1/index.html`을 올렸다.
  - 공개 여부는 로그인 없는 curl로 확인했다.
- 리허설 결과
  - 첫 배포: 파일 선택 → 팀·프로젝트 이름 → Deploy. 약 10초.
  - 이름 기본값은 `<title>`에서 한글을 뺀 값이다. 샘플은 "2학년 3반 ..." → `2-3`.
  - 한글 이름은 입력 즉시 막힌다: "A Project name can only contain up to 100 lowercase letters, digits, and the characters '.', '_', and '-'."
  - 이미 쓰인 주소는 경고 없이 단어가 붙는다. `class-notice`(남의 사이트, 200) → `class-notice-theta.vercel.app`.
  - 성공 화면에는 주소가 글자로 없다. 미리보기 그림(짧은 주소 링크)과 "Continue to Project"만 있다.
  - 짧은 주소(Domains) `class-notice-theta.vercel.app` → 200, 한글 정상.
  - 긴 주소(Deployment) `class-notice-9ullp14jx-hermit-s-diner.vercel.app` → 302 `vercel.com/sso-api`(로그인). 프로젝트 화면에서 긴 주소가 짧은 주소보다 **위**에 있다.
  - Visit 버튼은 짧은 주소로 간다.
  - 다시 올리기: 프로젝트 화면에 폴더를 끌어다 놓으면 "Deploy a new production version of class-notice" 오버레이가 뜨고, 같은 짧은 주소가 갱신된다. 배포 기록 2건, 새 프로젝트 없음. Vercel 비교 글의 "드롭할 때마다 새 프로젝트"는 vercel.com/drop·/new에 놓을 때의 이야기다.
  - `index.html`이 없어도 된다. `우리반-안내.html` 하나만 올리면 Root (/) 칸에 자동 선택되고 "No index.html found, so this page will load at your site's root."가 뜬다. `/` 200, `/우리반-안내.html` → 308 → `/우리반-안내` 200, `/index.html` 308.
  - 가입 방법: Google, GitHub, ChatGPT, Apple, 이메일.
- 연수 페이지에 반영할 것
  - 프로젝트 이름은 영문 소문자·숫자·하이픈으로 직접 짓게 한다. 기본값(`2-3`)은 서로 겹친다.
  - 공유 주소는 "Visit 버튼으로 열린 주소"로 안내한다. 긴 주소는 로그인 창이 뜬다는 항목을 막혔어요에 넣는다.
  - 갤러리 검사를 `.vercel.app`으로 바꾸고, 302 → `vercel.com/sso-api`도 "공유용 짧은 주소가 아니다"로 안내한다.
  - 마무리 예시 `class-notice.vercel.app`은 남의 사이트이므로 바꾼다.
- 삽질
  - 자바스크립트로 만든 drop 이벤트(DataTransfer + File)는 오버레이까지만 뜨고 업로드되지 않는다. 실제 파일 시스템 항목이 필요한 것으로 보인다. 다시 올리기는 사용자가 직접 끌어다 놓아 시험했다.
  - `AppData\Local\Temp` 아래 폴더를 끌어다 놓으면 Chrome이 "시스템 파일이 포함되어 있어 열 수 없다"며 막는다. `바탕 화면\ai-lab-rehearsal\mission1\site`로 옮겨 다시 하니 됐다. 선생님들의 `바탕 화면\ai-lab\mission1\site`도 같은 조건이다.
  - Chrome 확장의 file_upload는 이 세션 작업 폴더 안의 파일만 받는다(임시 폴더·바탕 화면 거부). 프로젝트 안 임시 폴더에 복사해 시험하고 지웠다.
  - Vercel MCP는 다른 팀에 연결되어 있어 hermit-s-diner 프로젝트가 보이지 않았다. 대시보드로 확인했다.
  - 가입 화면을 Playwright로 보던 중, 누르지 않았는데 Google 로그인 화면으로 넘어갔다. 아무것도 입력하지 않았다.
- 하지 않은 것 / 남은 것
  - 새 계정 실제 가입(휴대폰 인증 여부 등)은 하지 않았다.
  - 미션 1 심화(CLI 배포)를 Vercel CLI로 바꾸는 것은 아직 시험하지 않았다.
  - 정리: 바탕 화면 `ai-lab-rehearsal` 폴더는 휴지통으로 보냈다. Vercel 프로젝트 `class-notice`, `llm-cli-rehearsal-root`는 되돌릴 수 없는 삭제라 사용자가 직접 지웠다(Settings → Delete Project).
  - 삭제 확인: 대시보드 목록에서 사라졌고 긴 주소는 404 `DEPLOYMENT_NOT_FOUND`. 그런데 짧은 주소 두 개는 삭제 직후에도 200이었다. `X-Vercel-Cache: HIT`, `Age` 950~1100초, `icn1`(서울 엣지)이라 지우기 전 캐시가 남은 것이다. 쿼리 문자열을 붙여도 HIT였다. 지운 페이지가 한동안 더 보일 수 있다는 뜻이다.

### 19. 연수 페이지를 Vercel 기준으로 바꾸기 (18번 리허설 반영)

- 바꾼 것
  - 2교시(`mission-1`): 배포 단계를 Vercel Drop 다섯 단계로 바꿨다. 이름 규칙(영문 소문자·숫자·하이픈), 축하 화면의 미리보기 그림으로 주소 열기, "공유할 주소는 짧은 주소" 경고, 접기(이름 겹침·다시 올리기·index.html 아님·Hobby 하루 100번·비상업)를 넣었다.
  - 2교시 "집에서 해 보기"(netlify-cli로 AI가 배포)는 사용자 결정으로 뺐다. Vercel CLI 로그인 흐름을 시험하지 않았기 때문이다.
  - 준비(`prepare`): "Netlify 가입하기" → "Vercel 가입하기"(`#prep-vercel`). 공개 설정 접기는 지웠다.
  - 막혔어요(`help`): Netlify 두 항목을 지우고 Vercel 네 항목을 넣었다. 긴 주소 로그인 화면, 이름 칸 빨간색, 시스템 파일 때문에 못 엶, 다시 올렸더니 주소가 하나 더 생김.
  - 마무리(`wrap-up`): 다음 단계를 "2교시 프로젝트에 Connect Git으로 저장소 연결, 주소 그대로"로 줄였다. Netlify와의 횟수 비교 문장과 남의 사이트인 `class-notice.vercel.app` 예시를 지웠다.
  - 갤러리: `netlifyOrigin` → `vercelOrigin`(`https://이름.vercel.app`만 받음). `checkPublic`은 3xx이면서 `Location`이 `https://vercel.com/`으로 시작하면 `private`으로 판정한다. 안내 문구는 "Visit 버튼으로 연 짧은 주소를 올려 주세요".
  - 그 밖의 문구: home, gallery, files, README, practice-pack `README.txt`·`_AGENTS.md`. setup.bat 연결 점검은 `app.netlify.com` → `vercel.com`(HEAD 200 확인).
- 왜 이렇게 했나
  - 긴 주소를 형식(`-<9자>-<팀>.vercel.app`)으로 거르지 않고 실제 응답으로 판정했다. 프로젝트 이름에 하이픈이 많으면 형식만으로는 잘못 거를 수 있다.
  - 막혔어요의 시스템 폴더 항목은 확인한 경우(임시 폴더 막힘, 바탕 화면 아래 폴더는 됨)만 적었다. 압축 파일 안에서 끌어다 놓는 경우 등은 시험하지 않아 넣지 않았다.
- 확인
  - Node 24로 `lib/gallery.ts`를 직접 불러 실제 주소로 시험했다. 짧은 주소 `ok`, 긴 주소 `private`(302 → vercel.com/sso-api), 없는 주소 `missing`, netlify·`http://`·`evil.vercel.app.example.com`·사용자 정보·포트 → 거부.
  - `npm run typecheck` 통과, `npm run build` 통과. `public/setup.bat`은 "CRLF, ASCII" 검사를 통과했다. setup.bat 작업본도 CR 415 = LF 415.
  - `next start`로 mission-1·prepare·help·wrap-up·gallery·home·files 모두 200, Netlify 문구 없음. 2교시 배포 단계 화면을 캡처해 확인했다.
- 남은 것
  - 로컬 `next start` 첫 로딩 한 번에 React 418(하이드레이션 불일치) 콘솔 오류가 났다. 다시 열면 재현되지 않았고, 배포 후 운영의 mission-1·help·prepare에서도 나지 않았다. 원인은 확정하지 못했다.
  - 홈 결과 카드 `result-web.png`(학급 안내 페이지 자체)와 2교시 사진 `photos/mission-1.jpg`(휴대폰·노트북)에는 Netlify 화면이 없어 그대로 둔다.
  - Connect Git(마무리 다음 단계)은 문서 기준이고 실제로 시험하지 않았다.
- 배포 확인 (커밋 29f66b2, 푸시 후 약 35초에 반영)
  - 운영 7개 페이지 200, Netlify 문구 0건. 운영 `setup.bat` 177행 `call :net "https://vercel.com"`.
  - 운영 갤러리 API: netlify 주소 → "Vercel 주소만", 리허설 긴 주소 → "Visit 버튼으로 연 짧은 주소". 둘 다 거부라 DB에는 쓰지 않았다.

### 20. Canva·Padlet MCP 안내 (보류, 조사만)

- 상태: 사용자 결정으로 나중에 다룬다. 사이트는 바꾸지 않았다.
- 정해 둔 방향 (사용자 답변)
  - 새 페이지(예: `/connect`)에 연결 방법과 AI에게 부탁하는 예시 문장을 함께 싣는다. 소개의 MCP 설명과 마무리에서 링크한다.
  - 예시 문장은 실제로 시험한 뒤 싣는다.
  - 계정: 교사는 AI 도구는 개인 계정, Canva·Padlet은 학교 계정을 쓰는 경우와, 연수 전용 계정을 쓰는 경우가 섞여 있다. 리허설은 개인 계정과 학교 계정 모두로 한다.
  - 연수용 실행 파일은 자동 승인이므로, 안내는 "허락을 묻는 방식으로 켠 AI에서만 연결"을 전제로 한다.
- 조사 결과 (2026-10-22)
  - Padlet: `https://mcp.padlet.com`, 무료 계정 가능. 문서에 Claude·ChatGPT·Gemini만 있고 Codex·agy는 언급이 없다. 공개·편집 권한 변경, 학생 게시물 검토·채점 도구가 있다(학생 정보와 닿음).
  - Canva: 공식 AI 커넥터는 Free·Education 계정에서도 된다. 지원 목록은 ChatGPT·Claude·Gemini·Copilot 앱뿐이고 CLI는 없다. 개발자 문서는 Developer Portal 앱 등록을 요구한다. Education 관리자가 커넥터를 끌 수 있다.
  - Claude Code는 claude.ai에서 연결한 커넥터를 그대로 쓴다. 이 PC의 Claude Code에서 Padlet 계정 조회(읽기 전용)가 실제로 됐다. Canva는 커넥터만 있고 로그인 전이다.
  - AI 도구 로그인과 Canva·Padlet 로그인은 따로다. 브라우저에 로그인된 계정이 연결되므로 연결 직후 "지금 연결된 계정이 누구야?"로 확인하는 단계가 필요하다.
  - 그 밖의 후보: Notion(`mcp.notion.com/mcp`, 모든 요금제, Claude Code·Codex·Antigravity 연결 문서 있음), 카카오 PlayMCP(`playmcp.kakao.com/mcp`, 톡캘린더·나와의 채팅방 등). Google Workspace 공식 MCP는 Cloud 프로젝트·OAuth 클라이언트·개발자 미리보기 가입이 필요해 초보 교사용으로 맞지 않다. 나이스는 공식 MCP가 없다.
- 다음에 할 일: Claude Code에서 Canva 로그인 → 예시 문장 시험, Codex·agy에서 두 서비스 등록·로그인 시험, 학교 계정에서 막히는지 확인.

### 21. 스킬을 "교사가 직접 설치"하는 연수로 개편: 결정과 사전 시험

- 결정 (사용자)
  - 실습 3가지: HTML 작성·Vercel 배포(2교시), **hwpx 스킬 설치 → 문서 작성**(3교시), **pptx 스킬 설치 → 슬라이드**(선택 과제). 90분 유지.
  - 스킬은 교사가 AI에게 "설치해 줘"라고 부탁해 **전역**으로 설치한다. 우리 스킬(school-hwpx·school-pptx)은 만들지 않고, claw-hwp·school-hwpx는 처음부터 넣지 않는다.
  - hwpx 스킬은 공개 스킬 **jkf87/hwpx-skill**, pptx 스킬은 **Anthropic 원본**(`anthropics/skills`의 pptx). Python은 setup.bat이 설치한다. LibreOffice 설치를 전제하지 않는다.
  - Canva MCP로 슬라이드 만들기는 **부록**, 플러그인 설명을 넣는다. 그 밖의 MCP는 나중에.
  - 계획 원본: `~/.claude/plans/skills-install-restructure.md`
- 확인한 사실 (이 PC에서 직접 측정)
  - 세 CLI 모두 pptx 스킬이 기본 내장이 아니다. Codex 0.154.0 기본 스킬 5개, agy 1.4.3 기본 스킬 9개. Claude Code에는 claude.ai 계정 동기화로 들어올 수 있다.
  - 전역 스킬 폴더는 빈 시험 스킬(`probe-…`)을 세 후보 폴더에 넣고 AI에게 물어 확인했다.
    - Claude Code `~/.claude/skills`, Codex `~/.agents/skills`
    - **agy 1.4.3은 `~/.gemini/config/skills`만** 읽는다. 웹 문서의 `~/.gemini/antigravity-cli/skills`와 `skills` 도구가 넣는 `~/.agents/skills`는 읽지 않는다.
    - `~/.gemini/config/skills.json`에 `entries: [{ path }]`로 `~/.agents/skills`를 등록하면 읽는다. 단 `~`는 안 되고 **절대 경로(슬래시)**만 된다.
  - `npx skills add`(vercel-labs/skills)는 저장소를 **git clone**한다. Git이 없으면 `spawn git ENOENT`로 실패한다. 교사 PC에는 Git이 없으므로 MinGit을 함께 설치한다.
  - jkf87 최신본
    - 스킬 문서는 `python`을 쓰고, 하위 실행은 `sys.executable`이다. `python3`는 사용 예 주석에만 있다.
    - 패키지: `lxml jsonschema Pillow pywin32`, 글자 추출(`text_extract.py`)은 `python-hwpx`도 필요하다.
    - 한국어 Windows 콘솔(cp949)에서 ☑ 같은 기호를 출력하다 실패한다 → `PYTHONUTF8=1`.
    - 페이지 그림 검사(`render_hwpx.py`)는 문서와 달리 **Poppler(pdftoppm)가 없으면 실행되지 않는다** → 교사가 한글에서 직접 연다.
    - 우리 양식의 `{{ }}`는 `fill_hwpx.py replace --map`으로 채워진다. 한컴오피스로 열어 1쪽 정상, 본문 `\n`은 문단 둘이 된다. `check --strict`의 "한컴 미경유" 경고는 실제로는 문제없었다.
  - Anthropic pptx: 만들기는 pptxgenjs(npm), 읽기·검사는 `markitdown[pptx] Pillow defusedxml lxml`. **LibreOffice 없이** 만들기 → `validate.py` → `markitdown`까지 되고 PowerPoint에서 열린다. 스킬은 "pptxgenjs가 미리 깔려 있다"고 가정하므로 작업 폴더에 `npm install`이 필요하다.
  - 라이선스: Anthropic pptx는 "All rights reserved, source-available" → 재배포 불가, 교사가 원본에서 설치. jkf87은 README에만 MIT(LICENSE 파일 없음) → 재배포하지 않고 교사가 원본에서 설치.
- 하지 않은 것
  - **Windows 샌드박스 시험**: 이 PC에 기능이 꺼져 있다(`WindowsSandbox.exe`·`wsb` 없음). 켜려면 관리자 권한과 재부팅이 필요해서, 임시 폴더 시험으로 대신했다.

### 22. setup.bat: Python·Git 설치, PATH, 환경 설정

- 바꾼 것 (5단계 → 7단계)
  - [5/7] Python 3.14.9 공식 설치 프로그램을 **사용자 계정 모드**로 조용히 설치한다(`InstallAllUsers=0`, `TargetDir=%LOCALAPPDATA%\Programs\Python\Python314`, 관리자·UAC 없음, `start /wait`). SHA256은 python.org 공식 값과 대조했다(amd64 `a247a0b6…`, arm64 `4508e6a5…`).
  - `python.exe`를 복사해 **`python3.exe`**를 만든다. Windows의 `python3`는 Store 바로가기다.
  - Python 폴더와 Scripts를 사용자 PATH **맨 앞**에 넣는다(`AL_PFRONT`). 사용자 PATH 앞쪽의 `WindowsApps`(Store 별칭)보다 먼저 잡혀야 하기 때문이다. Node·Git·AI 도구는 뒤에 붙인다.
  - 사용자 환경변수 `PYTHONUTF8=1`을 등록한다.
  - [6/7] MinGit 2.56.0.2(64-bit/arm64, SHA256 공식 값 일치)를 `ai-lab\tools\git`에 풀고 `cmd`를 PATH에 넣는다.
  - Node 폴더도 PATH에 넣는다. 전역 스킬을 `ai-lab` 밖에서도 쓰게 하기 위해서다.
  - agy를 고르면 `~/.gemini/config/skills.json`에 `~/.agents/skills`(절대 경로)를 더한다. 기존 항목은 유지하고, 이미 있으면 그대로 둔다.
  - PATH 등록을 `:path_put` 하나로 모았다. 실패하면 경고만 하고 결과 화면 PATH 줄을 WARN으로 바꾼다.
  - 새 오류 코드: E08(Python), E09(Git). Node·Python·Git 중 무엇이 실패해도 AI 도구는 설치한다. AI 도구가 OK면 "지금 시작해도 되고, 3교시 전에 FAIL 줄을 고쳐라"를 보인다.
  - 인터넷 점검에 github.com, python.org, pypi.org, registry.npmjs.org를 넣었다.
  - 시험용 스위치 `AI_LAB_NO_ENV=1`: 사용자 PATH·환경변수를 건드리지 않는다.
  - 실행 파일(`start-*.cmd`)도 Python·Git을 PATH에 넣고 `PYTHONUTF8=1`을 켠다. PATH 등록이 실패해도 동작하게 하기 위해서다.
- 확인
  - 시험본(agy 설치 부분만 Node로 대신, 폴더 열기만 echo)을 임시 홈·임시 LocalAppData·로컬 서버로 실행 → 7단계 모두 OK. `skills.json` 생성, `python3.exe` 생성을 확인했다.
  - 그 환경에서 MinGit만으로 두 스킬을 `-a antigravity-cli`로 설치했다. Python 3.14에 hwpx 패키지는 16초, pptx 패키지는 20초에 설치됐다. 양식 채우기(빈칸 0, validate 통과)와 pptx 만들기(validate 통과, 5장)도 됐다.
  - `npm run build`의 setup.bat 검사(ASCII·CRLF) 통과.
- 삽질
  - 처음 시험 폴더(세션 임시 폴더 아래)는 경로가 너무 길어, Python 설치 프로그램이 `pip\_vendor\urllib3\util` 아래 파일을 260자 제한에 걸려 **조용히 빼먹었다** → `No module named 'pip._vendor.urllib3.util'`. 교사 PC의 실제 경로는 짧아 해당 없음. `C:\Users\…\alt`로 옮겨 다시 시험했다.
  - 시험으로 깐 Python을 `/uninstall /quiet`로 지워도 `HKCU\Software\Python\PythonCore\3.14\InstalledFeatures` 키가 남았다. 시험 전에는 없던 키라 지웠다.
  - `Start-Process cmd /c "…"`에 따옴표가 셋 이상이면 cmd가 앞뒤 따옴표를 벗겨 경로가 깨진다 → 전체를 한 번 더 따옴표로 감쌌다.
  - 이 Bash 도구의 heredoc 안에서는 `\`가 `\` 하나로 줄어든다. 변환 스크립트에 역슬래시를 쓰지 말고 다른 문자로 쓴 뒤 바꿔 넣어야 했다.
  - PowerShell 문자열 `"$t: …"`는 `$t:`를 범위 지정 변수로 읽어 구문 오류가 난다 → `"${t}: …"`.

### 23. 실습 폴더·3교시·선택 과제·부록과 세 AI 실제 시험

- 바꾼 것
  - 실습 폴더: `tools/claw-hwp`, `tools/hwpx-fill.mjs`, school-hwpx 스킬을 지웠다. 지침서(`_AGENTS.md`)를 고쳤다.
    - 스킬 설치 부탁이면 사용자 폴더의 스킬 폴더에 설치해도 된다.
    - pip·npm 패키지는 설치해도 되고, LibreOffice·Poppler·winget 등은 설치하지 않고 그 단계를 건너뛴다.
    - Python 사용 금지 규칙을 뺐다.
    - 미션 2 순서와 슬라이드 규칙을 넣었다.
  - 사이트
    - 3교시: 설치 부탁 → 다시 켜기 → 양식 채우기
    - 새 페이지 `/slides`(선택 과제), `/canva`(부록: Canva·플러그인)
    - 소개 표에 플러그인 열 추가
    - 막혔어요: E08·E09, 스킬이 안 보임, 보안 경고, `python3` Store, cp949
    - 그 밖: 준비 결과 화면, 1교시 예시, 마무리 표, 명령어 표, 홈 참고 목록, 시간표 연결
  - 부탁 문장은 `content/prompts.json`의 `install.hwpx|pptx.<도구>`에 둔다. 도구별 차이는 `-a` 값뿐이다.
  - `verify-missions.mjs`: 결과 글자를 hwpx zip에서 직접 읽고, Claude에 `python` 실행을 허용했다. `make-forms.mjs`의 견본 채우기는 hwpx 스킬 `replace`로 바꿨다(임시 출력으로 시험, 빈칸 0).
- 세 AI 실제 시험 (이 PC에 로그인된 계정, 임시 작업 폴더, 시험용 Python·Node·Git만 PATH에 둠)
  - hwpx 스킬 설치 부탁: agy 36초, Codex 18초, Claude Code 39초, 모두 성공. Claude Code는 같은 대화에서 바로 새 스킬을 인식했다. 설치 도구가 보안 검사 결과 3개를 보여 주며 그중 하나(Socket)가 경고 1건을 냈다.
  - 가정통신문 1차: 세 도구 모두 파일을 만들었지만 **Codex가 `{{일시}}`·`{{장소}}`를 남기고 "모두 채웠다"고 보고**했다.
    - 원인: 스킬의 `analyze`·`text_extract`가 **표 안의 칸을 빠뜨린다**.
    - 대책: 실습 폴더에 `tools/blanks.py`(표 포함 `{{ }}` 목록)를 넣고, 지침서에 "채우기 전 목록, 채운 뒤 count 0 확인"을 넣었다.
  - 가정통신문 2차(새 지침서): **세 도구 모두 빈칸 0**(agy 93초, Codex 93초, Claude Code 220초). 한컴오피스로 열어 세 결과 모두 1쪽, 메모 내용 일치를 눈으로 확인했다.
  - pptx 스킬 설치 부탁: agy 28초, Codex 18초, Claude Code 28초.
  - 슬라이드 1차: 세 도구 모두 `parents-ai.pptx`를 만들었고 `validate.py`도 통과했다(agy 232초, Codex 176초, Claude Code 392초). LibreOffice를 설치하거나 실행하려 하지 않았다.
    - **Codex 파일만 PowerPoint가 열지 못했다**(0x80070570). 원인은 대각선을 `w`·`h` 음수로 그려 생긴 음수 크기(`cy="-155448"` 등)이고, `validate.py`는 이를 잡지 못한다.
    - 대책: `tools/pptx-check.py`(음수 크기 검사)를 넣고, 지침서에 "음수 금지, flipV/flipH, count 0 확인"을 넣었다.
    - agy·Claude 결과는 PowerPoint에서 정상으로 열렸다.
  - 슬라이드 2차(Codex, 새 지침서, 새 작업 폴더): 89초, `pptx-check` 0건, PowerPoint에서 5장 정상.
- 하지 않은 것 / 남은 것
  - 깨끗한 Windows(샌드박스·실제 교사 PC)에서 setup → 로그인 → 3교시까지 이어서 한 리허설. 이 PC에는 샌드박스가 없다.
  - 학교(교육용) Canva·Padlet 계정 시험, Codex·agy의 Canva 플러그인 경로(공식 문서 기준으로만 적음), ARM64·32비트 실기.
  - 시험에서 이 PC 전역 폴더에 설치한 두 스킬·`skills.json`·Python 3.14는 시험 뒤 원상 복구했다(24번).

### 24. 시험 뒤 원상 복구와 참고 사항

- 복구한 것
  - 이 PC 전역 폴더에 시험으로 설치한 `hwpx`·`pptx` 스킬(`~/.agents/skills`, `~/.claude/skills`)을 지웠다. 시험 전 목록과 같다.
  - `~/.agents/.skill-lock.json`은 시험 전에 백업한 파일로 되돌렸다(바이트 비교 일치). 시험 동안만 만든 `~/.gemini/config/skills.json`은 지웠다.
  - 시험 setup이 설치한 Python 3.14는 설치 프로그램 `/uninstall /quiet`로 지웠다. 남은 `HKCU\Software\Python\PythonCore\3.14` 키도 지웠다(남은 등록: 3.12). `C:\Users\JunghoonOh\alt` 시험 폴더를 지웠다.
  - 시험용 로컬 서버(8787)와 예전에 띄운 `next start`(3100, 지난 작업 때 남아 옛 빌드를 보여 주던 프로세스)를 끝냈다.
- 참고
  - 사용자 환경변수 `PYTHONUTF8=1`은 이미 있었다. `HKCU\Environment` 키의 마지막 변경 시각이 2026-10-20 15:20이라, 이번 시험이 바꾼 것이 아니다.
  - 이 PC의 `~/.codex/config.toml` 기본 모델(`gpt-5.6-sol`)과 `verify-missions.mjs` 기본값(`gpt-6-luna`)은 지금 ChatGPT 계정에서 거부된다. 이 PC의 Codex 0.154.0이 쓸 수 있는 모델은 `gpt-5.6-terra`·`gpt-5.6-luna`였다(`codex debug models`). 시험은 `-m gpt-5.6-terra`로 했다. 교사의 새 설치는 개인 설정 파일이 없어 해당 없음.
  - `Stop`한 백그라운드 작업이라도 Windows에서는 자식 `node` 프로세스가 남을 수 있다. 다음에 같은 포트를 쓸 때는 포트 점유 프로세스부터 확인할 것.

### 25. 짧은 주소 cli-lab.vercel.app

- 요청: 웹 주소(`llm-cli-teacher-lab.vercel.app`)가 길다. 사용자가 후보 중 `cli-lab`을 골랐다.
- 한 것
  - 비어 있는 후보를 `curl`로 찾았다(`DEPLOYMENT_NOT_FOUND`): cli-lab, clilab, aicli, ssam-ai, edu-cli.
  - Vercel 프로젝트 `llm-cli-teacher-lab`의 Settings → Domains → Add Existing으로 `cli-lab.vercel.app`을 Production에 연결했다(Valid Configuration).
    - Vercel CLI는 토큰 만료라 쓰지 못했다.
    - Vercel MCP는 같은 팀 ID로도 이 프로젝트를 찾지 못했다(404).
    - 그래서 로그인된 Chrome 대시보드에서 연결했다.
  - **예전 주소는 그대로 둔다.** 이미 나눠 준 setup.bat과 한 줄 설치 명령이 예전 주소로 `ai-lab.zip`을 받기 때문이다.
  - 사이트 주소를 짧은 주소로 바꿨다: `site.config.json`(준비 페이지의 한 줄 설치 명령·표지 주소), setup.bat의 `AL_SITE`, README, 샌드박스 설정.
  - 표지 QR(`public/images/site-qr.png`)을 `qrcode@1.5.4`로 같은 모양(180×180, 여백 0, 흑백)으로 다시 만들었다. `jsqr`로 해독해 `https://cli-lab.vercel.app`이 나오는 것을 확인했다.
- 확인: 짧은 주소에서 `/`, `/prepare`, `/setup.bat`, `/ai-lab.zip` 모두 200.
- 삽질: Git Bash의 `sed -i`가 setup.bat의 CRLF를 LF로 바꿨다(CR 586 → 0). `perl -pi -e 's/\r?\n/\r\n/'`로 되돌렸다. `.gitattributes`가 `*.bat eol=crlf`라 커밋에는 영향이 없지만, 작업본도 CRLF로 맞춰 둔다.

### 26. 실습마다 수업자료 버전(중3·고2) 추가

- 요청: 수업자료제작 실습 예시를 넣는다. 실습마다 업무·수업 중 고르게 하고, 수업 예시는 **중3·고2** 둘로 둔다. 과목은 골고루, 세 AI로 시험한 뒤 싣는다.
- 바꾼 것
  - 2교시: 업무(학급 안내)·수업 중3(수학 '이차방정식' 복습 퀴즈)·수업 고2(영어 문법 '관계대명사 what과 that' 퀴즈) 가운데 하나를 고른다. 퀴즈를 고치는 부탁 문장도 넣었다.
  - 3교시: 업무(가정통신문)·수업 중3(국어 '논증하는 글 — 주장과 근거' 활동지)·수업 고2(문학 '현대시의 비유와 상징' 활동지) 가운데 하나를 고른다.
    - 활동지 메모를 `worksheet-memo-m3.txt`·`worksheet-memo-h2.txt` 둘로 나눴다. 예전 정보 과목 메모는 지웠다.
    - 고2 메모에는 "실제 시인의 작품은 저작권이 있으니 새로 쓴 시를 쓴다"고 적었다.
    - 결과 파일은 `worksheet-m3-result.hwpx`·`worksheet-h2-result.hwpx`이다.
  - 선택 과제: 업무(학부모 설명회)·수업 중3(사회 '인권과 헌법' 도입)·수업 고2(정보 '데이터 시각화' 도입) 슬라이드 가운데 하나를 고른다.
  - 3교시 이름을 "가정통신문" → "한글 양식"으로 바꿨다(시간표·표지·홈·마무리 표).
  - `verify-missions.mjs`에 `m1quizM3`·`m1quizH2`·`m2xM3`·`m2xH2` 검사를 넣었다.
- 시험 (이 PC 로그인 계정, 시험용 가상환경 Python 3.12·시스템 Node·Git, 두 스킬을 잠시 전역 설치)
  - 1차(중1 수학 퀴즈·중2 국어 활동지·중1 사회 슬라이드, 세 AI)
    - 퀴즈·활동지는 세 AI 모두 됐다(활동지 빈칸 0).
    - 슬라이드는 agy·Claude만 됐다. Codex는 **사용 한도 초과**("try again at Nov 20th, 2026")로 멈췄다. 이번 연속 시험으로 이 계정의 Codex 한도를 다 썼다.
  - 2차(중3·고2 최종 문장, agy·Claude Code, 학년별 작업 폴더): **12번 모두 통과**.
    - 퀴즈: 외부 리소스 없음, 단원 낱말 있음.
    - 활동지: 빈칸 0.
    - 슬라이드: `validate.py` 통과, `pptx-check` 0건.
    - 걸린 시간: agy 55~258초, Claude Code 155~446초.
    - agy는 시험용 `test*.pptx`를 `slides`에 남겼다.
- pptx 스킬이 꼭 필요한가 (사용자 질문)
  - agy에서 pptx 스킬을 숨기고 같은 중3 슬라이드를 부탁했다. **스킬 없이도** pptxgenjs로 만들고 `validate.py`·`pptx-check` 모두 통과했다(187초, 스킬 사용 때 185초).
  - PowerPoint로 내보내 나란히 보니 배치와 완성도가 비슷했다.
  - 결론: 이 AI들은 pptx를 기본으로 만들 수 있다. 필요한 것은 파일 형식 스킬이 아니라 **디자인을 가르치는 스킬**이다(사용자 의견). 어떤 디자인 스킬로 바꿀지는 다음 항목에서 정한다.
  - Claude Code는 이 PC의 claude.ai 계정 동기화 pptx 스킬이 있어 "스킬 없이" 시험을 하지 못했다.
- 남은 정리: 시험 환경(`C:\Users\JunghoonOh\alt2`, 전역 `hwpx`·`pptx` 스킬, agy `skills.json`)은 디자인 스킬 시험 뒤에 함께 원상 복구한다.

### 27. 선택 과제: pptx 스킬 → 디자인 스킬(frontend-design)

- 결정 (사용자)
  - "모든 LLM이 pptx 제작을 기본으로 지원한다. 필요한 것은 슬라이드를 예쁘게 만드는 스킬이었다."
  - 26번의 비교(스킬 없이도 같은 품질의 pptx)를 보고 디자인 스킬 **frontend-design**(anthropics/skills, Apache-2.0)으로 바꿨다.
- 바꾼 것
  - 설치 부탁 문장 `install.design.<도구>`: `npx -y skills add anthropics/skills --skill frontend-design -g -a <도구> --copy -y`. pip 패키지는 필요 없다.
  - 슬라이드 부탁 문장: "frontend-design 스킬의 디자인 원칙을 적용해서 … PowerPoint 파일 …로 만들어 줘". validate·LibreOffice 문구는 뺐다.
  - 지침서(선택 과제)
    - pptxgenjs로 만들고 frontend-design 원칙을 적용한다.
    - 한 슬라이드에 제목과 핵심 3~4줄, 본문 20pt 이상·제목 32pt 이상.
    - 제목은 한 줄 16자 안팎, 넘침·겹침 금지, `fit: 'shrink'` 금지.
    - 시험 파일은 지운다. 음수 크기는 `pptx-check`로 검사한다(validate.py는 뺐다).
  - 사이트: 선택 과제 페이지(왜 디자인 스킬인지 설명, 설치 문장, PowerPoint가 못 열 때), 소개·마무리·홈·도움말·README의 pptx 스킬 언급을 바꿨다.
- 시험 (agy·Claude Code, 중3 '인권과 헌법')
  - 설치 부탁: agy 27초, Claude 32초. 두 전역 폴더가 Anthropic 원본과 같은 내용이 됐다.
  - 슬라이드: agy 364초, Claude 357초, 둘 다 `pptx-check` 0건.
  - PowerPoint로 나란히 보기(스킬 없음 agy / 디자인 스킬 agy / 디자인 스킬 Claude)
    - **Claude + 디자인 스킬이 가장 좋았다**: 큰 글자, 넉넉한 여백, '인권' 빨간 도장이라는 일관된 시각 요소.
    - **agy + 디자인 스킬은 색은 풍부해졌지만 글자가 넘치고 겹쳤다**(3·4번 슬라이드).
    - 그래서 지침서에 글자 수·크기·넘침 규칙을 넣고 agy를 다시 시험했다. 본문은 커지고 줄었지만 제목이 상자를 넘쳤다 → 제목 한 줄 규칙을 더했다.
    - 세 번째 시험(agy, 147초): 제목이 모두 한 줄에 들어가고 겹침이 없어졌다. Claude보다 수수하지만 교실 화면에서 읽기 좋다.
  - 이 PC의 사용자 `frontend-design`(예전 버전)이 시험 설치로 최신본으로 바뀌므로, 시험 전에 백업해 두고 시험 뒤 되돌린다.
  - Codex는 사용 한도 초과로 이번 시험에서 빠졌다.

### 28. 연수 사이트에 디자인 스킬 원칙 적용

- 요청: "이 웹페이지에도 디자인 스킬을 적용해 줘."
- 판단
  - 사이트의 기본 콘셉트("선생님이 표시한 수업 유인물": 흰 종이·파란 볼펜·노란 형광펜·빨간 확인 도장)는 주제에서 나온 것이다. 스킬이 꼽는 AI 기본값 팔레트(크림+테라코타, 검정+형광색)에도 해당하지 않아 **유지**했다.
  - 대신 스킬이 "AI가 만든 페이지 티"로 꼽는 습관을 찾아 고쳤다.
- 바꾼 것
  - **작은 라벨의 고정폭(mono) 글꼴 + 넓은 자간 + 대문자**를 본문 글꼴로 바꿨다(`--font-label: var(--font-body)`).
    - 해당: "AI에게 말하기", 시간표 "1교시", 접기 제목, 도구·화면 선택 라벨, 갤러리 정보, 흐름도 번호.
    - 한글이 대체 글꼴로 띄엄띄엄(`이번에  설치하는  스킬`) 보이던 문제가 없어졌다.
    - 쓰지 않게 된 Geist Mono 글꼴은 불러오지 않는다. 고정폭은 명령 상자에만 남겼다.
  - **가운뎃점으로 이은 정보 줄(`A · B · C`)**을 바꿨다.
    - 표지 상단 → "90분 교사 연수 실습", 도구는 쉼표로 이었다.
    - 강사 이력은 줄을 나눴다. 표지 그림 설명과 바닥글 링크는 간격으로 띄웠다.
    - 갤러리 정보는 쉼표로 이었다.
    - 한국어 문장 속 "중3·고2" 같은 가운뎃점은 맞춤법상 쓰임이라 그대로 뒀다.
  - **버튼 끝 화살표**(`들어가기 →`)를 뺐다. 표지의 "Enter 또는 → 키" 안내는 키 이름이라 그대로 뒀다.
- 하지 않은 것
  - 페이지마다 첫 화면의 약 1/3을 차지하는 사진(장식)은 그대로 뒀다. 예전에 크기를 맞춘 결정(15·16번)이 있어서다. 줄이거나 빼는 것은 사용자에게 제안만 한다.
- 확인: 타입 검사·빌드 통과, 로컬 화면에서 표지와 3교시 설치 단계를 캡처해 확인했다.

### 29. 자동 승인 명령 안내, 순서 정리, 슬라이드 제작을 정규 순서로

- `/install`에 "자동 승인으로 켜기" 절(`#auto`)과 비교표 한 줄을 넣었다. 세 명령은 `start-*.cmd`와 같다. 켜진 뒤 확인하는 표시는 11번 기록 그대로 옮겼다.
- 문서 작업 → 웹앱 제작 순서 바꾸기는 이미 반영되어 있었다(시간표·홈·다음 시간 링크). 남은 예전 번호("주소는 2교시 그대로")와 실습 폴더 `README.txt`·`_AGENTS.md`의 "미션 1·2"를 이름으로 바꾸고 절 순서도 맞췄다. 폴더 이름(`mission1`, `mission2`)은 검사 스크립트·배포된 zip과 맞추려고 그대로 둔다.
- 슬라이드를 선택 과제에서 **웹앱 제작 다음의 정규 순서**로 옮겼다. 시간표 7칸(`repeat(7, …)`), 새 아이콘 `slides`, 다음 시간 링크, 홈 진행 순서, 표지·사이트 설명, "선택 과제" 문구 전부.
- 남은 일: 90분 안에 일곱 순서가 들어가는지 시간 배분을 다시 볼 것. 슬라이드는 설치 1분 + 만들기 3~6분이다.

### 30. 학교급 선택(중학교·고등학교)과 고등학교 실습자료

- 요청: 중학교 교사용·고등학교 교사용 실습자료를 세 실습 모두에. 사용자가 "학교급 선택 + 업무도 분리", "agy·Claude로 시험"을 골랐다.
- 학교급 선택
  - `LevelPicker`(문서 작업·웹앱 제작·슬라이드 제작 페이지 위)와 `ForLevel`. 도구 선택과 같은 방식이다: `<html data-level>` + CSS로 숨김, localStorage `ai-lab-level`, `<head>`의 부트 스크립트로 깜박임 없음. 기본값은 중학교.
  - 학교급마다 업무 하나 + 수업 하나만 보인다.
- 새 고등학교 자료
  - 문서 작업: `notice-memo-h.txt`(1학년 전공 탐색 대학 탐방) + `notice-form-h.hwpx` → `notice-h-result.hwpx`
  - 웹앱 제작: `m1H` 고2 학급 안내(수행평가 일정표, 진로 상담 신청)
  - 슬라이드 제작: `slidesH` 1학년 학부모 설명회 '고교학점제와 2학년 과목 선택 안내' → `parents-credit.pptx`, 고치기 `slidesEditH`
- **양식 오류 수정**: 활동지 양식 머리글이 "가상중학교 · 2학년"으로 고정되어 중3·고2 메모 어느 쪽과도 맞지 않았다. 중학교 양식은 "가상중학교 · 3학년"으로 고치고, 고등학교용 `worksheet-form-h.hwpx`("가상고등학교 · 2학년")를 만들었다. `m2xH2`는 새 양식을 쓴다.
  - 고등학교 양식 두 개는 `create.js`(claw-hwp 원본 엔진)가 이 PC에 없어 **기존 양식의 `Contents/section0.xml`에서 `<hp:t>` 글자만 바꿔** 만들었다(ZIP 구조·mimetype 첫 항목·무압축 유지, `blanks.py` 9칸 확인). `docs/forms/*-h.create.json`과 `make-forms.mjs`도 같은 내용으로 맞춰, 나중에 엔진으로 다시 만들어도 같은 양식이 나온다.
- `verify-missions.mjs`: `formChecks`(양식 이름을 받아 원본 보존 확인), `slideChecks`(`pptx-check` count 0), 새 미션 `m1H`·`m2H`·`slidesH`·`slides`·`slidesM3`·`slidesH2`.
  - Claude Code가 이 PC(Windows)에서는 명령을 **PowerShell 도구**로 실행해 `Bash(python:*)` 허용이 적용되지 않았다(`python` 전부 거부 → 결과 없음). `PowerShell(<명령>:*)`도 허용하도록 고쳤고, 한 줄 시험으로 통하는 것을 확인했다. 교사는 자동 승인으로 켜므로 해당 없음.
- 시험 (이 PC 로그인 계정, 시험용 venv Python 3.14 + 두 스킬을 잠시 전역 설치)
  - agy: `m1H` 87초, `m2H` 68초, `m2xM3` 95초, `m2xH2` 61초, `slidesH` 125초, **모두 통과**.
  - Claude Code(권한 수정 뒤): `m1H` 189초, `m2H` 통과(다른 Claude 시험과 겹쳐 8분 제한에 걸렸으나 결과 파일은 검사 통과), `m2xM3` 207초, `m2xH2` 142초, `slidesH` 371초. **모두 통과**.
  - agy `notice-h-result.hwpx` 본문을 열어 날짜·시간·장소·회신서가 메모와 맞는 것을 확인했다.
  - 시험 뒤 원상 복구: 전역 `hwpx`·`frontend-design` 스킬(`~/.agents/skills`, `~/.claude/skills`)과 `~/.agents/.skill-lock.json`을 지웠다. 시험 전 상태(`.agents/skills` 비어 있음, `.claude/skills`는 `synced`만, lock 없음)와 같다. Python은 세션 임시 폴더의 venv만 썼다.
- 하지 않은 것: Codex는 사용 한도(11월 20일까지)로 시험하지 않았다. 고등학교 가정통신문 완성 예시(`samples`)는 만들지 않았다(중학교 예시만 있음).

### 31. 일반 설치 안내 페이지 `/setup-guide`

- 요청: setup.bat 말고 일반적인 설치 방법(Node.js·Python 등)을 도구별로 안내하는 별도 페이지.
- 내용: 실습 폴더 → Node.js(LTS .msi, 관리자 필요 / 압축 파일로 내 계정에 설치하는 방법) → Git(메모장 편집기만 바꾸기) → Python 3.14(Add python.exe to PATH 체크, py.exe 관리자 체크 해제, Install Now) → AI 도구 → 마무리 설정(`PYTHONUTF8`, `python3.exe` 복사, agy `skills.json` 등록) → 확인 명령 → winget(선택).
- 공식 문서로 확인한 것(2026-10-22): Node.js LTS v24.22.1(10-21 보안 릴리스, **10-28부터 v26이 LTS**), Python 3.14.9 기존 설치 파일은 3.15까지 제공되고 3.16부터 Python install manager로 바뀜(install manager 기본은 3.15), `skills` CLI는 Node 22.20 이상, Claude Code 공식 문서는 Git for Windows 권장.
- **문서와 실제가 다른 것**: skills 문서는 `-a antigravity-cli` 전역 폴더를 `~/.gemini/antigravity-cli/skills`라고 하지만, 오늘 이 PC에서 실제로는 `~/.agents/skills`에 설치됐다. setup.bat의 `skills.json` 등록 방식을 그대로 안내한다.
- 시험: 페이지의 Node.js 압축 파일 설치 한 줄, `python3` 복사, `skills.json` 등록(새 파일, 두 번 실행해도 중복 없음, 기존 항목 유지)을 임시 `LOCALAPPDATA`·`USERPROFILE`로 cmd에서 실행해 확인했다. winget과 설치 프로그램 화면은 시험하지 않았다(페이지에도 적음).
- `/install`의 "Node.js와 Git은 필요 없습니다"(스킬 도입 전 문구)를 고쳤다.
- 제안만 함: setup.bat의 Node.js `v24.22.0`을 보안 릴리스 `v24.22.1`로 올리는 것(SHA256 갱신 필요).

### 32. 수업·업무 프롬프트 모음 `/prompts`

- 요청: 별도 탭에 수업·업무용 TUI 프롬프트 모음을 학교급·교과·업무별로 최대한 많이. 중고등 교사의 페인포인트를 먼저 조사한 뒤.
- 페인포인트 조사(웹, 2025~2026 자료): 행정업무(교총 2026: 90.8%가 "업무의 40% 이상이 행정"), 중학교 교사 행정업무 주 6시간·OECD 2배와 스트레스 1위 학부모 민원(TALIS 2024), 세특 1인 150~200명, 2026 기재요령의 AI 규정(그대로 입력 금지, 교사 관찰 바탕 윤문·점검 보조만), 고교학점제 다과목 담당·최소 성취수준 보장지도, 중학교 생활지도·기초학력·자유학기. 출처는 페이지의 "어떤 어려움을 골랐나요"에 링크.
- 화면: 머리글에 "프롬프트 모음" 탭(막혔어요 옆). 학교급(학교급 선택 값을 처음 값으로 씀)·수업/업무·교과/업무 분야 칩, 검색, 개수 표시, 카드마다 어려움 한 줄·태그(학교급, 결과물, 필요한 스킬)·복사 버튼.
- 데이터: `content/prompt-library/*.json` 7개 파일, **390개**
  - 수업: 수업 공통 25, 중학교 교과 88(14교과), 고등학교 교과 88(14교과)
  - 업무: 공통(담임·학부모·상담·평가·생기부) 60, 행정·부서 62, 중학교 31, 고등학교 36
  - 작성 규칙(입출력 파일 이름, [대괄호] 4개 이하, 스스로 검토 문장, 성취기준 코드 지어내지 않기, 개인정보·저작권, 생기부는 "내 메모에 없는 사실은 만들지 마")을 하나의 지침으로 주고 작성 에이전트 5개가 나눠 썼다. 검토에서 실제 있을 법한 학교명 하나("푸른중학교")를 가상으로 바꾸고, AGENTS.md 프롬프트의 CLAUDE.md 안내를 실습 폴더 방식(`@AGENTS.md` 한 줄)으로 고쳤다.
  - `index.ts`가 빌드 때 검사한다: id 중복, level, 분야 이름, `.hwpx`→hwpx·`.pptx`→frontend-design 스킬 표시, 빈 칸.
- 확인: 빌드 통과, 로컬 `next start`에서 `/prompts` 카드 390개·분야 28개, 세 실습 페이지의 학교급 블록, `/setup-guide` 본문을 HTML로 확인. Chrome이 세 대 연결되어 있어 화면 캡처 확인은 하지 않았다.
- 하지 않은 것: 프롬프트 390개를 하나하나 AI로 실행해 보지는 않았다(무작위 표본만 읽어 검토). `/prompts` HTML이 792KB로 크다(전송 때는 압축됨).
- 배포: 이 PC의 작업 폴더에는 `.git`이 없었다. 공개 저장소를 받아 비교해 보니 손대지 않은 파일은 모두 `9ede21b`와 같아, 그 위에 커밋(`2957c32`)했다. 작업 폴더에 `.git`을 다시 넣었다. 이 PC에 GitHub 로그인이 없어 사용자가 cmd에서 `git push`로 로그인해 올렸다. 운영(`cli-lab.vercel.app`)에서 새 페이지, 학교급 블록, 시간표 7칸, 두 도메인의 zip(고등학교 파일 포함, 양식 SHA256이 작업본과 같음)을 확인했다.

### 33. setup.bat의 Node.js를 v24.22.1로

- 2026-10-21 보안 릴리스. x64·arm64 SHA256을 공식 `SHASUMS256.txt`에서 가져오고, 두 zip을 직접 받아 계산한 값과 대조했다(일치).
- 준비 페이지의 결과 화면 예시도 `v24.22.1`로 바꿨다.
- 시험: `public/setup.bat agy`를 `AI_LAB_DIR`(임시 폴더)·`AI_LAB_NO_ENV=1`로 실행 → Node.js `v24.22.1` 받기·SHA256 검사·실행 OK, "All done". 이미 `tools\node`가 있는 기존 실습 폴더는 다시 받지 않는다(예전 v24.22.0 그대로).
- 2026-10-28부터 v26이 LTS가 된다. 그때 다시 올릴지 정한다.

### 34. 고등학교 가정통신문 완성 예시

- 30번에서 남긴 일. `docs/forms/notice-sample-h.values.json`(직접 쓴 문장)으로 `notice-form-h.hwpx`를 채워 `practice-pack/samples/mission2/notice-sample-h.hwpx`를 만들었다. 중학교 예시와 같은 방법(hwpx 스킬 `fill_hwpx.py replace`)이다. 10곳 교체, `blanks.py` 0, 스킬 `validate.py` 통과.
  - 스킬은 전역에 다시 설치하지 않고 세션 임시 폴더에 `jkf87/hwpx-skill`(ba90fc5)을 받아 썼다.
- `make-forms.mjs`가 두 예시를 함께 만든다. `verify-missions.mjs`의 `m2H`에 "완성 예시 문장을 복사함" 검사를 넣었다(예시에만 있는 문장, 30번의 agy·Claude 결과에는 없음을 확인).
- 문서 작업 페이지 "막혔을 때"와 실습 폴더 README에 학교급별 예시를 적었다.
- v26은 2026-10-22 현재 Current이고 LTS는 10-28부터라 setup.bat은 v24.22.1에 둔다.
