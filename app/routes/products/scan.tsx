import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { QRScanner } from '~/features/products/components/QRScanner'
import { useTranslation } from '~/i18n/context'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/scan'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request)
  return {}
}

export default function ScanProduct() {
  const { t } = useTranslation()

  return (
    <div className='mx-auto max-w-lg p-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('products.scanTitle')}</CardTitle>
          <CardDescription>{t('products.scanDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <QRScanner />
        </CardContent>
      </Card>
    </div>
  )
}
