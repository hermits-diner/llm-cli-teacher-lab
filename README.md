# LLM CLI 기반 수업자료제작 및 업무활용

중고등 교사(초보)를 위한 90분 실습 사이트입니다. 교사가 이 사이트를 순서대로 따라 하면 결과물 두 가지를 얻습니다. 하나는 Netlify에 올린 웹페이지이고, 다른 하나는 메모로 채운 가정통신문(.hwpx)입니다.

- 사이트: https://llm-cli-teacher-lab.vercel.app
- 도구: Antigravity CLI(`agy`), Codex CLI, Claude Code. 교사마다 하나를 고릅니다.
- 설치는 cmd에서만 합니다. 한 줄 명령을 쓰거나 `setup.bat` 파일을 받아 실행합니다.
- 작업 기록과 결정 이유: [WORKLOG.md](WORKLOG.md)

## 폴더 구조

| 경로 | 내용 |
| --- | --- |
| `app/` | 사이트 페이지. 본문은 `page.mdx` 파일이라 바로 고칠 수 있습니다 |
| `content/prompts.json` | 사이트에 보이는 프롬프트입니다. 검증 스크립트도 이 문장을 그대로 씁니다 |
| `practice-pack/` | 교사 PC의 바탕화면 `ai-lab` 폴더에 풀리는 실습 폴더의 원본 |
| `downloads-src/setup.bat` | 자동 설치 프로그램 원본(ASCII만 사용) |
| `docs/forms/` | 실습 양식(.hwpx)을 만드는 정의 파일 |
| `scripts/` | 다운로드 파일 생성, 양식 생성, 미션 검증, DB 초기화 |
| `site.config.json` | 사이트 주소, 검증 날짜, 도구 버전 |

`practice-pack` 안의 `_AGENTS.md`, `_CLAUDE.md`, `_agents/`는 zip을 만들 때 각각 `AGENTS.md`, `CLAUDE.md`, `.agents/` 및 `.claude/`로 이름이 바뀝니다. 이 저장소를 개발하는 AI가 실습용 지침을 읽지 않게 하려고 이렇게 나눠 두었습니다.

## 로컬에서 실행하기

```powershell
npm install
npm run dev        # practice-pack을 zip으로 묶은 뒤 http://localhost:3000 실행
npm run build      # 배포용 빌드. bat 파일이 ASCII·CRLF·사이트 주소 조건을 어기면 빌드가 실패합니다
```

## 연수 전 강사 점검표

- [ ] **연수 48시간 전에 미션을 다시 검증합니다.** 세 도구는 자주, 그리고 스스로 업데이트됩니다.
  ```powershell
  npm run verify:missions          # 세 CLI × 미션 3개를 실제로 실행합니다. 각 계정의 사용량이 소모됩니다
  ```
  결과를 확인한 뒤 `site.config.json`의 `verifiedOn`과 `versions`를 고치고 푸시합니다.
- [ ] 깨끗한 Windows에서 설치를 시험합니다. Windows Sandbox를 켠 뒤 `docs/sandbox-test.wsb`를 더블클릭하고, 열린 cmd 창에 준비 페이지의 한 줄 명령을 붙여넣습니다.
  - Windows Sandbox를 켜려면 관리자 PowerShell에서 아래 명령을 실행하고 재부팅합니다.
    `Enable-WindowsOptionalFeature -Online -FeatureName Containers-DisposableClientVM -All`
- [ ] 갤러리 설정(아래)을 확인합니다. 시험용 글은 숨김 처리합니다.
- [ ] 참가자에게 준비 페이지 주소를 미리 보내고 사전 설치를 안내합니다.

## 결과물 갤러리 (Neon Postgres)

Vercel 프로젝트의 환경변수로 동작을 조절합니다. 환경변수를 바꾼 뒤에는 다시 배포해야 반영됩니다.

| 변수 | 역할 |
| --- | --- |
| `DATABASE_URL` | Neon 통합이 자동으로 넣습니다 |
| `GALLERY_ADMIN_KEY` | 강사용 숨김 키입니다. `/gallery?admin=1`에서 이 키를 입력하면 글마다 숨기기 버튼이 생깁니다 |
| `GALLERY_CODE` | (선택) 당일 참여 코드입니다. 값을 넣으면 등록할 때 이 코드를 입력해야 합니다 |
| `GALLERY_OPEN` | `false`로 두면 등록을 막고 목록만 보여 줍니다 |
| `NEXT_PUBLIC_GALLERY_BACKUP_URL` | (선택) DB에 문제가 생겼을 때 안내할 예비 게시판(Padlet 등) 주소 |

테이블은 처음 한 번만 만듭니다.

```powershell
vercel env pull .env.local --yes
npm run db:init
```

## 실습 양식 다시 만들기

양식 정의(`docs/forms/*.create.json`)를 고친 뒤 실행합니다. 새 문서를 만드는 데 필요한 rhwp WASM은 저장소에 넣지 않았으므로, claw-hwp 원본(커밋 `05cf0cb`)을 받아 그 경로를 지정합니다.

```powershell
git clone https://github.com/DoHyun468/claw-hwp ..\claw-hwp
$env:CLAW_HWP_SCRIPTS = "..\claw-hwp\plugins\claw-hwp\skills\hwp\scripts"
node scripts/make-forms.mjs
```

## 라이선스와 출처

- 실습 폴더의 HWPX 편집 엔진은 [claw-hwp](https://github.com/DoHyun468/claw-hwp)(MIT)의 일부입니다. 자세한 내용은 `practice-pack/tools/claw-hwp/NOTICE.md`에 있습니다.
- 페이지 사진 6장은 [Unsplash](https://unsplash.com) 무료 라이선스 사진입니다. 작가와 원본 링크는 `components/PagePhoto.tsx`와 각 사진 아래에 있습니다.
- 실습 자료의 학교·행사·인물은 모두 가상입니다.
