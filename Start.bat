@echo off
chcp 65001 >nul
title DALE - strona lokalnie
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
  if errorlevel 1 (
    echo  Instalacja pakietow nie powiodla sie.
    pause
    exit /b 1
  )
)

echo.
echo  DALE startuje: http://localhost:5173
echo  Panel admina:   http://localhost:5173/admin  (konto zakladasz plikiem Admin.bat)
echo  Aby zatrzymac strone, zamknij to okno (albo Ctrl+C).
echo.
call npm run dev -- --port 5173 --open
pause
