import type { ReceiptData } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type T = (key: any, params?: any) => string

export function buildReceiptHtml(receipt: ReceiptData, t: T): string {
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

  const sep = `<hr style="border:none;border-top:1px dashed #000;margin:6px 0;" />`
  const row = (label: string, value: string, bold = false) =>
    `<div style="display:flex;justify-content:space-between;${bold ? 'font-weight:bold;' : ''}margin-bottom:2px;">
      <span>${label}</span><span>${value}</span>
    </div>`

  const linesHtml = receipt.lines
    .map(
      (line) =>
        `<div style="margin-bottom:5px;">
      <div>${line.productName}</div>
      ${
        line.modifications?.length
          ? `<div style="font-size:10px;opacity:0.75;">${line.modifications.map((m) => `· Sin ${m}`).join(' ')}</div>`
          : ''
      }
      <div style="display:flex;justify-content:space-between;">
        <span>${Number(line.quantity)} x Q${Number(line.unitPrice).toFixed(2)}</span>
        <span>Q${Number(line.total).toFixed(2)}</span>
      </div>
    </div>`
    )
    .join('')

  const paymentsHtml = receipt.payments
    .map((p) =>
      row(
        p.method.charAt(0).toUpperCase() + p.method.slice(1),
        `Q${Number(p.amount).toFixed(2)}`
      )
    )
    .join('')

  const cashHtml = hasCashPayment
    ? row(t('pos.received'), `Q${totalReceived.toFixed(2)}`) +
      row(t('pos.change'), `Q${totalChange.toFixed(2)}`, true)
    : ''

  const discountHtml =
    Number(receipt.discountAmount) > 0
      ? row(t('pos.discount'), `-Q${Number(receipt.discountAmount).toFixed(2)}`)
      : ''

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title></title>
    <style>
      @page { margin: 0; size: 80mm auto; }
      body { font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: bold; color: #000; background: #fff; margin: 0; padding: 4mm 2mm; }
    </style>
  </head>
  <body>
    <div style="text-align:center;margin-bottom:6px;">
      <div style="font-size:13px;font-weight:bold;">${t('pos.saleReceipt')}</div>
      <div>${receipt.saleNumber}</div>
      <div>${receipt.date}</div>
    </div>
    ${sep}
    <div style="margin-bottom:6px;">
      <div>${t('pos.terminal')}: ${receipt.terminalName ?? ''}</div>
      <div>${t('pos.cashier')}: ${receipt.cashierName ?? ''}</div>
      <div>${t('pos.customer')}: ${receipt.customerName ?? t('pos.defaultCustomer')}</div>
      ${receipt.customerNit ? `<div>NIT: ${receipt.customerNit}</div>` : ''}
    </div>
    ${sep}
    <div style="display:flex;justify-content:space-between;font-weight:bold;margin-bottom:4px;">
      <span>${t('pos.product')}</span><span>${t('pos.total')}</span>
    </div>
    ${linesHtml}
    ${sep}
    ${row(t('pos.subtotal'), `Q${Number(receipt.subtotal).toFixed(2)}`)}
    ${discountHtml}
    ${row('IVA', `Q${Number(receipt.ivaAmount).toFixed(2)}`)}
    ${row(t('pos.total'), `Q${Number(receipt.total).toFixed(2)}`, true)}
    ${sep}
    <div style="font-weight:bold;margin-bottom:4px;">${t('pos.payments')}:</div>
    ${paymentsHtml}
    ${cashHtml}
    ${sep}
    <div style="text-align:center;margin-top:6px;">${t('pos.thankYou')}</div>
    <div style="height:40mm;"></div>
  </body>
</html>`
}

export function printWithIframe(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:80mm;height:297mm;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }
  doc.open()
  doc.write(html)
  doc.close()
  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }, 300)
}
