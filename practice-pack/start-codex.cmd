@echo off
rem AI Lab launcher - Codex CLI
cd /d "%~dp0"
set "PATH=%~dp0tools\node;%LOCALAPPDATA%\Programs\OpenAI\Codex\bin;%PATH%"
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
codex
