@echo off
cd /d "%~dp0backend"

:: Abrir el navegador tras 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

:: Arrancar el servidor (ventana con titulo)
:: Se llama directamente al python del venv para evitar el alias de Python
:: de la Microsoft Store (activate.bat no siempre ajusta el PATH).
title Peluqueria Virginia - Servidor
.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

:: Solo se queda esperando si el servidor fallo al arrancar (codigo de salida != 0).
:: Al cerrar con el boton "Cerrar" la salida es 0 y la ventana se cierra sola.
if errorlevel 1 (
  echo.
  echo [ERROR] El servidor se detuvo de forma inesperada.
  pause
)
