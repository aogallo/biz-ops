import { Receipt } from 'lucide-react'

interface InvoiceSummaryProps {
  subtotal: number
  ivaAmount: number
  total: number
  currency?: string
  lineCount?: number
  variant?: 'card' | 'inline'
}

export function InvoiceSummary({
  subtotal,
  ivaAmount,
  total,
  currency = 'GTQ',
  lineCount,
  variant = 'card',
}: InvoiceSummaryProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center justify-end gap-6 rounded-lg border bg-muted/30 px-6 py-4">
        {lineCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" />
            <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Subtotal:</span>
          <span className="font-mono text-sm">{formatAmount(subtotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">IVA (12%):</span>
          <span className="font-mono text-sm">{formatAmount(ivaAmount)}</span>
        </div>
        <div className="flex items-center gap-2 border-l pl-6">
          <span className="font-medium">Total:</span>
          <span className="font-mono text-xl font-bold text-primary">
            {formatAmount(total)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <Receipt className="h-5 w-5" />
        Invoice Summary
      </h3>
      <div className="space-y-3">
        {lineCount !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lines</span>
            <span>{lineCount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-mono">{formatAmount(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">IVA (12%)</span>
          <span className="font-mono">{formatAmount(ivaAmount)}</span>
        </div>
        <div className="border-t pt-3">
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-mono text-2xl font-bold text-primary">
              {formatAmount(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
