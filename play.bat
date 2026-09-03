@echo off
setlocal
cd /d "%~dp0"
title Plank Fighter World - live

REM Double-click this to play the current code in a browser.
REM Pulls, installs anything new, and starts the dev server with hot reload,
REM so an edit shows up without rebuilding or downloading anything.

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed, or npm is not on PATH.
  echo Get Node 20 or newer from https://nodejs.org, then run this again.
  echo.
  pause
  exit /b 1
)

echo == Getting the latest code ==
git pull --ff-only
if errorlevel 1 echo    couldn't pull - carrying on with the code you have
echo.

echo == Installing dependencies ==
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo npm install failed - nothing has started.
  pause
  exit /b 1
)
echo.

echo == Starting ==
echo The game opens in your browser. Edits reload on their own.
echo.
echo Plug your controller in and PRESS A BUTTON on it - browsers ignore a
echo gamepad until it sends something.
echo.
echo Leave this window open. Ctrl+C stops it.
echo.
call npm run dev -- --open
pause
