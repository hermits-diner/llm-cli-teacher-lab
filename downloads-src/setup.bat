@echo off
setlocal EnableExtensions DisableDelayedExpansion
title AI Lab setup
rem ==================================================================
rem  AI Lab setup - AI agent coding for teachers (LLM CLI)
rem  https://llm-cli-teacher-lab.vercel.app
rem
rem  Keep this file ASCII-only: cmd.exe reads batch files in the OEM
rem  code page, so Korean text breaks the parser. Line endings are
rem  normalized to CRLF by scripts/make-downloads.mjs.
rem  Paths are never used inside ( ) blocks: a ")" in a user name
rem  would end the block early.
rem ==================================================================

set "AL_SITE=https://llm-cli-teacher-lab.vercel.app"
set "AL_LAB="
set "AL_SELF=%~f0"
rem test-only overrides (local server / throwaway folder)
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
rem Node.js 23 and later have no 32-bit Windows build. PROCESSOR_ARCHITEW6432
rem is set when a 32-bit cmd runs on 64-bit Windows, where x64 Node.js works.
if /i "%PROCESSOR_ARCHITECTURE%"=="x86" if not defined PROCESSOR_ARCHITEW6432 set "AL_NODE_ARCH=x86"

set "AL_R_BASE=-"
set "AL_R_NET=-"
set "AL_R_PACK=-"
set "AL_R_NODE=-"
set "AL_R_TOOL=-"
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
echo  [1/5] Checking this PC ...
call :check_base
if errorlevel 1 goto :summary

echo.
echo  [2/5] Checking internet access ...
call :check_net
if "%AL_TOOL%"=="check" goto :summary
if "%AL_ERR%"=="E07" goto :summary

echo.
echo  [3/5] Downloading the practice folder to %AL_LAB% ...
call :install_pack
if errorlevel 1 goto :summary

echo.
echo  [4/5] Preparing Node.js %AL_NODE_VER% (portable, no admin needed) ...
rem A Node.js failure does not stop the install: the AI tool does not need
rem Node.js, only the HWPX form tool does, so the first sessions can go ahead.
call :install_node

echo.
echo  [5/5] Installing %AL_TOOL_NAME% ...
echo        (the official installer prints its own messages below)
echo.
call :install_tool
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
if "%AL_NODE_ARCH%"=="x86" echo        [WARN] 32-bit Windows. Node.js does not run here; the HWPX form tool needs it.
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
if "%AL_TOOL%"=="codex" call :net "https://github.com"
if "%AL_TOOL%"=="agy" call :net "https://antigravity.google"
if "%AL_TOOL%"=="check" call :net "https://claude.ai"
if "%AL_TOOL%"=="check" call :net "https://downloads.claude.ai"
if "%AL_TOOL%"=="check" call :net "https://chatgpt.com"
if "%AL_TOOL%"=="check" call :net "https://releases.openai.com"
if "%AL_TOOL%"=="check" call :net "https://github.com"
if "%AL_TOOL%"=="check" call :net "https://antigravity.google"
call :net "https://vercel.com"
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
rem Not setx: it cuts PATH at 1024 characters. PowerShell keeps the other
rem entries and the value type as they are, and does nothing when the
rem folder is already in the user or machine PATH (exit 3). Setting and
rem clearing AI_LAB_TMP makes Windows reload the environment for new
rem windows. The folder is read from the AL_BIN variable inside PowerShell.
rem Optional: a failure is only a warning; start-*.cmd still works.
if not exist "%AL_PS%" goto :path_bad
"%AL_PS%" -NoProfile -ExecutionPolicy Bypass -Command "try { $ErrorActionPreference='Stop'; $b=$env:AL_BIN.TrimEnd('\'); $k=[Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Environment'); $o=[string]$k.GetValue('Path','',[Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames); $t=[Microsoft.Win32.RegistryValueKind]::ExpandString; if ($o) { $t=$k.GetValueKind('Path') }; $p=@($o -split ';' | Where-Object { $_ }); $m=@(([string][Environment]::GetEnvironmentVariable('Path','Machine')) -split ';' | Where-Object { $_ }); foreach ($e in ($p + $m)) { if ([Environment]::ExpandEnvironmentVariables($e).TrimEnd('\') -ieq $b) { exit 3 } }; $k.SetValue('Path', (($p + $b) -join ';'), $t); [Environment]::SetEnvironmentVariable('AI_LAB_TMP','1','User'); [Environment]::SetEnvironmentVariable('AI_LAB_TMP',$null,'User'); exit 0 } catch { exit 1 }" >nul 2>&1
set "AL_RC=%errorlevel%"
if "%AL_RC%"=="0" set "AL_R_PATH=OK (added)"
if "%AL_RC%"=="3" set "AL_R_PATH=OK"
if "%AL_R_PATH%"=="-" goto :path_bad
echo        [ OK ] %AL_TOOL% runs from any folder (in a NEW cmd window)
call :log "path ok rc=%AL_RC%"
exit /b 0
:path_bad
set "AL_R_PATH=WARN (use start-%AL_TOOL%.cmd)"
echo        [WARN] Could not add %AL_TOOL% to PATH. start-%AL_TOOL%.cmd still works.
call :log "path FAIL"
exit /b 0

rem ------------------------------------------------------------------
:summary
rem check mode installs nothing, so a 32-bit PC is flagged here
if "%AL_TOOL%"=="check" if "%AL_NODE_ARCH%"=="x86" if not defined AL_ERR set "AL_ERR=E04"
call :log "end base=%AL_R_BASE% net=%AL_R_NET% pack=%AL_R_PACK% node=%AL_R_NODE% tool=%AL_R_TOOL% path=%AL_R_PATH% err=%AL_ERR%"
echo.
echo  ======================== RESULT ========================
echo    PC check          : %AL_R_BASE%
echo    Internet          : %AL_R_NET%
if "%AL_TOOL%"=="check" goto :summary_tail
echo    Practice folder   : %AL_R_PACK%
echo    Node.js           : %AL_R_NODE%
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
echo    Log file  : %AL_LOG%
echo.
rem only Node.js failed: the AI tool works, so the first sessions can go ahead
if "%AL_ERR%"=="E04" if "%AL_R_TOOL:~0,2%"=="OK" goto :summary_node_only
goto :bye
:summary_node_only
echo    %AL_TOOL_NAME% is ready, so you can start now.
echo    Fix Node.js before the HWPX form practice: it needs Node.js.
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
