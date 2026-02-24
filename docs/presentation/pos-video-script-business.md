# Script de Video — POS No Técnico

**Duración objetivo**: ~4 minutos
**Narrador**: Tono amigable, conversacional, en español rioplatense
**Formato**: Screen recording + voiceover
**Resolución recomendada**: 1920×1080, 30fps

---

## SETUP ANTES DE GRABAR

**Pantallas a tener preparadas**:

- [ ] `/pos` — Selección de terminal (con terminales configuradas)
- [ ] `/pos/terminal?terminalId=[id]` — Grilla de productos con categorías
- [ ] Carrito con al menos 3 productos
- [ ] Diálogo de pago (PaymentDialog) con split efectivo + tarjeta
- [ ] Preview de recibo
- [ ] Z-Report de turno cerrado
- [ ] `/pos/sales` — Historial de ventas con datos

**Datos de prueba sugeridos**:

- Productos: Taco de pastor ($45), Agua mineral ($25), Orden de guacamole ($35)
- Cliente: "Juan García" o "Mesa 5"
- Pago: $70 efectivo + $35 tarjeta

---

## SCRIPT

---

### [0:00 – 0:15] INTRO

**[Pantalla: Logo o pantalla inicial]**

> "Hola. Hoy te voy a mostrar el sistema POS que diseñamos especialmente para tu taquería."
>
> "En menos de 4 minutos vas a ver cómo funciona: desde que el cajero abre el turno, hasta que se cierra la caja al final del día."
>
> "¿Arrancamos?"

---

### [0:15 – 0:45] APERTURA DE TURNO

**[Navegar a: `/pos` — pantalla de selección de terminal]**

> "Lo primero que hace el cajero al empezar su turno es seleccionar su terminal."
>
> "Acá ves que el sistema tiene múltiples terminales configuradas. Cada cajero trabaja en la suya."

**[Click en una terminal → aparece diálogo de apertura de turno]**

> "Al abrir el turno, registra cuánto efectivo hay en la caja para empezar el día."
>
> "Simple. Un número, y listo. El sistema ya sabe desde dónde arranca."

**[Confirmar apertura → entrar a la terminal]**

---

### [0:45 – 1:30] HACER UNA VENTA — PRODUCTOS

**[Pantalla: grilla de productos del POS]**

> "Ahora estamos en la pantalla principal del cajero."
>
> "Acá ve todos los productos disponibles. Puede buscar por nombre, o filtrar por categoría —"

**[Click en categoría "Tacos"]**

> "— entradas, tacos, bebidas, postres. Lo que tenga la taquería."

**[Click en producto "Taco de pastor"]**

> "Con un solo clic, el producto entra al carrito."

**[Agregar más productos]**

> "Agregamos una agua mineral... y una orden de guacamole."
>
> "Fijate que el sistema está calculando el total en tiempo real. Sin errores, sin calculadora."

---

### [1:30 – 2:00] CLIENTE Y PAGO

**[Pantalla: sección de cliente en el carrito]**

> "Si el cliente está registrado, lo buscamos por nombre o por su NIT."

**[Escribir "Juan" en búsqueda → aparece resultado]**

> "Apareció al toque. Y si es un cliente nuevo, lo creamos en el momento, sin salir de la venta."

**[Click en "Cobrar" → abre PaymentDialog]**

> "Cuando el pedido está listo, tocamos Cobrar."

**[Pantalla: diálogo de pago con opciones]**

> "Y acá viene lo bueno: podés cobrar con efectivo, tarjeta, cheque... o combinar varios métodos en una sola venta."

**[Ingresar $70 efectivo + $35 tarjeta]**

> "Por ejemplo: setenta en efectivo y treinta y cinco con tarjeta."
>
> "El sistema calcula el cambio automáticamente. Sin errores. Sin discusiones."

**[Confirmar pago]**

---

### [2:00 – 2:30] RECIBO

**[Pantalla: recibo generado]**

> "Al completar la venta, el recibo aparece al instante."
>
> "Tiene el detalle de todos los productos, los precios, el método de pago, y el cambio entregado."
>
> "Listo para imprimir o compartir con el cliente."

---

### [2:30 – 3:15] CIERRE DE TURNO Y Z-REPORT

**[Navegar a opción de cierre de turno → CloseShiftDialog]**

> "Al final del día, el cajero cierra su turno."
>
> "Cuenta el efectivo que tiene en caja y lo ingresa acá."

**[Ingresar monto de efectivo]**

**[Confirmar cierre → mostrar Z-Report]**

> "Y el sistema genera automáticamente el Z-Report."
>
> "Acá ves el resumen completo del turno: total de ventas, cuánto fue efectivo, cuánto fue tarjeta..."
>
> "Y lo más importante: si hay diferencia entre lo que debería haber en la caja y lo que realmente hay."

**[Señalar sección de diferencia en el Z-Report]**

> "Todo en segundos. Sin hojas de Excel. Sin calculadora."

---

### [3:15 – 3:45] HISTORIAL DE VENTAS

**[Navegar a: `/pos/sales`]**

> "¿Necesitás ver una venta de la semana pasada? ¿O confirmar si un cliente pagó?"
>
> "Toda la historia está acá."

**[Usar filtros de fecha o terminal]**

> "Filtrás por fecha, por terminal, por cliente... y en segundos tenés lo que buscás."

**[Click en una venta → ver detalle]**

> "El detalle completo de cada transacción. Qué se vendió, cuánto se cobró, cómo se pagó."

---

### [3:45 – 4:00] CIERRE

**[Volver a pantalla principal o logo]**

> "Eso es todo."
>
> "Un sistema diseñado para que vos y tu equipo trabajen más rápido, con menos errores, y con toda la información que necesitás — siempre a mano."
>
> "¿Cuándo empezamos?"

---

## NOTAS DE PRODUCCIÓN

**Edición**:

- Agregar subtítulos si se distribuye sin audio
- Usar zoom suave en elementos clave (botones, totales, Z-Report)
- Música de fondo: suave, instrumental, volumen 20%

**Pantallas a capturar como screenshots estáticos** (para el deck):

- [x] Selección de terminal
- [x] Grilla de productos con categoría seleccionada
- [x] Carrito con 3 productos y total
- [x] PaymentDialog con split de pago
- [x] Recibo generado
- [x] Z-Report completo
- [x] Historial de ventas con filtros
