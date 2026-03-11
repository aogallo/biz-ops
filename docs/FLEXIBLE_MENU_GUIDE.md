# Guía: Sistema de Menú Flexible — ERP POS

## Visión general

El POS soporta **tres mecanismos distintos** para manejar variedad de productos. Elegir el correcto depende del caso de negocio, no de la tecnología.

```
¿Mismo producto, opciones que modifican precio?  →  VARIANTES (attributesJson)
¿Varios productos vendidos juntos como menú?      →  COMBO
¿Producto que consume ingredientes del inventario? →  RECETA
```

---

## 1. Variantes de producto (atributos)

### ¿Cuándo usarlo?

El **mismo SKU** con opciones que el cliente elige al momento de la venta. Las opciones pueden o no modificar el precio base.

**Ejemplos:**
- Hamburguesa → Tamaño: Sencilla / Con Queso (+Q5) / Doble (+Q10)
- Pizza → Masa: Normal / Delgada
- Café → Temperatura: Frío / Caliente

### Cómo configurarlo

1. Ir a **Productos → Editar** cualquier producto de tipo `STOCK`, `MADE_TO_ORDER` o `SERVICE`
2. En la sección **Atributos / Variantes**, clic en `Añadir atributo`
3. Escribir el nombre del atributo (ej: `Tamaño`)
4. Hacer clic en `Añadir opción` y configurar cada opción con su ajuste de precio

```
Atributo: "Tamaño"
  ├─ Sencilla       → +Q 0.00
  ├─ Con Queso      → +Q 5.00
  └─ Doble          → +Q 10.00
```

### Comportamiento en POS

- La cajera hace clic en el producto
- Se abre un **diálogo de selección** con botones por cada opción
- El precio final = precio base + ajuste de la opción elegida
- La selección queda registrada en la línea de venta

### Esquema JSON almacenado

```json
{
  "attributes": [
    {
      "name": "Tamaño",
      "key": "tamano",
      "type": "button",
      "values": [
        { "label": "Sencilla",   "priceAdjustment": 0  },
        { "label": "Con Queso",  "priceAdjustment": 5  },
        { "label": "Doble",      "priceAdjustment": 10 }
      ]
    }
  ]
}
```

---

## 2. Recetas

### ¿Cuándo usarlo?

Un producto elaborado que **consume ingredientes del inventario** cuando se vende. El precio de venta lo define el dueño del negocio — no es la suma de ingredientes.

**Ejemplos:**
- Hamburguesa Casera → consume: 1 pan, 200g carne, 2 rodajas tomate
- Ensalada César → consume: 100g lechuga, 50g pollo, 20g aderezo
- Jugo Natural → consume: 3 naranjas, 0.5 tazas de agua

### Tipos de producto involucrados

| Tipo | Descripción |
|------|-------------|
| `ingredient` | Materia prima. No aparece en el POS. Solo se usa como insumo. |
| `recipe` | Producto elaborado. Aparece en POS. Al venderse, descuenta sus ingredientes. |

### Cómo configurarlo

**Paso 1 — Crear los ingredientes:**
1. Crear producto, tipo = `Ingrediente`
2. Configurar stock y unidad de medida
3. El ingrediente **no aparecerá en el grid del POS**

**Paso 2 — Crear la receta:**
1. Crear producto, tipo = `Receta`
2. Asignar el **precio de venta** del plato terminado
3. En la sección **Ingredientes de la receta**, agregar cada insumo con su cantidad

```
Producto: "Hamburguesa Casera"  →  Tipo: Receta  →  Precio: Q45.00
  Ingredientes:
  ├─ Pan de hamburguesa    × 1 unidad
  ├─ Carne molida          × 200 g
  ├─ Lechuga               × 30 g
  └─ Tomate                × 2 rodajas
```

### Comportamiento en POS

- La cajera hace clic en el producto → **se agrega directamente al carrito** (sin diálogo)
- Al completar la venta, el sistema descuenta automáticamente cada ingrediente del inventario
- Si algún ingrediente es a su vez una receta, se expande recursivamente

### Lógica de inventario

```
Venta de 1 Hamburguesa Casera
  → descuenta: 1 pan, 200g carne, 30g lechuga, 2 rodajas tomate

Venta de 2 Hamburguesas Caseras
  → descuenta: 2 panes, 400g carne, 60g lechuga, 4 rodajas tomate
```

Si un ingrediente tiene `trackInventory = false`, se omite del descuento.

---

## 3. Combos / Menús

### ¿Cuándo usarlo?

Un menú que **agrupa múltiples productos distintos** donde la cajera elige entre opciones por cada grupo. El cliente paga una sola línea de precio.

**Ejemplos:**
- Combo #1 → [Hamburguesa] + [Bebida: Agua / Coca / Jugo] + [Acompañamiento: Papas / Ensalada]
- Menú del día → [Sopa] + [Plato fuerte] + [Postre: Flan / Fruta]
- Combo familiar → [2 pizzas] + [Bebida grande]

### Estructura de datos

```
Combo "Menú del Día"  (productType = 'combo')
  │
  ├─ Grupo "Plato fuerte"  (minSelect=1, maxSelect=1, isRequired=true)
  │    ├─ Pollo asado         → +Q 0.00
  │    ├─ Carne a la plancha  → +Q 5.00
  │    └─ Pasta               → +Q 0.00
  │
  ├─ Grupo "Bebida"  (minSelect=1, maxSelect=1, isRequired=true)
  │    ├─ Agua                → +Q 0.00
  │    ├─ Refresco            → +Q 3.00
  │    └─ Jugo natural        → +Q 5.00
  │
  └─ Grupo "Postre"  (minSelect=0, maxSelect=1, isRequired=false)
       ├─ Flan                → +Q 0.00
       └─ Fruta               → +Q 0.00
```

### Cómo configurarlo

1. Crear producto, tipo = `Combo / Menú`
2. Asignar el **precio base del combo**
3. En la sección **Grupos del combo**, agregar cada grupo:
   - Nombre del grupo
   - Mínimo de selecciones (0 = opcional, 1+ = obligatorio)
   - Máximo de selecciones por grupo
   - Los productos disponibles en ese grupo con su ajuste de precio

### Comportamiento en POS

- La cajera hace clic en el combo → **se abre el diálogo de personalización**
- Por cada grupo, la cajera selecciona la opción del cliente
- Los grupos obligatorios se validan antes de confirmar
- El precio final = precio base + suma de ajustes de opciones elegidas
- Se agrega al carrito como **una línea padre + líneas hijas**

### Representación en el carrito

```
Carrito:
  [COMBO]  Menú del Día                Q45.00  ×1
    [ITEM]   Carne a la plancha        Q0.00   (incluido en combo +5)
    [ITEM]   Refresco                  Q0.00   (incluido en combo +3)
    [ITEM]   Flan                      Q0.00   (incluido en combo)
```

Las líneas hijas tienen precio `Q0.00` — el precio total está en la línea padre.

### Lógica de inventario para combos

```
Combo vendido (lineType='combo')          → NUNCA descuenta inventario directamente
Item del combo (lineType='combo_item')
  → si el item es tipo RECIPE             → expande ingredientes → descuenta cada uno
  → si el item es tipo STOCK/MTO          → descuenta el producto directamente
  → si trackInventory = false             → omite
```

---

## Tabla de decisión rápida

| Situación | Mecanismo | Tipo de producto |
|-----------|-----------|-----------------|
| Producto con tallas / colores | Variantes | STOCK o MTO + attributesJson |
| Opciones con precio diferente (mismo producto) | Variantes | STOCK o MTO + attributesJson |
| Menú con varios productos a elegir | Combo | `combo` |
| Precio único que incluye múltiples items | Combo | `combo` |
| Plato que descuenta ingredientes del almacén | Receta | `recipe` |
| Materia prima / insumo (no se vende directo) | Ingrediente | `ingredient` |
| Item de servicio sin inventario | Servicio | `SERVICE` |

---

## Flujo completo de una venta

```
Cajera hace clic en producto
        │
        ▼
¿Tipo = combo?
  ├─ SÍ → Abre PosComboSelectionDialog
  │         → Cajera elige opciones por grupo
  │         → Confirma → carrito: 1 línea padre + N líneas hijas
  │
  └─ NO → ¿Tiene attributesJson.attributes?
             ├─ SÍ → Abre PosProductAttributesDialog
             │         → Cajera elige variante
             │         → Confirma → carrito: 1 línea con selectedAttributes
             │
             └─ NO → Agrega directo al carrito: 1 línea simple

Al hacer checkout:
  → resolveInventoryDecrements() procesa cada línea
  → Descuenta inventario según reglas de lineType + productType + trackInventory
  → Registra movimiento de inventario por sucursal
```

---

## Configuración paso a paso — Caso real: Restaurante

### Escenario: "Hamburguesería Don Pepe"

```
1. Ingredientes (no aparecen en POS):
   - Carne molida          (STOCK, trackInventory=true)
   - Pan hamburguesa       (STOCK, trackInventory=true)
   - Lechuga               (STOCK, trackInventory=true)
   - Queso cheddar         (STOCK, trackInventory=true)
   - Coca Cola 350ml       (STOCK, trackInventory=true)
   - Agua pura 500ml       (STOCK, trackInventory=true)

2. Recetas (aparecen en POS, descuentan ingredientes):
   - Hamburguesa Clásica   (recipe, precio Q45)
       → 1 pan, 200g carne, 30g lechuga
   - Hamburguesa con Queso (recipe, precio Q52)
       → 1 pan, 200g carne, 30g lechuga, 2 láminas queso

3. Producto con variantes:
   - Café                  (MADE_TO_ORDER, precio base Q15)
       → Atributo "Tamaño": Pequeño Q0 / Mediano +Q5 / Grande +Q10
       → Atributo "Temperatura": Frío Q0 / Caliente Q0

4. Combos:
   - Combo Familiar        (combo, precio Q120)
       → Grupo "Hamburguesa" (obligatorio, elegir 1):
           Hamburguesa Clásica Q0 / Hamburguesa con Queso +Q7
       → Grupo "Bebida" (obligatorio, elegir 1):
           Agua Q0 / Coca Cola +Q5
       → Grupo "Extra" (opcional, elegir hasta 2):
           Papas fritas +Q10 / Aros de cebolla +Q12
```

---

## Puntos clave al presentar

1. **Un combo no es lo mismo que variantes** — el combo agrupa productos distintos; las variantes modifican el mismo producto.

2. **Los ingredientes son invisibles en el POS** — se excluyen automáticamente del grid de venta.

3. **El precio de una receta lo define el dueño** — no es la suma de ingredientes. Los ingredientes tienen precio para calcular costo (COGS), no para definir el precio de venta.

4. **Cada click en un combo abre el diálogo** — es correcto para combos personalizables. Para aumentar cantidad del mismo combo configurado igual, usar los controles +/- del carrito.

5. **El inventario se descuenta al confirmar la venta** — no al agregar al carrito.

6. **Recetas anidadas funcionan** — si un ingrediente es a su vez una receta, el sistema expande recursivamente hasta llegar a los insumos base.

---

## Referencias de código

| Archivo | Rol |
|---------|-----|
| `app/server/db/schemas/combo.ts` | Esquema DB: combo → grupos → items |
| `app/server/db/schemas/recipe.ts` | Esquema DB: receta → items con ingredientes |
| `app/server/db/schemas/products.ts` | Enum `productTypeEnum`, campo `trackInventory` |
| `app/features/combo/server/repository.ts` | `findByProductId()`, `getComboForPos()`, `upsertCombo()` |
| `app/features/recipe/server/repository.ts` | `findByProductId()`, `expandRecipeToIngredients()`, `upsertRecipe()` |
| `app/features/pos/server/utils/inventory-resolver.ts` | Lógica de descuento de inventario por lineType |
| `app/features/pos/components/PosComboSelectionDialog.tsx` | Diálogo de personalización de combos en POS |
| `app/features/pos/components/PosProductAttributesDialog.tsx` | Diálogo de selección de variantes en POS |
| `app/features/products/components/RecipeBuilder.tsx` | Editor de ingredientes en admin |
| `app/features/products/components/ComboBuilder.tsx` | Editor de grupos de combo en admin |
| `app/routes/products/edit.tsx` | Integración de builders en la edición de productos |
| `app/routes/pos/terminal.tsx` | Lógica de click, carrito, y checkout en el terminal POS |
