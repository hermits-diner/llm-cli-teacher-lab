@echo off
rem AI Lab launcher - Codex CLI
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\Python\Python314;%LOCALAPPDATA%\Programs\Python\Python314\Scripts;%~dp0tools\node;%~dp0tools\git\cmd;%LOCALAPPDATA%\Programs\OpenAI\Codex\bin;%PATH%"
set "PYTHONUTF8=1"
if not exist "mission1\site" mkdir "mission1\site"
where codex >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] Codex CLI is not installed yet.
  echo      Run setup.bat again and choose 2.
  echo.
  pause
  exit /b 1
)
rem Auto-approve: the AI acts without asking. Esc stops it.
codex --dangerously-bypass-approvals-and-sandbox
