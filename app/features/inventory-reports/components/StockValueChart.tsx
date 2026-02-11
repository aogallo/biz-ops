import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

interface CategoryData {
  categoryName: string
  categoryColor: string | null
  totalValue: number
  productCount: number
}

interface Props {
  data: CategoryData[]
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export function StockValueChart({ data }: Props) {
  const chartData = data.map((d, i) => ({
    name: d.categoryName,
    value: Number(d.totalValue),
    products: d.productCount,
    fill: COLORS[i % COLORS.length],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Value by Category</CardTitle>
        <CardDescription>Total inventory value grouped by product category</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>No data available</p>
        ) : (
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={chartData} layout='vertical' margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray='3 3' horizontal={false} />
              <XAxis type='number' tickFormatter={(v) => `Q${v.toLocaleString()}`} />
              <YAxis type='category' dataKey='name' width={120} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`Q${Number(value).toLocaleString()}`, 'Value']}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey='value' radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
