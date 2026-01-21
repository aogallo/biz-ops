interface CurrencyProps {
  value: number
}

const Currency = ({ value }: CurrencyProps) => {
  const formatter = new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  })
  return (
    <span className='text-foreground text-xl font-extrabold'>
      {formatter.format(value)}
    </span>
  )
}

export default Currency
