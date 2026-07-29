import {
  FileText,
  PlusCircle,
  Receipt,
  ShoppingCart,
  UserPlus,
} from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import type { QuickAction } from '../server/actions/get-quick-actions.action'

const iconMap: Record<string, React.ElementType> = {
  FileText,
  PlusCircle,
  Receipt,
  ShoppingCart,
  UserPlus,
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base font-semibold'>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className='space-y-1 p-4 pt-0'>
        {actions.map((action) => {
          const Icon = iconMap[action.icon] || FileText
          return (
            <Link
              key={action.id}
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
        {actions.length === 0 && (
          <p className='text-muted-foreground px-3 py-2 text-sm'>
            No actions available
          </p>
        )}
      </CardContent>
    </Card>
  )
}
