@echo off
setlocal
echo ============================================
echo  Instalando Gestor Peluqueria Virginia...
echo ============================================
echo.

:: --- Detectar Python (se usa el instalado; "py" elige la version mas reciente) ---
::     Se evita asi cualquier ruta fija y se usa la ultima Python del equipo (probado en 3.14).
::     El venv se recrea desde cero (mas abajo) para que el binario coincida con esta Python.
set "PYCMD="
where py >nul 2>nul && set "PYCMD=py"
if not defined PYCMD ( where python >nul 2>nul && set "PYCMD=python" )
if not defined PYCMD (
  echo [ERROR] No se ha encontrado Python.
  echo         Instala Python (3.11 o superior) desde https://www.python.org/downloads/
  echo         IMPORTANTE: marca "Add Python to PATH" durante la instalacion.
  pause
  exit /b 1
)
echo Usando Python:
%PYCMD% --version
echo.

:: Backend
echo [1/3] Instalando dependencias de Python...
cd /d "%~dp0backend"
:: El venv NO es portable y puede quedar atado a una version de Python que ya no sirve:
:: lo borramos y lo recreamos limpio con %PYCMD%.
if exist ".venv" (
  echo     Eliminando entorno virtual anterior...
  rmdir /s /q ".venv"
)
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
