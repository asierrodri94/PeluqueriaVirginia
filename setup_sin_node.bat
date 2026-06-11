@echo off
echo ============================================
echo  Instalando Gestor Peluqueria Virginia...
echo  (sin compilar frontend - usa dist existente)
echo ============================================
echo.

echo Instalando dependencias de Python...
cd /d "%~dp0backend"
python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
echo     OK
echo.

echo ============================================
echo  Instalacion completada.
echo  Ejecuta run.bat para iniciar la aplicacion
echo ============================================
pause
