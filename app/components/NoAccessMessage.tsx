import { Lock } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useTranslation } from '~/i18n/context'

interface NoAccessMessageProps {
  featureName?: string
  message?: string
}

export function NoAccessMessage({
  featureName,
  message,
}: NoAccessMessageProps) {
  const { t } = useTranslation()

  const defaultMessage = featureName
    ? t('common.noPermission', { feature: featureName })
    : t('common.noPermissionGeneric')

  return (
    <div className='flex items-center justify-center py-12'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
            <Lock className='size-6 text-muted-foreground' />
          </div>
          <CardTitle>{t('common.accessRequired')}</CardTitle>
          <CardDescription className='text-base'>
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center text-sm text-muted-foreground'>
          {t('common.contactAdmin')}
        </CardContent>
      </Card>
    </div>
  )
}
