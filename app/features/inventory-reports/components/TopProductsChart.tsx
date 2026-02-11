import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

interface TopProduct {
  productName: string
  productSku: string
  totalMovements: number
  totalEntries: number
  totalExits: number
}

interface Props {
  data: TopProduct[]
}

export function TopProductsChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.productName.length > 15 ? `${d.productName.slice(0, 15)}...` : d.productName,
    Entries: Number(d.totalEntries),
    Exits: Number(d.totalExits),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Active Products</CardTitle>
        <CardDescription>Products with the most stock movements</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>No movement data available</p>
        ) : (
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={chartData} layout='vertical' margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray='3 3' horizontal={false} />
              <XAxis type='number' allowDecimals={false} />
              <YAxis type='category' dataKey='name' width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey='Entries' fill='#10b981' radius={[0, 4, 4, 0]} stackId='a' />
              <Bar dataKey='Exits' fill='#ef4444' radius={[0, 4, 4, 0]} stackId='a' />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
