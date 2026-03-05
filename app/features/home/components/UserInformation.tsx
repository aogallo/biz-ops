import { FileText } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface UserInformationProps {
  userName: string
  companyName: string
}

export default function UserInformation({
  userName,
  companyName,
}: UserInformationProps) {
  return (
    <Card>
      <CardContent className='p-8'>
        <h2 className='text-3xl font-bold'>
          Welcome, {userName} 👋
        </h2>
        <p className='text-muted-foreground mt-1'>Company: {companyName}</p>
        <Button asChild className='mt-6'>
          <Link to='/reports'>
            <FileText className='mr-2 h-4 w-4' />
            Daily Report
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
