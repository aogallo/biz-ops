import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface InvoiceSummaryProps {
  subtotal: number
  ivaAmount: number
  total: number
  currency?: string
}

export function InvoiceSummary({
  subtotal,
  ivaAmount,
  total,
  currency = 'GTQ',
}: InvoiceSummaryProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-mono">{formatAmount(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">IVA (12%)</span>
          <span className="font-mono">{formatAmount(ivaAmount)}</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="font-mono text-lg">{formatAmount(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
