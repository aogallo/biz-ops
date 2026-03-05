import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder'
import type { ReceiptData } from '../components/PosReceiptPreview'

const COLUMNS = 48 // 80mm paper at normal font size

/**
 * Encodes a receipt into ESC/POS bytes ready to send to a 3nStar thermal printer.
 * Paper: 80mm | Protocol: ESC/POS | Columns: 48 chars
 */
export function buildReceiptBytes(receipt: ReceiptData): Uint8Array {
  const encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: COLUMNS })

  const result = encoder
    .initialize()
    // ── Header ────────────────────────────────────────────────
    .align('center')
    .bold(true)
    .size(1, 2)
    .line('RECIBO DE VENTA')
    .size(1, 1)
    .bold(false)
    .line(receipt.saleNumber)
    .line(receipt.date)
    .align('left')
    .rule()
    // ── Info del turno ────────────────────────────────────────
    .line(`Terminal : ${receipt.terminalName ?? '-'}`)
    .line(`Cajero   : ${receipt.cashierName ?? '-'}`)
    .line(`Cliente  : ${receipt.customerName ?? 'Consumidor Final'}`)

  if (receipt.customerNit) {
    result.line(`NIT      : ${receipt.customerNit}`)
  }

  result.rule()

  // ── Encabezado de productos ───────────────────────────────
  result.table(
    [
      { width: 24, align: 'left' },
      { width: 8, align: 'right' },
      { width: 8, align: 'right' },
      { width: 8, align: 'right' },
    ],
    [
      ['Producto', 'Cant', 'Precio', 'Total'],
    ]
  )

  result.rule({ style: 'single' })

  // ── Líneas de productos ───────────────────────────────────
  for (const line of receipt.lines) {
    const qty = Number(line.quantity)
    const price = Number(line.unitPrice)
    const total = Number(line.total)

    result.table(
      [
        { width: 24, align: 'left' },
        { width: 8, align: 'right' },
        { width: 8, align: 'right' },
        { width: 8, align: 'right' },
      ],
      [
        [
          line.productName.substring(0, 24),
          String(qty),
          `Q${price.toFixed(2)}`,
          `Q${total.toFixed(2)}`,
        ],
      ]
    )
  }

  result.rule()

  // ── Totales ───────────────────────────────────────────────
  result.table(
    [
      { width: 24, align: 'left' },
      { width: 24, align: 'right' },
    ],
    [
      ['Subtotal', `Q${Number(receipt.subtotal).toFixed(2)}`],
    ]
  )

  if (Number(receipt.discountAmount) > 0) {
    result.table(
      [
        { width: 24, align: 'left' },
        { width: 24, align: 'right' },
      ],
      [['Descuento', `-Q${Number(receipt.discountAmount).toFixed(2)}`]]
    )
  }

  result.table(
    [
      { width: 24, align: 'left' },
      { width: 24, align: 'right' },
    ],
    [
      ['IVA (12%)', `Q${Number(receipt.ivaAmount).toFixed(2)}`],
    ]
  )

  result.rule()

  result
    .bold(true)
    .table(
      [
        { width: 24, align: 'left' },
        { width: 24, align: 'right' },
      ],
      [['TOTAL', `Q${Number(receipt.total).toFixed(2)}`]]
    )
    .bold(false)
    .rule()

  // ── Pagos ─────────────────────────────────────────────────
  result.line('Forma de pago:')

  for (const payment of receipt.payments) {
    result.table(
      [
        { width: 24, align: 'left' },
        { width: 24, align: 'right' },
      ],
      [[capitalize(payment.method), `Q${Number(payment.amount).toFixed(2)}`]]
    )
  }

  // Recibido y cambio (para pagos en efectivo)
  const totalReceived = receipt.payments.reduce(
    (sum, p) => sum + (p.receivedAmount !== null ? Number(p.receivedAmount) : 0),
    0
  )
  const totalChange = receipt.payments.reduce(
    (sum, p) => sum + (p.changeAmount !== null ? Number(p.changeAmount) : 0),
    0
  )

  if (totalReceived > 0) {
    result.table(
      [
        { width: 24, align: 'left' },
        { width: 24, align: 'right' },
      ],
      [
        ['Recibido', `Q${totalReceived.toFixed(2)}`],
        ['Cambio', `Q${totalChange.toFixed(2)}`],
      ]
    )
  }

  result
    .rule()
    .align('center')
    .line('¡Gracias por su compra!')
    .newline(4)
    .cut('partial')

  return result.encode()
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
