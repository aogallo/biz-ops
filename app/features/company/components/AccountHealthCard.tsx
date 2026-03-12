import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import CircularProgress from './CircularProgress'

type StatusType = 'success' | 'warning' | 'error'

interface StatusItemProps {
  status: StatusType
  text: string
}

const StatusItem = ({ status, text }: StatusItemProps) => {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className='size-4 text-green-500' />
      case 'warning':
        return <AlertTriangle className='size-4 text-amber-500' />
      case 'error':
        return <AlertTriangle className='size-4 text-red-500' />
    }
  }

  return (
    <li className='text-foreground flex items-center gap-2 text-sm'>
      {getIcon()}
      {text}
    </li>
  )
}

interface AccountHealthCardProps {
  score?: number
  maxScore?: number
  items?: Array<{ status: StatusType; text: string }>
}

const AccountHealthCard = ({
  score = 88,
  maxScore = 100,
  items = [
    { status: 'success', text: 'Tax compliance verified' },
    { status: 'success', text: 'KYC documents up to date' },
    { status: 'warning', text: 'Insurance expires in 12 days' },
  ],
}: AccountHealthCardProps) => {
  const getStatusText = (score: number) => {
    if (score >= 80) return 'EXCELLENT STATUS'
    if (score >= 60) return 'GOOD STATUS'
    if (score >= 40) return 'FAIR STATUS'
    return 'NEEDS ATTENTION'
  }

  return (
    <Card className='gap-4 border-cyan-100 bg-cyan-50 py-4 dark:border-cyan-900 dark:bg-cyan-950/30'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xs font-bold tracking-wider text-cyan-600 uppercase dark:text-cyan-400'>
          Account Health
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center gap-4'>
          <CircularProgress value={score} max={maxScore} />
          <div className='space-y-1'>
            <p className='text-foreground text-2xl font-bold'>
              {score}/{maxScore}
            </p>
            <p className='text-xs font-semibold tracking-wider text-cyan-600 dark:text-cyan-400'>
              {getStatusText(score)}
            </p>
          </div>
        </div>
        <ul className='space-y-2'>
          {items.map((item, index) => (
            <StatusItem key={index} status={item.status} text={item.text} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default AccountHealthCard
