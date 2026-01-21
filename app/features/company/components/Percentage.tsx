interface PercentageProps {
  value: number
}
const Percentage = ({ value }: PercentageProps) => {
  return (
    <span className='text-foreground text-xl font-extrabold'>{value}%</span>
  )
}

export default Percentage
