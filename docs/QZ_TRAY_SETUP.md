# Guía de Configuración: QZ Tray + POS

Documento para técnicos / encargados de TI. Cubre la instalación de QZ Tray en la
computadora del punto de venta y la configuración del terminal dentro del ERP.

---

## Índice

1. [¿Qué es QZ Tray y por qué lo usamos?](#1-qué-es-qz-tray-y-por-qué-lo-usamos)
2. [Requisitos](#2-requisitos)
3. [Instalar QZ Tray en la computadora](#3-instalar-qz-tray-en-la-computadora)
4. [Verificar que QZ Tray está corriendo](#4-verificar-que-qz-tray-está-corriendo)
5. [Conocer el nombre exacto de la impresora](#5-conocer-el-nombre-exacto-de-la-impresora)
6. [Crear el terminal POS en el ERP](#6-crear-el-terminal-pos-en-el-erp)
7. [Probar la impresión](#7-probar-la-impresión)
8. [Hacer que QZ Tray arranque automáticamente](#8-hacer-que-qz-tray-arranque-automáticamente)
9. [Troubleshooting](#9-troubleshooting)
10. [Comparación de métodos de impresión](#10-comparación-de-métodos-de-impresión)
11. [Configurar certificados para producción](#11-configurar-certificados-para-producción)

---

## 1. ¿Qué es QZ Tray y por qué lo usamos?

**QZ Tray** es una aplicación de escritorio gratuita que corre en segundo plano.
Abre un WebSocket local (`wss://localhost:8181`) y permite que el browser envíe
comandos de impresión directamente al hardware — sin mostrar el diálogo del browser.

| Sin QZ Tray                                         | Con QZ Tray                                           |
| --------------------------------------------------- | ----------------------------------------------------- |
| El browser muestra el diálogo de impresión cada vez | Imprime silenciosamente, sin ningún diálogo           |
| El cajero tiene que hacer click en "Imprimir"       | El recibo sale automáticamente al finalizar la venta  |
| Depende de los drivers del sistema operativo        | Envía comandos ESC/POS nativos a la impresora térmica |

> **Fallback automático**: si QZ Tray no está corriendo o falla, el sistema
> cae automáticamente al método de browser (`window.print()`). El POS nunca queda bloqueado.

---

## 2. Requisitos

### Hardware mínimo

- Impresora térmica compatible con ESC/POS (Epson TM serie, 3nStar, Sam4s, Bixolon, etc.)
- La impresora debe estar conectada por **USB** o **red local** y visible en el sistema operativo

### Software

| Componente                       | Versión mínima                            |
| -------------------------------- | ----------------------------------------- |
| Windows                          | 10 / 11                                   |
| macOS                            | 11 Big Sur o superior                     |
| QZ Tray                          | 2.2.x (última estable)                    |
| Chrome / Brave / Edge (Chromium) | Cualquier versión reciente                |
| Java (JRE)                       | 11 o superior — **requerido por QZ Tray** |

> **Nota**: QZ Tray requiere Java. Si la computadora no tiene Java instalado, ver sección 3.1.

---

## 3. Instalar QZ Tray en la computadora

### 3.1 Instalar Java (si no está instalado)

**Windows:**

1. Ir a <https://adoptium.net/>
2. Descargar el instalador **JRE 21 LTS** para Windows x64
3. Ejecutar el `.msi` y seguir el asistente (opciones por defecto están bien)
4. Verificar: abrir CMD y ejecutar `java -version` — debe mostrar la versión instalada

**macOS:**

```bash
# Con Homebrew (recomendado)
brew install --cask temurin

# Verificar
java -version
```

### 3.2 Instalar QZ Tray

1. Ir a **<https://qz.io/download/>** (sitio oficial)
2. Descargar el instalador para el sistema operativo correspondiente:
   - Windows: `qz-tray-2.x.x.exe`
   - macOS: `qz-tray-2.x.x.pkg`

**Windows:**

1. Ejecutar el instalador `.exe` como Administrador
2. Aceptar los términos y seguir el asistente (opciones por defecto)
3. Al finalizar, QZ Tray arranca automáticamente — aparece un ícono en la bandeja del sistema (esquina inferior derecha)

**macOS:**

1. Ejecutar el instalador `.pkg`
2. Ingresar la contraseña de administrador cuando lo pida
3. Al finalizar, QZ Tray arranca — aparece un ícono de impresora en la barra de menú (esquina superior derecha)

---

## 4. Verificar que QZ Tray está corriendo

### Windows

- En la bandeja del sistema (área de notificaciones, esquina inferior derecha), buscar el ícono de impresora de QZ Tray
- Si no aparece, ir a **Inicio → QZ Tray** para iniciarlo manualmente

### macOS

- En la barra de menú (parte superior derecha), buscar el ícono de impresora
- Si no aparece, abrir **Finder → Aplicaciones → QZ Tray**

### Verificar vía browser

Abrir el browser y navegar a:

```
https://localhost:8181
```

Si QZ Tray está corriendo, el browser mostrará un mensaje de "conexión rechazada" o un
certificado autofirmado — eso es **normal y correcto**. Si la página no carga en absoluto
(timeout), QZ Tray no está corriendo.

---

## 5. Conocer el nombre exacto de la impresora

El nombre de la impresora que se configura en el ERP debe ser **exactamente igual** al
nombre que el sistema operativo le asigna. Un espacio de diferencia rompe la conexión.

### Windows

1. Ir a **Inicio → Configuración → Bluetooth y dispositivos → Impresoras y escáneres**
2. Hacer click en la impresora térmica
3. El nombre que aparece en la parte superior es el que hay que copiar exactamente

Alternativa rápida (CMD o PowerShell):

```powershell
Get-Printer | Select-Object Name
```

Copiar el nombre tal cual aparece, incluyendo mayúsculas y espacios.

### macOS

1. Ir a **Preferencias del Sistema → Impresoras y Escáneres**
2. El nombre aparece en la lista de la izquierda
3. Copiar el nombre tal cual (macOS puede mostrar un nombre diferente al del driver)

Alternativa (Terminal):

```bash
lpstat -p | awk '{print $2}'
```

### Ejemplos de nombres típicos

| Impresora      | Nombre en Windows | Nombre en macOS |
| -------------- | ----------------- | --------------- |
| Epson TM-T88V  | `EPSON TM-T88V`   | `EPSON_TM-T88V` |
| 3nStar RPT006  | `3nStar RPT006`   | `3nStar_RPT006` |
| Sam4s Ellix 30 | `Ellix 30`        | `Ellix_30`      |

> **Importante**: macOS suele reemplazar espacios con guiones bajos `_`. Probar ambas
> variantes si la impresión falla.

---

## 6. Crear el terminal POS en el ERP

### Paso 1: Ingresar a la configuración de terminales

1. Abrir el ERP en el browser
2. Ir al menú lateral → **POS** → **Configuración** → **Terminales**
3. Hacer click en **Nueva Caja**

### Paso 2: Completar el formulario

| Campo                               | Valor a ingresar                                                   |
| ----------------------------------- | ------------------------------------------------------------------ |
| **Nombre**                          | Nombre identificatorio de la caja (ej: `Caja 1`, `Caja Principal`) |
| **Nombre de impresora**             | El nombre exacto obtenido en el Paso 5 (ej: `EPSON TM-T88V`)       |
| **Método de impresión**             | Seleccionar **QZ Tray (ESC/POS)**                                  |
| **Sucursal**                        | Seleccionar la sucursal correspondiente (opcional)                 |
| **Empresa legal**                   | Seleccionar la empresa para la facturación (opcional)              |
| **Cliente por defecto**             | Cliente genérico para ventas sin identificación (opcional)         |
| **Auto-generar factura**            | Activar si se quiere factura automática con cada venta             |
| **Imprimir recibo automáticamente** | **Activar** — el recibo sale solo al finalizar la venta            |

### Paso 3: Guardar

Hacer click en **Crear Caja**. El terminal queda creado.

---

## 7. Probar la impresión

### Secuencia de prueba completa

1. **Asegurarse que QZ Tray está corriendo** (ícono visible en bandeja / barra de menú)
2. **Asegurarse que la impresora está encendida y con papel**
3. Abrir el browser y navegar al POS: `https://<host>/pos`
4. Seleccionar el terminal recién creado
5. Ingresar con un cajero
6. Agregar cualquier producto al carrito
7. Ir a cobrar → confirmar el pago
8. El recibo debe **salir automáticamente por la impresora térmica, sin ningún diálogo**

### Si pide aceptar el certificado de QZ Tray

La primera vez que el browser se conecta a QZ Tray puede mostrar una alerta de
certificado autofirmado. Hacer click en **Aceptar** o **Continuar de todas formas**.
Esto solo sucede una vez por browser.

En algunos casos QZ Tray mismo muestra un popup pidiendo autorización al sitio.
Hacer click en **Permitir** y marcar "Recordar esta decisión".

---

## 8. Hacer que QZ Tray arranque automáticamente

Para que el operador no tenga que iniciar QZ Tray manualmente cada vez que enciende la
computadora:

### Windows — Inicio automático

QZ Tray ya se agrega al inicio automático durante la instalación. Para verificarlo:

1. Presionar `Win + R` → escribir `shell:startup` → Enter
2. Debe aparecer un acceso directo de QZ Tray
3. Si no aparece, crear un acceso directo del ejecutable de QZ Tray en esa carpeta:
   - El ejecutable suele estar en `C:\Program Files\QZ Tray\qz-tray.exe`

Alternativa por Task Scheduler para arranque sin login de usuario (recomendado para
cajas dedicadas):

1. Abrir **Programador de tareas**
2. Crear tarea básica → "QZ Tray Auto Start"
3. Desencadenador: "Al iniciar el equipo"
4. Acción: Iniciar programa → `C:\Program Files\QZ Tray\qz-tray.exe`
5. Marcar "Ejecutar con los privilegios más altos"

### macOS — Inicio automático

1. Ir a **Preferencias del Sistema → General → Elementos de inicio de sesión**
2. Hacer click en `+`
3. Navegar a **Aplicaciones → QZ Tray** y agregarlo
4. QZ Tray arrancará automáticamente al iniciar sesión

---

## 9. Troubleshooting

### La impresión cae al diálogo del browser (modo fallback)

Significa que QZ Tray no pudo conectarse o falló. Verificar:

1. **¿QZ Tray está corriendo?** — Buscar el ícono en la bandeja / barra de menú
2. **¿El nombre de la impresora es correcto?** — Comparar carácter por carácter con lo que muestra el sistema operativo
3. **Abrir la consola del browser** (`F12` → Console) y buscar el mensaje:

   ```
   [QZ Tray] fallback to browser print: <razón del fallo>
   ```

   La razón del fallo indica qué está mal.

### Errores comunes en consola

| Mensaje                          | Causa                                                    | Solución                                               |
| -------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| `Unable to establish connection` | QZ Tray no está corriendo                                | Iniciar QZ Tray                                        |
| `No printer name configured`     | El campo "Nombre de impresora" en el terminal está vacío | Editar el terminal y agregar el nombre                 |
| `Printer not found`              | El nombre no coincide exactamente                        | Verificar el nombre en el sistema operativo            |
| `Connection refused`             | QZ Tray bloqueado por firewall                           | Agregar excepción en el firewall para el puerto 8181   |
| `Certificate error`              | Certificado autofirmado no aceptado                      | Ir a `https://localhost:8181` y aceptar el certificado |

### El recibo imprime pero con caracteres raros (mojibake)

El builder ESC/POS del sistema envía texto UTF-8. Si la impresora no está configurada
para UTF-8, puede mostrar caracteres incorrectos para tildes y ñ. Soluciones:

1. **Configurar la impresora en UTF-8** desde su utilidad de configuración (varía por modelo)
2. **Para impresoras Epson**: usar la utilidad **EpsonNet Config** o el panel de control
   de la impresora para cambiar el code page a UTF-8 / PC-858 (incluye caracteres latinos)
3. Si persiste, contactar al soporte técnico para ajustar el code page en el builder ESC/POS

### La impresora corta el papel a la mitad del recibo

Verificar que el tipo de papel configurado en el driver/sistema coincide con el papel
real. El builder usa `GS V 0` (corte completo). Algunas impresoras requieren `GS V 1`
(corte parcial). Reportar al equipo de desarrollo si ocurre.

### QZ Tray instalado pero no aparece en la bandeja (Windows)

1. Buscar `QZ Tray` en el buscador de Windows e iniciarlo manualmente
2. Si aparece un error de Java: reinstalar Java (JRE 11+) y luego reinstalar QZ Tray
3. Verificar que la versión de Java (32-bit vs 64-bit) coincide con la de QZ Tray

---

## 10. Comparación de métodos de impresión

El ERP soporta dos métodos. Se configura por terminal, no es global.

|                               | QZ Tray (ESC/POS)                    | Navegador (window.print)       |
| ----------------------------- | ------------------------------------ | ------------------------------ |
| **Diálogo al imprimir**       | ❌ Ninguno                           | ✅ Siempre aparece             |
| **Velocidad**                 | Muy rápido (directo a la impresora)  | Depende del render del browser |
| **Calidad del recibo**        | ESC/POS nativo — óptimo para térmica | HTML renderizado — varía       |
| **Corte automático de papel** | ✅ Sí (comando GS V)                 | ❌ No                          |
| **Requiere software extra**   | ✅ QZ Tray en cada PC                | ❌ Solo el browser             |
| **Funciona sin internet**     | ✅ Sí (local)                        | ✅ Sí                          |
| **Recomendado para**          | Cajas de producción dedicadas        | Pruebas o cajas eventuales     |

### ¿Cuándo usar el método Browser?

- Durante el **desarrollo o pruebas** cuando no se tiene impresora física
- En **computadoras eventuales** que no tienen QZ Tray instalado
- Como **respaldo** si QZ Tray da problemas

El sistema cae automáticamente al método Browser si QZ Tray falla, por lo que el
cajero nunca queda sin poder imprimir.

---

## Checklist de instalación por computadora

Usar esta lista para cada PC de punto de venta que se configure:

- [ ] Java JRE 11+ instalado (`java -version` funciona en terminal)
- [ ] QZ Tray instalado y corriendo (ícono visible en bandeja / barra de menú)
- [ ] Certificado de QZ Tray registrado vía Site Manager → Browse (ver sección 11.2)
- [ ] QZ Tray configurado para iniciar automáticamente al encender la PC
- [ ] Impresora térmica instalada y visible en el sistema operativo
- [ ] Nombre exacto de la impresora copiado del sistema operativo
- [ ] Terminal POS creado en el ERP con:
  - [ ] Nombre de impresora correcto
  - [ ] Método de impresión: **QZ Tray (ESC/POS)**
  - [ ] Auto-imprimir recibo: **Activado**
  - [ ] Sucursal y empresa configuradas
- [ ] Prueba de venta completa realizada → recibo imprime sin diálogo
- [ ] Cajero asignado al terminal

---

---

## 11. Configurar certificados para producción

Esta sección es para el equipo de desarrollo / DevOps. Explica cómo funciona el sistema
de firma y cómo configurarlo al desplegar la aplicación.

### ¿Por qué hay un certificado?

QZ Tray requiere que el sitio web que se conecta a él esté **firmado digitalmente**. Cada
vez que el browser carga el POS, QZ Tray:

1. Recibe el certificado público del sitio (`/qz-certificate.pem`)
2. Le envía un string aleatorio para firmar (`toSign`)
3. El server firma ese string con la **llave privada** (`QZ_PRIVATE_KEY`)
4. QZ Tray verifica la firma con el certificado público

Si la firma es válida **y** el certificado está en el registro interno de QZ Tray, se
conecta sin mostrar ningún diálogo. Si no, muestra el popup de "Untrusted website".

> **Clave**: solo los certificados generados desde el **Site Manager de QZ Tray** son
> reconocidos automáticamente como trusted. Un certificado autofirmado con `openssl`
> nunca lo será.

---

### 11.1 Generar el par de certificados (Site Manager) — una sola vez para todo el sistema

Este paso **ya fue realizado por el equipo de desarrollo**. Solo se repite si el
certificado expira o se compromete. No se hace en cada caja nueva.

1. Tener QZ Tray instalado localmente (ver sección 3)
2. Abrir el browser y navegar a: `https://localhost:8181`
3. Ir a la pestaña **Site Manager**
4. Hacer click en **Create New...**
5. QZ Tray genera y descarga dos archivos:
   - `digital-certificate.txt` — el certificado público X.509 (PEM) → **este es el que se distribuye a las cajas**
   - `private-key.pem` — la llave privada PKCS#8 (PEM) → queda en el server, nunca sale

> **Importante**: al generarlo desde el Site Manager, QZ Tray lo registra internamente
> como trusted en esa computadora en ese mismo momento. El certificado público
> (`digital-certificate.txt`) es el que deben importar las demás cajas vía Browse (ver 11.2).

> **El certificado ya está generado y en el repo** como `public/qz-certificate.pem`.
> Si lo necesitás para una caja nueva, descargalo desde `https://<host-produccion>/qz-certificate.pem`.

---

### 11.2 Registrar el certificado en cada caja (sin generar uno nuevo)

En cada computadora de punto de venta hay que decirle a QZ Tray que confíe en el
certificado del servidor. Esto se hace **una sola vez por caja** usando el botón
**Browse...** del Site Manager. **No generar uno nuevo** — eso invalidaría el anterior.

**Pasos:**

1. Asegurarse que QZ Tray está corriendo en esa computadora
2. Abrir el browser y navegar a: `https://localhost:8181`
3. Ir a la pestaña **Site Manager**
4. Hacer click en **Browse...**
5. Seleccionar el archivo `digital-certificate.txt` (el certificado público del servidor)
6. El certificado aparece en la lista como **Allowed**
7. Cerrar el Site Manager — listo

**¿Cómo obtener el `digital-certificate.txt`?**

- Opción A: Descargarlo desde `https://<host-produccion>/qz-certificate.pem` (es el certificado público del servidor)
- Opción B: Compartir el archivo original generado al crear el par (son el mismo contenido)

> **Atención**: **nunca usar "Create New..."** en cajas de producción. Ese botón genera
> un par completamente nuevo e invalida el certificado actual en todo el sistema.
> Siempre usar **Browse...** para importar el certificado existente.

---

### 11.3 Aplicar el certificado al proyecto

**Paso 1 — Certificado público** (va al repositorio):

```bash
# Copiar el contenido de digital-certificate.txt a:
public/qz-certificate.pem
```

El archivo debe quedar exactamente así, sin líneas extra al principio ni al final:

```
-----BEGIN CERTIFICATE-----
MIIECzCCAvO... (contenido del certificado)
-----END CERTIFICATE-----
```

Este archivo es **público y seguro para commitear a git**.

**Paso 2 — Llave privada** (va como variable de entorno, NUNCA al repositorio):

Formatear la llave en una sola línea con `\n` literales:

```bash
awk 'NF {printf "%s\\n", $0}' private-key.pem
```

El output tiene este formato (todo en una línea):

```
-----BEGIN PRIVATE KEY-----\nMIIEvAIBADA...\n-----END PRIVATE KEY-----\n
```

Guardar ese valor — se usa en los pasos siguientes.

---

### 11.4 Configurar en Cloudflare Workers (producción)

El proyecto corre en Cloudflare Workers. La llave privada va como **secret**.

**Opción A — Wrangler CLI** (recomendado):

```bash
wrangler secret put QZ_PRIVATE_KEY
```

Wrangler va a pedir el valor. Pegar el contenido **completo del archivo `private-key.pem`**
(con saltos de línea reales, no los `\n` literales del paso anterior):

```
-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASC...
...
-----END PRIVATE KEY-----
```

Presionar Enter y luego `Ctrl+D` para confirmar. Wrangler sube el secret encriptado.

**Opción B — Dashboard de Cloudflare**:

1. Ir a **dash.cloudflare.com** → **Workers & Pages** → seleccionar el worker del ERP
2. Ir a **Settings → Variables**
3. En la sección **Environment Variables**, hacer click en **Add variable**
4. Nombre: `QZ_PRIVATE_KEY`
5. Valor: pegar el contenido del archivo `private-key.pem` tal cual (con saltos de línea)
6. Marcar **Encrypt** (para que sea un secret)
7. Guardar y hacer **redeploy** del worker

> **Nota**: el endpoint `/api/qz/sign` normaliza automáticamente tanto saltos de línea
> reales como `\n` literales. Ambos formatos funcionan.

---

### 11.5 Configurar en Vercel (si aplica)

Si en algún momento el proyecto se despliega en Vercel:

1. Ir a **vercel.com** → proyecto → **Settings → Environment Variables**
2. Agregar variable:
   - **Key**: `QZ_PRIVATE_KEY`
   - **Value**: pegar el contenido del `private-key.pem` (con saltos de línea reales)
   - **Environment**: Production (y Preview si se quiere probar ahí)
3. Hacer redeploy

---

### 11.6 Configurar entorno local de desarrollo

En el archivo `.env.local` (en la raíz del proyecto, **nunca commitear**):

```bash
# Generar el valor formateado con \n literales:
awk 'NF {printf "%s\\n", $0}' private-key.pem
```

Pegar el resultado en `.env.local`:

```
QZ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADA...\n-----END PRIVATE KEY-----\n"
```

El mismo valor va en `.dev.vars` (para Wrangler en modo local).

Reiniciar el servidor de desarrollo para que tome el nuevo valor:

```bash
npm run dev
```

---

### 11.7 Renovar el certificado

El certificado generado por el Site Manager tiene una fecha de expiración (visible en el
archivo PEM). Cuando expire o si la llave privada se compromete:

1. Repetir el proceso del **Paso 11.1** para generar un nuevo par (en la computadora del dev team)
2. Reemplazar `public/qz-certificate.pem` y commitear
3. Actualizar `QZ_PRIVATE_KEY` en Cloudflare / Vercel con la nueva llave
4. Desplegar
5. En cada caja de producción: repetir el proceso del **Paso 11.2** (Browse → seleccionar el nuevo `digital-certificate.txt`)

> **Atención**: al generar un nuevo par, el certificado anterior deja de ser trusted
> automáticamente en todas las cajas. Hay que redistribuir el nuevo certificado a cada
> instalación de QZ Tray usando **Browse...** (nunca "Create New...").

---

### Resumen de archivos y variables

| Elemento              | Ubicación                   | Privado | Qué hacer                               |
| --------------------- | --------------------------- | ------- | --------------------------------------- |
| Certificado público   | `public/qz-certificate.pem` | ❌ No   | Commitear al repo                       |
| Llave privada         | `QZ_PRIVATE_KEY` (env var)  | ✅ Sí   | Secret en Cloudflare / Vercel           |
| Llave privada (local) | `.env.local` y `.dev.vars`  | ✅ Sí   | Nunca commitear, agregar a `.gitignore` |
| Endpoint de firma     | `app/routes/api.qz.sign.ts` | —       | Ya está en el código                    |

---

_Documento generado para el equipo técnico. Actualizar si cambia la versión de QZ Tray
o la configuración del terminal._
