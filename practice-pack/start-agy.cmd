@echo off
rem AI Lab launcher - Antigravity CLI
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\Python\Python314;%LOCALAPPDATA%\Programs\Python\Python314\Scripts;%~dp0tools\node;%~dp0tools\git\cmd;%LOCALAPPDATA%\agy\bin;%PATH%"
set "PYTHONUTF8=1"
if not exist "mission1\site" mkdir "mission1\site"
where agy >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] Antigravity CLI is not installed yet.
  echo      Run setup.bat again and choose 3.
  echo.
  pause
  exit /b 1
)
rem Auto-approve: the AI acts without asking. Esc stops it.
agy --dangerously-skip-permissions
