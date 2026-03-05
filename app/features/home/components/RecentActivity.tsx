import { FileText, PlusCircle, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface Activity {
  id: string
  icon: 'invoice' | 'payment' | 'client'
  title: string
  subtitle: string
  time: string
}

interface RecentActivityProps {
  activities: Activity[]
}

const iconMap = {
  invoice: PlusCircle,
  payment: FileText,
  client: UserPlus,
}

const iconColors = {
  invoice: 'text-green-500 bg-green-100',
  payment: 'text-blue-500 bg-blue-100',
  client: 'text-purple-500 bg-purple-100',
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-3'>
        <CardTitle className='text-base font-semibold'>Recent Activity</CardTitle>
        <Button variant='link' asChild className='h-auto p-0'>
          <Link to='/reports'>View all</Link>
        </Button>
      </CardHeader>
      <CardContent className='space-y-1 p-4 pt-0'>
        {activities.map((activity) => {
          const Icon = iconMap[activity.icon]
          const colorClass = iconColors[activity.icon]
          return (
            <div
              key={activity.id}
              className='flex items-center justify-between rounded-md px-2 py-3'
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${colorClass}`}
                >
                  <Icon className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-sm font-medium'>{activity.title}</p>
                  <p className='text-muted-foreground text-xs'>{activity.subtitle}</p>
                </div>
              </div>
              <span className='text-muted-foreground text-xs whitespace-nowrap'>
                {activity.time}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
