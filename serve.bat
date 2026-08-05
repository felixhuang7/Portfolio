@echo off
REM WikiBot showcase local server toggle (run again to stop)
REM Port 5175. URL: http://localhost:5175
cd /d "%~dp0"
set PORT=5175

REM read our recorded PID (if any)
set OUR_PID=
if exist "%~dp0serve.pid" set /p OUR_PID=<"%~dp0serve.pid"

REM is anything listening on PORT?
netstat -ano | findstr ":%PORT% " | findstr LISTENING >nul 2>&1
if errorlevel 1 goto start

REM something is listening. is it OUR process?
if not defined OUR_PID goto stranger
netstat -ano | findstr ":%PORT% " | findstr LISTENING | findstr "%OUR_PID%" >nul 2>&1
if errorlevel 1 goto stranger

REM --- ours: kill it ---
echo [stop] killing our server PID=%OUR_PID% ...
taskkill /PID %OUR_PID% /F >nul 2>&1
del /q "%~dp0serve.pid" >nul 2>&1
timeout /t 1 >nul
echo done.
timeout /t 2 >nul
exit /b 0

:stranger
echo [!] port %PORT% is in use, but NOT by this script's server.
echo     Refusing to kill an unknown process. PID(s) on port %PORT%:
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do echo     %%a
echo     Close that process manually, then run serve.bat again.
timeout /t 5 >nul
exit /b 1

:start
REM stale pidfile but nothing listening: clean up
if defined OUR_PID del /q "%~dp0serve.pid" >nul 2>&1

REM --- start: hidden background process via pythonw (no console window) ---
where pythonw >nul 2>nul && (set PY=pythonw) || (set PY=python)
where %PY% >nul 2>nul
if errorlevel 1 (
    where py >nul 2>nul && (set PY=py) || (
        echo [x] Python not found. Install Python or open index.html directly.
        pause
        exit /b 1
    )
    set PY=%PY% -3
)

echo [start] launching hidden background server on port %PORT%...
powershell -NoProfile -Command "$p = Start-Process -FilePath '%PY%' -ArgumentList '-m','http.server','%PORT%','--directory','%~dp0.' -WindowStyle Hidden -RedirectStandardOutput '%~dp0serve.log' -RedirectStandardError '%~dp0serve.err' -PassThru; $p.Id | Out-File -FilePath '%~dp0serve.pid' -Encoding ascii -NoNewline; Write-Host ('  PID = ' + $p.Id)"

timeout /t 2 >nul
echo.
echo   ============================================
echo     URL    :  http://localhost:%PORT%
echo     mode   :  hidden background (survives terminal close)
echo     stop   :  run serve.bat again
echo     logs   :  serve.log / serve.err
echo   ============================================
start "" http://localhost:%PORT%
timeout /t 3 >nul
exit /b 0
