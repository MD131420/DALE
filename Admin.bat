@echo off
chcp 65001 >nul
title DALE - konto administratora
cd /d "%~dp0dale-web"

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Brak Node.js. Zainstaluj go ze strony https://nodejs.org i uruchom ponownie.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Pierwsze uruchomienie - instaluje pakiety, to chwile potrwa...
  call npm install
)

rem Creates the admin account, or sets a new password for it (also when the password is forgotten).
call npm run admin --silent
pause
