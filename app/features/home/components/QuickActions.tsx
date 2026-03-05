import { FileText, PlusCircle, Receipt, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

const actions = [
  { icon: Receipt, label: 'Create invoice', href: '/invoices/new' },
  { icon: FileText, label: 'Record payment', href: '/journal-entries/new' },
  { icon: UserPlus, label: 'Create client', href: '/business-partners/new' },
  { icon: PlusCircle, label: 'Create expense', href: '/purchase/orders/new' },
]

export default function QuickActions() {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base font-semibold'>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className='space-y-1 p-4 pt-0'>
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              to={action.href}
              className='hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 transition-colors'
            >
              <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded'>
                <Icon className='text-primary h-4 w-4' />
              </div>
              <span className='text-sm font-medium'>{action.label}</span>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
