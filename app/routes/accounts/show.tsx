import { Link, useSubmit } from 'react-router'
import { useTranslation } from '~/i18n/context'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { deleteAccount } from '~/features/accounts/server/actions/delete.action'
import { accountsRepository } from '~/features/accounts/server/repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/show'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const { id } = params

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return redirectWithFlash('/accounts', {
      type: 'error',
      message: translateServer(locale, 'messages.accounts.noOrganization'),
    })
  }

  const account = await accountsRepository.getByIdForOrganization(
    organizationId,
    id
  )

  if (!account) {
    return redirectWithFlash('/accounts', {
      type: 'error',
      message: translateServer(locale, 'messages.accounts.notFound'),
    })
  }

  return { account }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization' }
  }

  const locale = getLocaleFromRequest(request)
  const result = await deleteAccount(request, id)

  if (result.success) {
    return redirectWithFlash('/accounts', {
      type: 'success',
      message: translateServer(locale, 'messages.accounts.deleted'),
    })
  }

  return result
}

export default function ShowAccount({ loaderData }: Route.ComponentProps) {
  const { account } = loaderData
  const { t } = useTranslation()
  const submit = useSubmit()

  const handleDelete = () => {
    if (confirm(`${t('accounts.details')}: "${account.name}"`)) {
      submit({}, { method: 'post' })
    }
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{t('accounts.details')}</h1>
          <p className='text-muted-foreground'>
            {t('accounts.detailsDescription')}
          </p>
        </div>
        <div className='flex gap-2'>
          <Link to={`/accounts/${account.id}/edit`}>
            <Button variant='outline'>{t('common.edit')}</Button>
          </Link>
          <Button variant='destructive' onClick={handleDelete}>
            {t('common.delete')}
          </Button>
          <Link to='/accounts'>
            <Button variant='outline'>{t('accounts.backToAccounts')}</Button>
          </Link>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>{t('accounts.information')}</CardTitle>
            <CardDescription>
              {t('accounts.infoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('accounts.number')}
              </label>
              <p className='font-mono text-lg'>{account.accountNumber}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('accounts.name')}
              </label>
              <p className='text-lg font-semibold'>{account.name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('products.metadata')}</CardTitle>
            <CardDescription>{t('accounts.system')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('accounts.accountId')}
              </label>
              <p className='font-mono text-sm'>{account.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
