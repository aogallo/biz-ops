import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

interface TrendData {
  date: string
  entries: number
  exits: number
  adjustments: number
}

interface Props {
  data: TrendData[]
}

export function MovementTrendsChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    Entries: Number(d.entries),
    Exits: Number(d.exits),
    Adjustments: Number(d.adjustments),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movement Trends</CardTitle>
        <CardDescription>Stock entries vs exits over time</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>No movements in selected period</p>
        ) : (
          <ResponsiveContainer width='100%' height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='date' tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type='monotone' dataKey='Entries' stroke='#10b981' strokeWidth={2} dot={{ r: 3 }} />
              <Line type='monotone' dataKey='Exits' stroke='#ef4444' strokeWidth={2} dot={{ r: 3 }} />
              <Line type='monotone' dataKey='Adjustments' stroke='#6366f1' strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
