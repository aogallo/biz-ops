import { AlertTriangle, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface PendingProps {
  overdueInvoices: number | null
  pendingPayables: number | null
  pendingPayablesDueDays: number | null
}

export default function Pending({
  overdueInvoices,
  pendingPayables,
  pendingPayablesDueDays,
}: PendingProps) {
  const hasOverdue = overdueInvoices !== null && overdueInvoices > 0
  const hasPayables = pendingPayables !== null && pendingPayables > 0
  const allClear =
    (overdueInvoices === null || overdueInvoices === 0) &&
    (pendingPayables === null || pendingPayables === 0)

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base font-semibold'>Pending</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 p-4 pt-0'>
        {hasOverdue && (
          <Link to='/invoices?status=overdue'>
            <div className='bg-destructive/10 hover:bg-destructive/15 flex items-start gap-3 rounded-lg p-3 transition-colors'>
              <AlertTriangle className='text-destructive mt-0.5 h-4 w-4 shrink-0' />
              <div>
                <p className='text-destructive text-sm font-semibold'>
                  {overdueInvoices} overdue invoice
                  {overdueInvoices! > 1 ? 's' : ''}
                </p>
                <p className='text-muted-foreground text-xs'>
                  Requires immediate attention to avoid charges.
                </p>
              </div>
            </div>
          </Link>
        )}
        {hasPayables && (
          <Link to='/purchase/orders'>
            <div className='bg-warning/10 hover:bg-warning/15 flex items-start gap-3 rounded-lg p-3 transition-colors'>
              <Clock className='text-warning mt-0.5 h-4 w-4 shrink-0' />
              <div>
                <p className='text-warning text-sm font-semibold'>
                  {pendingPayables} pending accounts payable
                </p>
                <p className='text-muted-foreground text-xs'>
                  {pendingPayablesDueDays !== null
                    ? `Due in ${pendingPayablesDueDays} days.`
                    : 'Check due dates.'}
                </p>
              </div>
            </div>
          </Link>
        )}
        {allClear && (
          <p className='text-muted-foreground py-2 text-center text-sm'>
            No pending items. You&apos;re all caught up!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
