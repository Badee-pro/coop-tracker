@echo off
set "ROOT=%~dp0"
set "PATH=C:\Ruby34-x64\bin;%PATH%"
start "Co-op Tracker - Rails API" cmd /k "cd /d "%ROOT%backend" && ruby bin/rails db:prepare && ruby bin/rails server -p 3000"
start "Co-op Tracker - React" cmd /k "cd /d "%ROOT%frontend" && npm run dev"
timeout /t 6 /nobreak >nul
start "" http://localhost:5173
