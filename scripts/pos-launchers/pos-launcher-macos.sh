#!/bin/bash
# POS Terminal Launcher — macOS
# Lanza Chrome con --kiosk-printing para imprimir sin dialogo del browser.
#
# Setup:
#   1. Editar HOST y TERMINAL_ID con los valores reales
#   2. chmod +x pos-launcher-macos.sh
#   3. Copiar al Desktop del operador
#   4. Configurar la impresora 3nStar como predeterminada del sistema

HOST="https://erp.tudominio.com"
TERMINAL_ID="<tu-terminal-id>"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BRAVE="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

URL="${HOST}/pos/terminal?terminalId=${TERMINAL_ID}"

if [ -f "$CHROME" ]; then
  "$CHROME" --kiosk-printing "$URL"
elif [ -f "$BRAVE" ]; then
  "$BRAVE" --kiosk-printing "$URL"
else
  echo "Error: no se encontro Chrome ni Brave. Instalar uno de los dos."
  exit 1
fi
