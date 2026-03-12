import type { ReceiptData } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type T = (key: any, params?: any) => string

const LINE_WIDTH = 48

function rowLR(left: string, right: string): string {
  const space = LINE_WIDTH - left.length - right.length
  return left + ' '.repeat(Math.max(1, space)) + right
}

function sep(): string {
  return '-'.repeat(LINE_WIDTH)
}

// ESC/POS control bytes as strings
const ESC = '\x1b'
const GS = '\x1d'

const INIT = ESC + '@'
const ALIGN_CENTER = ESC + 'a\x01'
const ALIGN_LEFT = ESC + 'a\x00'
const BOLD_ON = ESC + 'E\x01'
const BOLD_OFF = ESC + 'E\x00'
const DOUBLE_HEIGHT_ON = ESC + '!\x10'
const DOUBLE_HEIGHT_OFF = ESC + '!\x00'
const FEED_2 = ESC + 'd\x02'
const FULL_CUT = GS + 'V\x00'

export function buildEscPos(receipt: ReceiptData, t: T): string {
  const totalReceived = receipt.payments.reduce(
    (sum, p) =>
      sum + (p.receivedAmount !== null ? Number(p.receivedAmount) : 0),
    0
  )
  const totalChange = receipt.payments.reduce(
    (sum, p) => sum + (p.changeAmount !== null ? Number(p.changeAmount) : 0),
    0
  )
  const hasCashPayment = receipt.payments.some(
    (p) => p.receivedAmount !== null && Number(p.receivedAmount) > 0
  )

  const currency = receipt.currency ?? 'Q'
  const fmt = (n: number) => `${currency}${n.toFixed(2)}`

  let out = ''

  // Init
  out += INIT

  // Header (centered)
  out += ALIGN_CENTER
  out += BOLD_ON + DOUBLE_HEIGHT_ON
  out += t('pos.saleReceipt') + '\n'
  out += DOUBLE_HEIGHT_OFF + BOLD_OFF
  out += receipt.saleNumber + '\n'
  out += receipt.date + '\n'

  // Separator
  out += ALIGN_LEFT
  out += sep() + '\n'

  // Terminal / Cashier / Customer info
  out += `${t('pos.terminal')}: ${receipt.terminalName ?? ''}\n`
  out += `${t('pos.cashier')}: ${receipt.cashierName ?? ''}\n`
  out += `${t('pos.customer')}: ${receipt.customerName ?? t('pos.defaultCustomer')}\n`
  if (receipt.customerNit) {
    out += `NIT: ${receipt.customerNit}\n`
  }

  out += sep() + '\n'

  // Product header
  out += BOLD_ON
  out += rowLR(t('pos.product'), t('pos.total')) + '\n'
  out += BOLD_OFF

  // Line items
  for (const line of receipt.lines) {
    out += line.productName + '\n'
    const detail = `  ${Number(line.quantity)} x ${fmt(Number(line.unitPrice))}`
    out += rowLR(detail, fmt(Number(line.total))) + '\n'
  }

  out += sep() + '\n'

  // Totals
  out += rowLR(t('pos.subtotal'), fmt(Number(receipt.subtotal))) + '\n'

  if (Number(receipt.discountAmount) > 0) {
    out +=
      rowLR(t('pos.discount'), `-${fmt(Number(receipt.discountAmount))}`) + '\n'
  }

  out += rowLR('IVA', fmt(Number(receipt.ivaAmount))) + '\n'

  out += BOLD_ON
  out += rowLR(t('pos.total'), fmt(Number(receipt.total))) + '\n'
  out += BOLD_OFF

  out += sep() + '\n'

  // Payments
  out += BOLD_ON + t('pos.payments') + ':\n' + BOLD_OFF

  for (const p of receipt.payments) {
    const label = p.method.charAt(0).toUpperCase() + p.method.slice(1)
    out += rowLR(label, fmt(Number(p.amount))) + '\n'
  }

  if (hasCashPayment) {
    out += rowLR(t('pos.received'), fmt(totalReceived)) + '\n'
    out += BOLD_ON
    out += rowLR(t('pos.change'), fmt(totalChange)) + '\n'
    out += BOLD_OFF
  }

  out += sep() + '\n'

  // Footer
  out += ALIGN_CENTER
  out += t('pos.thankYou') + '\n'

  // Feed + cut
  out += FEED_2
  out += FULL_CUT

  return out
}
