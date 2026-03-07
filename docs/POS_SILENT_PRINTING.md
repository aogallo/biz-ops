# POS Silent Printing — Evitar el dialogo de impresion del browser

## Problema

`window.print()` siempre muestra el dialogo nativo del browser antes de imprimir.
Esto es una restriccion de seguridad del browser — no hay API JavaScript que lo suprima.

## Solucion

El flag `--kiosk-printing` de Chrome/Brave hace que `window.print()` envie el trabajo
directamente a la impresora predeterminada del sistema, **sin mostrar ningun dialogo**.

No se requieren cambios en el codigo de la aplicacion.

## Prerequisito

La impresora termica (3nStar) debe estar configurada como **impresora predeterminada**
del sistema operativo antes de lanzar el browser.

## Lanzar el POS

### macOS (Chrome)

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk-printing \
  "http://<host>/pos/terminal?terminalId=<id>"
```

### macOS (Brave)

```bash
/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser \
  --kiosk-printing \
  "http://<host>/pos/terminal?terminalId=<id>"
```

### Windows (Chrome)

```batch
chrome.exe --kiosk-printing "http://<host>/pos/terminal?terminalId=<id>"
```

Reemplazar `<host>` y `<terminalId>` con los valores reales del entorno.

## Scripts de arranque

En `scripts/pos-launchers/` hay scripts listos para copiar al Desktop del operador:

| Archivo | Plataforma |
|---|---|
| `pos-launcher-macos.sh` | macOS (Chrome) |
| `pos-launcher-windows.bat` | Windows (Chrome) |

Editar el script con el `HOST` y `TERMINAL_ID` correspondientes antes de usar.

## Comportamiento esperado

| Configuracion | Sin `--kiosk-printing` | Con `--kiosk-printing` |
|---|---|---|
| `autoPrintReceipt = true` | Dialogo del browser | Imprime directo, sin dialogo |
| `autoPrintReceipt = false` + click "Imprimir" | Dialogo del browser | Imprime directo, sin dialogo |

## Verificacion

1. Configurar la impresora 3nStar como impresora predeterminada del sistema
2. Ejecutar el script de arranque correspondiente
3. Completar una venta — el recibo debe imprimirse sin mostrar el dialogo del browser

## Notas

- El flag solo suprime el dialogo; la impresion real sigue dependiendo de los drivers de la impresora
- Funciona en Chrome 70+ y Brave (cualquier version basada en Chromium)
- No funciona en Firefox ni Safari — usar Chrome o Brave en el workstation POS
