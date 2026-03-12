import { Progress } from '~/components/ui/progress'

interface Branch {
  name: string
  users: number
  percentage: number
}

interface BranchDistributionProps {
  branches?: Branch[]
}

const BranchDistribution = ({
  branches = [
    { name: 'Headquarters', users: 45, percentage: 45 },
    { name: 'North Branch', users: 28, percentage: 28 },
    { name: 'South Branch', users: 18, percentage: 18 },
    { name: 'East Branch', users: 9, percentage: 9 },
  ],
}: BranchDistributionProps) => {
  return (
    <section className='space-y-3'>
      <h4 className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
        Branch Distribution
      </h4>
      <div className='space-y-4'>
        {branches.map((branch) => (
          <div key={branch.name} className='space-y-1.5'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-foreground'>{branch.name}</span>
              <span className='text-foreground font-semibold'>
                {branch.users} users
              </span>
            </div>
            <Progress
              value={branch.percentage}
              className='bg-muted h-2 [&>div]:bg-teal-500'
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default BranchDistribution
