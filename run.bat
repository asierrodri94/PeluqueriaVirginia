@echo off
cd /d "%~dp0backend"
call .venv\Scripts\activate.bat

:: Abrir el navegador tras 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

:: Arrancar el servidor (ventana con titulo)
title Peluqueria Virginia - Servidor
python -m uvicorn main:app --host 0.0.0.0 --port 8000
