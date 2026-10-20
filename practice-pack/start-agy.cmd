@echo off
rem AI Lab launcher - Antigravity CLI
cd /d "%~dp0"
set "PATH=%~dp0tools\node;%LOCALAPPDATA%\agy\bin;%PATH%"
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
agy
