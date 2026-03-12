import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import type { CalendarView } from '../types'

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
}

function getHeaderTitle(date: Date, view: CalendarView): string {
  if (view === 'month') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  if (view === 'day') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }
  // Week view - show date range
  const dayOfWeek = date.getDay()
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - dayOfWeek)
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)

  const startMonth = sunday.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = saturday.toLocaleDateString('en-US', { month: 'short' })
  const year = sunday.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${sunday.getDate()} - ${saturday.getDate()}, ${year}`
  }
  return `${startMonth} ${sunday.getDate()} - ${endMonth} ${saturday.getDate()}, ${year}`
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onNavigate,
}: CalendarHeaderProps) {
  const views: CalendarView[] = ['day', 'week', 'month']

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      {/* Left section: Add button and title */}
      <div className='flex items-center gap-4'>
        <Link to='/appointments/new'>
          <Button size='icon' variant='outline' className='rounded-full'>
            <Plus className='size-5' />
          </Button>
        </Link>
        <h1 className='text-2xl font-bold'>
          {getHeaderTitle(currentDate, view)}
        </h1>
      </div>

      {/* Center section: View toggle */}
      <div className='flex items-center gap-2'>
        <div className='bg-muted/30 flex rounded-lg border p-1'>
          {views.map((v) => (
            <button
              key={v}
              type='button'
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                view === v
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onViewChange(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Right section: Navigation and search */}
      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' onClick={() => onNavigate('today')}>
          Today
        </Button>
        <div className='flex items-center'>
          <Button
            variant='ghost'
            size='icon'
            className='size-8'
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className='size-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='size-8'
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className='size-4' />
          </Button>
        </div>
        <Button variant='ghost' size='icon' className='size-8'>
          <Search className='size-4' />
        </Button>
      </div>
    </div>
  )
}
