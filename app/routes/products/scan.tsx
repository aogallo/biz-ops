import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { QRScanner } from '~/features/products/components/QRScanner'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/scan'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request)
  return {}
}

export default function ScanProduct() {
  return (
    <div className='mx-auto max-w-lg p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Scan Product QR</CardTitle>
          <CardDescription>
            Use your device camera to scan a product QR code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QRScanner />
        </CardContent>
      </Card>
    </div>
  )
}
