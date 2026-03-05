import { BarChart3, FileText, Package, Receipt } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent } from '~/components/ui/card'

const modules = [
  {
    icon: Package,
    title: 'Inventory',
    description: 'Manage products and stock efficiently.',
    href: '/inventory',
  },
  {
    icon: Receipt,
    title: 'Invoicing',
    description: 'Create and manage invoices for your clients.',
    href: '/invoices',
  },
  {
    icon: BarChart3,
    title: 'Accounting',
    description: 'Record accounting entries and general balances.',
    href: '/journal-entries',
  },
  {
    icon: FileText,
    title: 'Accounts Payable',
    description: 'Manage pending payments to your suppliers.',
    href: '/purchase/orders',
  },
]

export default function Modules() {
  return (
    <div>
      <h3 className='mb-4 text-lg font-semibold'>
        What would you like to do today?
      </h3>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {modules.map((mod) => {
          const Icon = mod.icon
          return (
            <Link key={mod.title} to={mod.href}>
              <Card className='hover:bg-accent/50 h-full transition-colors'>
                <CardContent className='p-6'>
                  <div className='bg-primary/10 mb-4 flex h-10 w-10 items-center justify-center rounded-lg'>
                    <Icon className='text-primary h-5 w-5' />
                  </div>
                  <h4 className='font-semibold'>{mod.title}</h4>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {mod.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
