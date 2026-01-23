import { Lock } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

interface NoAccessMessageProps {
  /**
   * The name of the feature the user doesn't have access to
   * @example "Products", "Users", "Invitations"
   */
  featureName?: string
  /**
   * Custom message to display. If not provided, a default message is shown.
   */
  message?: string
}

export function NoAccessMessage({
  featureName,
  message,
}: NoAccessMessageProps) {
  const defaultMessage = featureName
    ? `You don't have permission to access ${featureName}. Please contact your organization administrator to request access.`
    : "You don't have permission to access this page. Please contact your organization administrator to request access."

  return (
    <div className='flex items-center justify-center py-12'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
            <Lock className='size-6 text-muted-foreground' />
          </div>
          <CardTitle>Access Required</CardTitle>
          <CardDescription className='text-base'>
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center text-sm text-muted-foreground'>
          If you believe this is an error, please contact your administrator.
        </CardContent>
      </Card>
    </div>
  )
}
