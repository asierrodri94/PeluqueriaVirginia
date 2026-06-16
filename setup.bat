@echo off
setlocal
echo ============================================
echo  Instalando Gestor Peluqueria Virginia...
echo ============================================
echo.

:: --- Detectar Python (lanzador "py" primero, luego "python" del PATH) ---
::     Se evita asi cualquier ruta fija dependiente del usuario de Windows.
set "PYCMD="
where py >nul 2>nul && set "PYCMD=py"
if not defined PYCMD (
  where python >nul 2>nul && set "PYCMD=python"
)
if not defined PYCMD (
  echo [ERROR] No se ha encontrado Python.
  echo         Instala Python 3.11 o superior desde https://www.python.org/downloads/
  echo         IMPORTANTE: marca "Add Python to PATH" durante la instalacion.
  pause
  exit /b 1
)

:: Backend
echo [1/3] Instalando dependencias de Python...
cd /d "%~dp0backend"
%PYCMD% -m venv .venv
if errorlevel 1 (
  echo [ERROR] No se pudo crear el entorno virtual de Python.
  pause
  exit /b 1
)
.venv\Scripts\python.exe -m pip install --upgrade pip --quiet
.venv\Scripts\python.exe -m pip install -r requirements.txt --quiet
if errorlevel 1 (
  echo [ERROR] Fallo al instalar las dependencias de Python.
  pause
  exit /b 1
)
echo     OK
echo.

:: --- Detectar Node/npm ---
::     Se anade la ruta estandar de Node por si no esta en el PATH.
if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%PATH%"
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se ha encontrado Node.js / npm.
  echo         Instala la version LTS desde https://nodejs.org/
  pause
  exit /b 1
)

:: Frontend - instalar
echo [2/3] Instalando dependencias del frontend...
cd /d "%~dp0frontend"
call npm install --silent
if errorlevel 1 (
  echo [ERROR] Fallo en npm install.
  pause
  exit /b 1
)
echo     OK
echo.

:: Frontend - construir
echo [3/3] Construyendo la interfaz...
call npm run build
if errorlevel 1 (
  echo [ERROR] Fallo en npm run build.
  pause
  exit /b 1
)
echo     OK
echo.

echo ============================================
echo  Instalacion completada.
echo  Ejecuta run.bat para iniciar la aplicacion
echo ============================================
pause
