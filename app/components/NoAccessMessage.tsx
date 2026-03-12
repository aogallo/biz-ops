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
          <div className='bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-full'>
            <Lock className='text-muted-foreground size-6' />
          </div>
          <CardTitle>{t('common.accessRequired')}</CardTitle>
          <CardDescription className='text-base'>
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className='text-muted-foreground text-center text-sm'>
          {t('common.contactAdmin')}
        </CardContent>
      </Card>
    </div>
  )
}
