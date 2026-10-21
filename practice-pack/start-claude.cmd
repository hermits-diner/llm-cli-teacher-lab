@echo off
rem AI Lab launcher - Claude Code
cd /d "%~dp0"
set "PATH=%~dp0tools\node;%USERPROFILE%\.local\bin;%PATH%"
if not exist "mission1\site" mkdir "mission1\site"
where claude >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] Claude Code is not installed yet.
  echo      Run setup.bat again and choose 1.
  echo.
  pause
  exit /b 1
)
rem Auto-approve: the AI acts without asking. Esc stops it.
claude --dangerously-skip-permissions
