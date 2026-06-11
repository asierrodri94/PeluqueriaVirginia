@echo off
echo ============================================
echo  Instalando Gestor Peluqueria Virginia...
echo ============================================
echo.

set PYTHON=C:\Users\asier\AppData\Local\Programs\Python\Python312\python.exe
set NODE_PATH=C:\Program Files\nodejs
set PATH=%NODE_PATH%;%PATH%

:: Backend
echo [1/3] Instalando dependencias de Python...
cd /d "%~dp0backend"
"%PYTHON%" -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
echo     OK
echo.

:: Frontend - instalar
echo [2/3] Instalando dependencias del frontend...
cd /d "%~dp0frontend"
call npm install --silent
echo     OK
echo.

:: Frontend - construir
echo [3/3] Construyendo la interfaz...
call npm run build
echo     OK
echo.

echo ============================================
echo  Instalacion completada.
echo  Ejecuta run.bat para iniciar la aplicacion
echo ============================================
pause
