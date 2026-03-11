@echo off
REM POS Terminal Launcher — Windows
REM Lanza Chrome con --kiosk-printing para imprimir sin dialogo del browser.
REM
REM Setup:
REM   1. Editar HOST y TERMINAL_ID con los valores reales
REM   2. Copiar al Desktop del operador
REM   3. Configurar la impresora 3nStar como predeterminada del sistema

set HOST=https://erp.tudominio.com
set TERMINAL_ID=<tu-terminal-id>

set URL=%HOST%/pos/terminal?terminalId=%TERMINAL_ID%

set CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe
set CHROME_PATH_X86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe

if exist "%CHROME_PATH%" (
  start "" "%CHROME_PATH%" --kiosk-printing "%URL%"
) else if exist "%CHROME_PATH_X86%" (
  start "" "%CHROME_PATH_X86%" --kiosk-printing "%URL%"
) else (
  echo Error: no se encontro Chrome. Instalar Google Chrome.
  pause
  exit /b 1
)
