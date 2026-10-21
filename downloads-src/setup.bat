@echo off
setlocal EnableExtensions DisableDelayedExpansion
title AI Lab setup
rem ==================================================================
rem  AI Lab setup - AI agent coding for teachers (LLM CLI)
rem  https://cli-lab.vercel.app
rem
rem  Keep this file ASCII-only: cmd.exe reads batch files in the OEM
rem  code page, so Korean text breaks the parser. Line endings are
rem  normalized to CRLF by scripts/make-downloads.mjs.
rem  Paths are never used inside ( ) blocks: a ")" in a user name
rem  would end the block early.
rem ==================================================================

set "AL_SITE=https://cli-lab.vercel.app"
set "AL_LAB="
set "AL_SELF=%~f0"
rem test-only overrides (local server / throwaway folder). AI_LAB_NO_ENV=1
rem leaves the user PATH and environment variables untouched.
if defined AI_LAB_SITE set "AL_SITE=%AI_LAB_SITE%"
if defined AI_LAB_DIR set "AL_LAB=%AI_LAB_DIR%"
rem the practice folder is "ai-lab" on the desktop
if not defined AL_LAB call :find_desktop
set "AL_TMP=%AL_LAB%\_setup"
set "AL_LOG=%AL_LAB%\setup.log"
set "AL_NODE_VER=v24.22.0"
set "AL_CURL=%SystemRoot%\System32\curl.exe"
set "AL_TAR=%SystemRoot%\System32\tar.exe"
set "AL_PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

set "AL_NODE_ARCH=x64"
set "AL_NODE_SHA=f9683a19877e12a9b167305c8db71040d812876359de21f0d2e97c3f321f80c3"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "AL_NODE_ARCH=arm64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "AL_NODE_SHA=3a5c209a5bc59e65b3bc0fa13ed5e166a26bd3d55332847f498b76b037408d61"
rem Python: official installer, per-user (no admin). Skills run Python.
set "AL_PY_VER=3.14.9"
set "AL_PY_DIR=%LOCALAPPDATA%\Programs\Python\Python314"
set "AL_PY_ARCH=amd64"
set "AL_PY_SHA=a247a0b612244a803f507b39fb7121e3602e4160d59c3b99d98e735289c53394"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "AL_PY_ARCH=arm64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "AL_PY_SHA=4508e6a54c69566b8faec461d84d85eebee65c39a15eb910bc2ad873d09b022b"
rem Git: portable MinGit. "npx skills add" clones skills with git.
set "AL_GIT_VER=2.56.0.2"
set "AL_GIT_TAG=v2.56.0.windows.2"
set "AL_GIT_ARCH=64-bit"
set "AL_GIT_SHA=da35e72aa21c005a5a0d298cfbae110bc1609a815730ea0dde84b01a1b3cd3be"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "AL_GIT_ARCH=arm64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "AL_GIT_SHA=38b33dc6024026e3315cf88ab2cfea65205bbd7bb3a8e824bd21c8ad4fe609a7"
rem Node.js 23 and later have no 32-bit Windows build. PROCESSOR_ARCHITEW6432
rem is set when a 32-bit cmd runs on 64-bit Windows, where x64 Node.js works.
if /i "%PROCESSOR_ARCHITECTURE%"=="x86" if not defined PROCESSOR_ARCHITEW6432 set "AL_NODE_ARCH=x86"

set "AL_R_BASE=-"
set "AL_R_NET=-"
set "AL_R_PACK=-"
set "AL_R_NODE=-"
set "AL_R_PY=-"
set "AL_R_GIT=-"
set "AL_R_TOOL=-"
set "AL_PATH_WARN="
set "AL_PFRONT="
set "AL_R_PATH=-"
set "AL_ERR="
set "AL_TOOL="
set "AL_TOOL_NAME=AI tool"

rem Optional argument skips the menu: setup.bat 1|2|3|4  or  claude|codex|agy|check
set "AL_SEL="
set "AL_ARG=%~1"
if not defined AL_ARG goto :menu
if "%AL_ARG%"=="1" set "AL_SEL=1"
if "%AL_ARG%"=="2" set "AL_SEL=2"
if "%AL_ARG%"=="3" set "AL_SEL=3"
if "%AL_ARG%"=="4" set "AL_SEL=4"
if /i "%AL_ARG%"=="claude" set "AL_SEL=1"
if /i "%AL_ARG%"=="codex" set "AL_SEL=2"
if /i "%AL_ARG%"=="agy" set "AL_SEL=3"
if /i "%AL_ARG%"=="check" set "AL_SEL=4"
goto :selected

rem ------------------------------------------------------------------
:menu
cls
echo.
echo  ======================================================
echo    AI Lab setup  -  AI agent coding for teachers (LLM CLI)
echo  ======================================================
echo.
echo    Which AI tool will you use?
echo.
echo     1   Claude Code        (needs Claude Pro or higher)
echo     2   Codex CLI          (needs a ChatGPT plan)
echo     3   Antigravity CLI    (personal Gmail, free tier)
echo     4   Check this PC only (installs nothing)
echo     0   Exit
echo.
choice /c 12340 /n /m "  Press 1, 2, 3, 4 or 0: "
set "AL_SEL=%errorlevel%"

:selected
if "%AL_SEL%"=="1" set "AL_TOOL=claude"
if "%AL_SEL%"=="1" set "AL_TOOL_NAME=Claude Code"
if "%AL_SEL%"=="2" set "AL_TOOL=codex"
if "%AL_SEL%"=="2" set "AL_TOOL_NAME=Codex CLI"
if "%AL_SEL%"=="3" set "AL_TOOL=agy"
if "%AL_SEL%"=="3" set "AL_TOOL_NAME=Antigravity CLI"
if "%AL_SEL%"=="4" set "AL_TOOL=check"
if not defined AL_TOOL goto :bye

rem ------------------------------------------------------------------
echo.
echo  [1/7] Checking this PC ...
call :check_base
if errorlevel 1 goto :summary

echo.
echo  [2/7] Checking internet access ...
call :check_net
if "%AL_TOOL%"=="check" goto :summary
if "%AL_ERR%"=="E07" goto :summary

echo.
echo  [3/7] Downloading the practice folder to %AL_LAB% ...
call :install_pack
if errorlevel 1 goto :summary

rem Node.js, Python and Git failures do not stop the install: the AI tool
rem needs none of them, only the skills (period 3, slide task) do, so the
rem first sessions can go ahead.
echo.
echo  [4/7] Preparing Node.js %AL_NODE_VER% (portable, no admin needed) ...
call :install_node

echo.
echo  [5/7] Installing Python %AL_PY_VER% for this user (no admin needed) ...
call :install_python

echo.
echo  [6/7] Preparing Git %AL_GIT_VER% (portable, used to install skills) ...
call :install_git

echo.
echo  [7/7] Installing %AL_TOOL_NAME% ...
echo        (the official installer prints its own messages below)
echo.
call :install_tool
if "%AL_TOOL%"=="agy" call :agy_skills
goto :summary

rem ------------------------------------------------------------------
:find_desktop
rem OneDrive or a school policy may move the desktop, so read its real place
rem from the registry. The value usually starts with the USERPROFILE
rem variable, which "call set" expands.
set "AL_DESK="
for /f "tokens=2,*" %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" /v Desktop 2^>nul ^| findstr /i "REG_"') do set "AL_DESK=%%b"
if defined AL_DESK call set "AL_DESK=%AL_DESK%"
if not defined AL_DESK set "AL_DESK=%USERPROFILE%\Desktop"
if not exist "%AL_DESK%\" set "AL_DESK=%USERPROFILE%\Desktop"
set "AL_LAB=%AL_DESK%\ai-lab"
exit /b 0

rem ------------------------------------------------------------------
:check_base
if not exist "%AL_CURL%" goto :base_old
if not exist "%AL_TAR%" goto :base_old
if not exist "%AL_TMP%\" mkdir "%AL_TMP%" 2>nul
if not exist "%AL_TMP%\" goto :base_nowrite
(echo test)>"%AL_TMP%\write.test" 2>nul
if not exist "%AL_TMP%\write.test" goto :base_nowrite
del "%AL_TMP%\write.test" >nul 2>&1
call :log "start tool=%AL_TOOL% arch=%PROCESSOR_ARCHITECTURE%"
set "AL_R_BASE=OK"
echo        [ OK ] curl, tar, folder %AL_LAB%
if "%AL_NODE_ARCH%"=="x86" set "AL_R_BASE=WARN (32-bit Windows, no Node.js)"
if "%AL_NODE_ARCH%"=="x86" echo        [WARN] 32-bit Windows. Node.js, Python and Git are skipped; skills need them.
exit /b 0
:base_old
set "AL_R_BASE=FAIL"
set "AL_ERR=E01"
echo        [FAIL] curl or tar not found. Windows 10 (1803) or newer is needed.
exit /b 1
:base_nowrite
set "AL_R_BASE=FAIL"
set "AL_ERR=E02"
echo        [FAIL] Cannot create %AL_LAB%. This PC may block writing to the desktop.
exit /b 1

rem ------------------------------------------------------------------
:check_net
set "AL_NET_FAIL="
call :net "%AL_SITE%"
call :net "https://nodejs.org"
if "%AL_TOOL%"=="claude" call :net "https://claude.ai"
if "%AL_TOOL%"=="claude" call :net "https://downloads.claude.ai"
if "%AL_TOOL%"=="codex" call :net "https://chatgpt.com"
if "%AL_TOOL%"=="codex" call :net "https://releases.openai.com"
if "%AL_TOOL%"=="agy" call :net "https://antigravity.google"
if "%AL_TOOL%"=="check" call :net "https://claude.ai"
if "%AL_TOOL%"=="check" call :net "https://downloads.claude.ai"
if "%AL_TOOL%"=="check" call :net "https://chatgpt.com"
if "%AL_TOOL%"=="check" call :net "https://releases.openai.com"
if "%AL_TOOL%"=="check" call :net "https://antigravity.google"
call :net "https://vercel.com"
rem period 3: skills come from GitHub, their parts from PyPI and npm
call :net "https://github.com"
call :net "https://www.python.org"
call :net "https://pypi.org"
call :net "https://registry.npmjs.org"
if "%AL_TOOL%"=="codex" call :check_ps
if "%AL_TOOL%"=="check" call :check_ps
if defined AL_NET_FAIL goto :net_bad
set "AL_R_NET=OK"
exit /b 0
:net_bad
rem During install a failed check is only a warning (some sites refuse HEAD
rem requests); the install step itself reports the real error.
set "AL_R_NET=WARN (see [FAIL] lines above)"
if "%AL_TOOL%"=="check" set "AL_R_NET=FAIL"
if "%AL_TOOL%"=="check" if not defined AL_ERR set "AL_ERR=E03"
exit /b 1

:net
set "AL_CODE=000"
for /f %%c in ('%AL_CURL% -s -o NUL -I --max-time 15 -w "%%{http_code}" %~1') do set "AL_CODE=%%c"
if "%AL_CODE%"=="000" goto :net_fail
echo        [ OK ] %~1
call :log "net ok %~1 %AL_CODE%"
exit /b 0
:net_fail
echo        [FAIL] %~1  (blocked or offline)
call :log "net FAIL %~1"
set "AL_NET_FAIL=1"
exit /b 1

:check_ps
if not exist "%AL_PS%" goto :ps_bad
"%AL_PS%" -NoProfile -ExecutionPolicy Bypass -Command "exit 7" >nul 2>&1
if not "%errorlevel%"=="7" goto :ps_bad
echo        [ OK ] PowerShell can run (needed by the Codex installer)
exit /b 0
:ps_bad
echo        [FAIL] PowerShell is blocked on this PC (needed by the Codex installer)
call :log "powershell blocked"
set "AL_NET_FAIL=1"
set "AL_ERR=E07"
exit /b 1

rem ------------------------------------------------------------------
:install_pack
"%AL_CURL%" -fL --progress-bar --retry 3 --retry-delay 2 -o "%AL_TMP%\ai-lab.zip" "%AL_SITE%/ai-lab.zip"
if errorlevel 1 goto :pack_bad
"%AL_TAR%" -tf "%AL_TMP%\ai-lab.zip" >nul 2>&1
if errorlevel 1 goto :pack_bad
rem -k keeps files that already exist, so earlier work is never overwritten
"%AL_TAR%" -xkf "%AL_TMP%\ai-lab.zip" -C "%AL_LAB%"
if not exist "%AL_LAB%\AGENTS.md" goto :pack_bad
rem keep a copy here so "run setup.bat again" works (fails quietly when this
rem already is that copy)
copy /y "%AL_SELF%" "%AL_LAB%\setup.bat" >nul 2>&1
set "AL_R_PACK=OK"
echo        [ OK ] %AL_LAB%
call :log "pack ok"
exit /b 0
:pack_bad
set "AL_R_PACK=FAIL"
set "AL_ERR=E06"
echo        [FAIL] Could not download or unpack ai-lab.zip
call :log "pack FAIL"
exit /b 1

rem ------------------------------------------------------------------
:install_node
set "AL_NODE_DIR=%AL_LAB%\tools\node"
set "AL_NODE_NAME=node-%AL_NODE_VER%-win-%AL_NODE_ARCH%"
if "%AL_NODE_ARCH%"=="x86" goto :node_x86
if exist "%AL_NODE_DIR%\node.exe" goto :node_ok
"%AL_CURL%" -fL --progress-bar --retry 3 --retry-delay 2 -o "%AL_TMP%\%AL_NODE_NAME%.zip" "https://nodejs.org/dist/%AL_NODE_VER%/%AL_NODE_NAME%.zip"
if errorlevel 1 goto :node_bad
certutil -hashfile "%AL_TMP%\%AL_NODE_NAME%.zip" SHA256 | findstr /i /x "%AL_NODE_SHA%" >nul
if errorlevel 1 goto :node_badsum
"%AL_TAR%" -xf "%AL_TMP%\%AL_NODE_NAME%.zip" -C "%AL_TMP%"
if errorlevel 1 goto :node_bad
if not exist "%AL_LAB%\tools\" mkdir "%AL_LAB%\tools"
move "%AL_TMP%\%AL_NODE_NAME%" "%AL_NODE_DIR%" >nul
if not exist "%AL_NODE_DIR%\node.exe" goto :node_bad
del "%AL_TMP%\%AL_NODE_NAME%.zip" >nul 2>&1
:node_ok
rem via a file, not for /f: the desktop path may hold spaces or ")"
set "AL_NODE_V="
"%AL_NODE_DIR%\node.exe" -v >"%AL_TMP%\node-version.txt" 2>nul
set /p AL_NODE_V=<"%AL_TMP%\node-version.txt"
rem the file can be there while a security program blocks running it
if not defined AL_NODE_V goto :node_norun
if not "%AL_NODE_V:~0,1%"=="v" goto :node_norun
set "AL_R_NODE=OK %AL_NODE_V%"
echo        [ OK ] Node.js %AL_NODE_V%
call :log "node ok %AL_NODE_V%"
set "AL_PDIR=%AL_NODE_DIR%"
call :path_put
exit /b 0
:node_x86
echo        [FAIL] 32-bit Windows. Node.js 24 has no 32-bit version.
goto :node_bad
:node_norun
echo        [FAIL] node.exe is there but does not run (blocked by a security program?)
goto :node_bad
:node_badsum
echo        [FAIL] Downloaded Node.js file is damaged (checksum mismatch)
:node_bad
set "AL_R_NODE=FAIL"
set "AL_ERR=E04"
echo        [FAIL] Could not prepare Node.js
call :log "node FAIL"
exit /b 1

rem ------------------------------------------------------------------
:install_python
set "AL_PY_NAME=python-%AL_PY_VER%-%AL_PY_ARCH%.exe"
if "%AL_NODE_ARCH%"=="x86" goto :py_x86
if exist "%AL_PY_DIR%\python.exe" goto :py_ok
"%AL_CURL%" -fL --progress-bar --retry 3 --retry-delay 2 -o "%AL_TMP%\%AL_PY_NAME%" "https://www.python.org/ftp/python/%AL_PY_VER%/%AL_PY_NAME%"
if errorlevel 1 goto :py_bad
certutil -hashfile "%AL_TMP%\%AL_PY_NAME%" SHA256 | findstr /i /x "%AL_PY_SHA%" >nul
if errorlevel 1 goto :py_badsum
rem Per-user and quiet: no admin rights, no UAC prompt. start /wait because
rem the installer is a windowed program that cmd would not wait for.
start "" /wait "%AL_TMP%\%AL_PY_NAME%" /quiet InstallAllUsers=0 PrependPath=0 Include_launcher=0 Include_test=0 Include_doc=0 Include_tcltk=0 Shortcuts=0 AssociateFiles=0 TargetDir="%AL_PY_DIR%"
if not exist "%AL_PY_DIR%\python.exe" goto :py_bad
del "%AL_TMP%\%AL_PY_NAME%" >nul 2>&1
:py_ok
rem Skills and AIs often type "python3". On Windows that name opens the
rem Microsoft Store unless a real python3.exe comes first in PATH.
if not exist "%AL_PY_DIR%\python3.exe" copy /y "%AL_PY_DIR%\python.exe" "%AL_PY_DIR%\python3.exe" >nul
set "AL_PY_V="
"%AL_PY_DIR%\python3.exe" -V >"%AL_TMP%\python-version.txt" 2>nul
set /p AL_PY_V=<"%AL_TMP%\python-version.txt"
if not defined AL_PY_V goto :py_norun
if not "%AL_PY_V:~0,7%"=="Python " goto :py_norun
set "AL_R_PY=OK %AL_PY_V:~7%"
echo        [ OK ] %AL_PY_V%
call :log "python ok %AL_PY_V%"
rem in front of the PATH: the Store shortcuts sit early in the user PATH
set "AL_PFRONT=1"
set "AL_PDIR=%AL_PY_DIR%\Scripts"
call :path_put
set "AL_PDIR=%AL_PY_DIR%"
call :path_put
set "AL_PFRONT="
rem UTF-8 console output; in the Korean code page Python fails on symbols
if not defined AI_LAB_NO_ENV "%AL_PS%" -NoProfile -ExecutionPolicy Bypass -Command "[Environment]::SetEnvironmentVariable('PYTHONUTF8','1','User')" >nul 2>&1
exit /b 0
:py_x86
echo        [FAIL] 32-bit Windows is not supported here.
goto :py_bad
:py_norun
echo        [FAIL] python.exe is there but does not run (blocked by a security program?)
goto :py_bad
:py_badsum
echo        [FAIL] Downloaded Python file is damaged (checksum mismatch)
:py_bad
set "AL_R_PY=FAIL"
if not defined AL_ERR set "AL_ERR=E08"
echo        [FAIL] Could not prepare Python
call :log "python FAIL"
exit /b 1

rem ------------------------------------------------------------------
:install_git
set "AL_GIT_DIR=%AL_LAB%\tools\git"
set "AL_GIT_NAME=MinGit-%AL_GIT_VER%-%AL_GIT_ARCH%"
if "%AL_NODE_ARCH%"=="x86" goto :git_x86
if exist "%AL_GIT_DIR%\cmd\git.exe" goto :git_ok
"%AL_CURL%" -fL --progress-bar --retry 3 --retry-delay 2 -o "%AL_TMP%\%AL_GIT_NAME%.zip" "https://github.com/git-for-windows/git/releases/download/%AL_GIT_TAG%/%AL_GIT_NAME%.zip"
if errorlevel 1 goto :git_bad
certutil -hashfile "%AL_TMP%\%AL_GIT_NAME%.zip" SHA256 | findstr /i /x "%AL_GIT_SHA%" >nul
if errorlevel 1 goto :git_badsum
if not exist "%AL_GIT_DIR%\" mkdir "%AL_GIT_DIR%"
"%AL_TAR%" -xf "%AL_TMP%\%AL_GIT_NAME%.zip" -C "%AL_GIT_DIR%"
if errorlevel 1 goto :git_bad
del "%AL_TMP%\%AL_GIT_NAME%.zip" >nul 2>&1
:git_ok
set "AL_GIT_V="
"%AL_GIT_DIR%\cmd\git.exe" --version >"%AL_TMP%\git-version.txt" 2>nul
set /p AL_GIT_V=<"%AL_TMP%\git-version.txt"
if not defined AL_GIT_V goto :git_norun
if not "%AL_GIT_V:~0,12%"=="git version " goto :git_norun
set "AL_R_GIT=OK %AL_GIT_V:~12%"
echo        [ OK ] Git %AL_GIT_V:~12%
call :log "git ok %AL_GIT_V%"
set "AL_PDIR=%AL_GIT_DIR%\cmd"
call :path_put
exit /b 0
:git_x86
echo        [FAIL] 32-bit Windows is not supported here.
goto :git_bad
:git_norun
echo        [FAIL] git.exe is there but does not run (blocked by a security program?)
goto :git_bad
:git_badsum
echo        [FAIL] Downloaded Git file is damaged (checksum mismatch)
:git_bad
set "AL_R_GIT=FAIL"
if not defined AL_ERR set "AL_ERR=E09"
echo        [FAIL] Could not prepare Git
call :log "git FAIL"
exit /b 1

rem ------------------------------------------------------------------
:install_tool
if "%AL_TOOL%"=="claude" goto :tool_claude
if "%AL_TOOL%"=="codex" goto :tool_codex
if "%AL_TOOL%"=="agy" goto :tool_agy
exit /b 1

:tool_claude
set "AL_EXE=%USERPROFILE%\.local\bin\claude.exe"
set "AL_BIN=%USERPROFILE%\.local\bin"
"%AL_CURL%" -fsSL https://claude.ai/install.cmd -o "%AL_TMP%\claude-install.cmd"
if errorlevel 1 goto :tool_check
call "%AL_TMP%\claude-install.cmd" stable
goto :tool_check

:tool_codex
set "AL_EXE=%LOCALAPPDATA%\Programs\OpenAI\Codex\bin\codex.exe"
set "AL_BIN=%LOCALAPPDATA%\Programs\OpenAI\Codex\bin"
rem skips the installer's "Start Codex now? [y/N]" question
set "CODEX_NON_INTERACTIVE=1"
"%AL_PS%" -NoProfile -ExecutionPolicy Bypass -Command "irm https://chatgpt.com/codex/install.ps1 | iex"
goto :tool_check

:tool_agy
set "AL_EXE=%LOCALAPPDATA%\agy\bin\agy.exe"
set "AL_BIN=%LOCALAPPDATA%\agy\bin"
rem the agy installer exits early (code 0) when agy is already installed
"%AL_CURL%" -fsSL https://antigravity.google/cli/install.cmd -o "%AL_TMP%\agy-install.cmd"
if errorlevel 1 goto :tool_check
call "%AL_TMP%\agy-install.cmd"
goto :tool_check

:tool_check
cd /d "%AL_LAB%"
rem installer exit codes are not trusted; the program itself must exist and run
if not exist "%AL_EXE%" goto :tool_bad
"%AL_EXE%" --version >"%AL_TMP%\version.txt" 2>&1
if errorlevel 1 goto :tool_bad
set "AL_TOOL_V="
set /p AL_TOOL_V=<"%AL_TMP%\version.txt"
set "AL_R_TOOL=OK %AL_TOOL_V%"
echo.
echo        [ OK ] %AL_TOOL_NAME% %AL_TOOL_V%
call :log "tool ok %AL_TOOL% %AL_TOOL_V%"
call :add_path
exit /b 0
:tool_bad
set "AL_R_TOOL=FAIL"
set "AL_ERR=E05"
echo.
echo        [FAIL] %AL_TOOL_NAME% was not installed
call :log "tool FAIL %AL_TOOL%"
exit /b 1

rem ------------------------------------------------------------------
:add_path
rem Puts the tool's folder in the user PATH so it runs from any folder.
rem Optional: a failure is only a warning; start-*.cmd still works.
set "AL_PDIR=%AL_BIN%"
call :path_put
if "%AL_RC%"=="0" set "AL_R_PATH=OK (added)"
if "%AL_RC%"=="3" set "AL_R_PATH=OK"
if "%AL_R_PATH%"=="-" goto :path_bad
echo        [ OK ] %AL_TOOL% runs from any folder (in a NEW cmd window)
call :log "path ok rc=%AL_RC%"
rem Node.js, Python or Git could not be added earlier
if defined AL_PATH_WARN set "AL_R_PATH=WARN (use start-%AL_TOOL%.cmd)"
exit /b 0
:path_bad
set "AL_R_PATH=WARN (use start-%AL_TOOL%.cmd)"
echo        [WARN] Could not add %AL_TOOL% to PATH. start-%AL_TOOL%.cmd still works.
call :log "path FAIL"
exit /b 0

:path_put
rem Adds the folder in AL_PDIR to the user PATH; AL_PFRONT=1 puts it first.
rem Sets AL_RC: 0 added, 3 already in the user or machine PATH, 1 failed.
rem Not setx: it cuts PATH at 1024 characters. PowerShell keeps the other
rem entries and the value type as they are. Setting and clearing AI_LAB_TMP
rem makes Windows reload the environment for new windows. The folder is
rem read from the AL_PDIR variable inside PowerShell.
set "AL_RC=1"
if defined AI_LAB_NO_ENV set "AL_RC=3"
if defined AI_LAB_NO_ENV exit /b 0
if not exist "%AL_PS%" goto :put_bad
"%AL_PS%" -NoProfile -ExecutionPolicy Bypass -Command "try { $ErrorActionPreference='Stop'; $b=$env:AL_PDIR.TrimEnd('\'); $k=[Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Environment'); $o=[string]$k.GetValue('Path','',[Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames); $t=[Microsoft.Win32.RegistryValueKind]::ExpandString; if ($o) { $t=$k.GetValueKind('Path') }; $p=@($o -split ';' | Where-Object { $_ }); $m=@(([string][Environment]::GetEnvironmentVariable('Path','Machine')) -split ';' | Where-Object { $_ }); foreach ($e in ($p + $m)) { if ([Environment]::ExpandEnvironmentVariables($e).TrimEnd('\') -ieq $b) { exit 3 } }; if ($env:AL_PFRONT) { $n=@($b) + $p } else { $n=$p + $b }; $k.SetValue('Path', ($n -join ';'), $t); [Environment]::SetEnvironmentVariable('AI_LAB_TMP','1','User'); [Environment]::SetEnvironmentVariable('AI_LAB_TMP',$null,'User'); exit 0 } catch { exit 1 }" >nul 2>&1
set "AL_RC=%errorlevel%"
if "%AL_RC%"=="0" exit /b 0
if "%AL_RC%"=="3" exit /b 0
:put_bad
set "AL_RC=1"
set "AL_PATH_WARN=1"
echo        [WARN] Could not add %AL_PDIR% to PATH
call :log "path FAIL %AL_PDIR%"
exit /b 0

rem ------------------------------------------------------------------
:agy_skills
rem Antigravity CLI reads global skills only from ~\.gemini\config\skills,
rem but "npx skills add -g -a antigravity-cli" installs to ~\.agents\skills
rem (shared with Codex). Register that folder in agy's skills.json once,
rem keeping any entries already there. Absolute path with "/": agy ignores "~".
if not exist "%AL_PS%" goto :agy_skills_bad
"%AL_PS%" -NoProfile -ExecutionPolicy Bypass -Command "try { $ErrorActionPreference='Stop'; $h=$env:USERPROFILE; $s=Join-Path $h '.agents\skills'; [void][IO.Directory]::CreateDirectory($s); $d=Join-Path $h '.gemini\config'; [void][IO.Directory]::CreateDirectory($d); $f=Join-Path $d 'skills.json'; $p=$s.Replace('\','/'); $j=New-Object PSObject; if (Test-Path $f) { $x=[IO.File]::ReadAllText($f); if ($x.Trim()) { $j=$x | ConvertFrom-Json } }; $e=@(); if ($j.PSObject.Properties['entries']) { $e=@($j.entries) }; foreach ($i in $e) { if ([string]$i.path -ieq $p) { exit 3 } }; $e += New-Object PSObject -Property @{ path=$p }; if ($j.PSObject.Properties['entries']) { $j.entries=$e } else { $j | Add-Member -NotePropertyName entries -NotePropertyValue $e }; [IO.File]::WriteAllText($f, ($j | ConvertTo-Json -Depth 10), (New-Object Text.UTF8Encoding $false)); exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 2 goto :agy_skills_ok
if errorlevel 1 goto :agy_skills_bad
:agy_skills_ok
echo        [ OK ] Antigravity CLI also reads skills from .agents\skills
call :log "agy skills.json ok"
exit /b 0
:agy_skills_bad
echo        [WARN] Could not update .gemini\config\skills.json (agy may not see skills)
call :log "agy skills.json FAIL"
exit /b 0

rem ------------------------------------------------------------------
:summary
rem check mode installs nothing, so a 32-bit PC is flagged here
if "%AL_TOOL%"=="check" if "%AL_NODE_ARCH%"=="x86" if not defined AL_ERR set "AL_ERR=E04"
call :log "end base=%AL_R_BASE% net=%AL_R_NET% pack=%AL_R_PACK% node=%AL_R_NODE% python=%AL_R_PY% git=%AL_R_GIT% tool=%AL_R_TOOL% path=%AL_R_PATH% err=%AL_ERR%"
echo.
echo  ======================== RESULT ========================
echo    PC check          : %AL_R_BASE%
echo    Internet          : %AL_R_NET%
if "%AL_TOOL%"=="check" goto :summary_tail
echo    Practice folder   : %AL_R_PACK%
echo    Node.js           : %AL_R_NODE%
echo    Python            : %AL_R_PY%
echo    Git               : %AL_R_GIT%
echo    %AL_TOOL_NAME%   : %AL_R_TOOL%
echo    PATH (any folder) : %AL_R_PATH%
:summary_tail
echo  ========================================================
echo.
if defined AL_ERR goto :summary_fail
if "%AL_TOOL%"=="check" goto :summary_check_ok
echo    All done.
:summary_next
echo.
echo    Next:  open  %AL_LAB%  and double-click  start-%AL_TOOL%.cmd
echo           (the folder opens now)
if "%AL_R_PATH:~0,2%"=="OK" echo           You can also type  %AL_TOOL%  in a NEW cmd window, in any folder.
echo.
start "" "%AL_LAB%"
goto :bye
:summary_check_ok
echo    This PC looks ready. Run setup.bat again and choose 1, 2 or 3.
echo.
goto :bye
:summary_fail
echo    Error code: %AL_ERR%
echo    How to fix: %AL_SITE%/help#%AL_ERR%
if "%AL_R_NODE%"=="FAIL" if not "%AL_ERR%"=="E04" echo    Node.js   : %AL_SITE%/help#E04
if "%AL_R_PY%"=="FAIL" if not "%AL_ERR%"=="E08" echo    Python    : %AL_SITE%/help#E08
if "%AL_R_GIT%"=="FAIL" if not "%AL_ERR%"=="E09" echo    Git       : %AL_SITE%/help#E09
echo    Log file  : %AL_LOG%
echo.
rem only Node.js, Python or Git failed: the AI tool works, so the first
rem sessions can go ahead
if not "%AL_R_TOOL:~0,2%"=="OK" goto :bye
if "%AL_ERR%"=="E04" goto :summary_parts_only
if "%AL_ERR%"=="E08" goto :summary_parts_only
if "%AL_ERR%"=="E09" goto :summary_parts_only
goto :bye
:summary_parts_only
echo    %AL_TOOL_NAME% is ready, so you can start now.
echo    Fix the FAIL lines above before period 3: skills need them.
goto :summary_next
:bye
echo  Press any key to close this window.
pause >nul
endlocal
exit /b 0

rem ------------------------------------------------------------------
:log
if exist "%AL_LAB%\" >>"%AL_LOG%" echo [%time%] %~1
exit /b 0
