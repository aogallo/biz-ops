import { useTranslation } from '~/i18n/context'
import type { ReceiptData } from './PosReceiptPreview'

interface PosReceiptContentProps {
  receipt: ReceiptData
}

/**
 * The visual receipt content — shared between PosReceiptPreview (dialog)
 * and the hidden DOM node used for window.print() auto-print.
 */
export function PosReceiptContent({ receipt }: PosReceiptContentProps) {
  const { t } = useTranslation()

  const totalReceived = receipt.payments.reduce(
    (sum, p) => sum + (p.receivedAmount !== null ? Number(p.receivedAmount) : 0),
    0
  )
  const totalChange = receipt.payments.reduce(
    (sum, p) => sum + (p.changeAmount !== null ? Number(p.changeAmount) : 0),
    0
  )
  const hasCashPayment = receipt.payments.some(
    (p) => p.receivedAmount !== null && Number(p.receivedAmount) > 0
  )

  return (
    <div id='pos-receipt' className='space-y-3 font-mono text-xs'>
      {/* Header */}
      <div className='text-center'>
        <p className='text-sm font-bold'>{t('pos.saleReceipt')}</p>
        <p>{receipt.saleNumber}</p>
        <p>{receipt.date}</p>
      </div>

      {/* Terminal / cashier / customer */}
      <div className='border-t border-dashed pt-2'>
        <p>
          {t('pos.terminal')}: {receipt.terminalName}
        </p>
        <p>
          {t('pos.cashier')}: {receipt.cashierName}
        </p>
        <p>
          {t('pos.customer')}:{' '}
          {receipt.customerName ?? t('pos.defaultCustomer')}
        </p>
        {receipt.customerNit && <p>NIT: {receipt.customerNit}</p>}
      </div>

      {/* Products */}
      <div className='border-t border-dashed pt-2'>
        <div className='mb-1 flex justify-between font-bold'>
          <span>{t('pos.product')}</span>
          <span>{t('pos.total')}</span>
        </div>
        {receipt.lines.map((line, i) => (
          <div key={i} className='mb-1'>
            <p>{line.productName}</p>
            <div className='flex justify-between'>
              <span>
                {Number(line.quantity)} x Q{Number(line.unitPrice).toFixed(2)}
              </span>
              <span>Q{Number(line.total).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className='border-t border-dashed pt-2'>
        <div className='flex justify-between'>
          <span>{t('pos.subtotal')}</span>
          <span>Q{Number(receipt.subtotal).toFixed(2)}</span>
        </div>
        {Number(receipt.discountAmount) > 0 && (
          <div className='flex justify-between'>
            <span>{t('pos.discount')}</span>
            <span>-Q{Number(receipt.discountAmount).toFixed(2)}</span>
          </div>
        )}
        <div className='flex justify-between'>
          <span>IVA</span>
          <span>Q{Number(receipt.ivaAmount).toFixed(2)}</span>
        </div>
        <div className='flex justify-between text-sm font-bold'>
          <span>{t('pos.total')}</span>
          <span>Q{Number(receipt.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Payments */}
      <div className='border-t border-dashed pt-2'>
        <p className='mb-1 font-bold'>{t('pos.payments')}:</p>
        {receipt.payments.map((payment, i) => (
          <div key={i} className='flex justify-between'>
            <span className='capitalize'>{payment.method}</span>
            <span>Q{Number(payment.amount).toFixed(2)}</span>
          </div>
        ))}
        {hasCashPayment && (
          <>
            <div className='flex justify-between'>
              <span>{t('pos.received')}</span>
              <span>Q{totalReceived.toFixed(2)}</span>
            </div>
            <div className='flex justify-between font-bold'>
              <span>{t('pos.change')}</span>
              <span>Q{totalChange.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className='border-t border-dashed pt-2 text-center'>
        <p>{t('pos.thankYou')}</p>
      </div>
    </div>
  )
}
