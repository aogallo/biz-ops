import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { UploadDropzone } from '~/features/accounts/components/UploadDropzone'
import { bulkUploadAccounts } from '~/features/accounts/server/actions/bulk-upload.action'
import { accountsRepository } from '~/features/accounts/server/repository'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { useTranslation } from '~/i18n/context'
import type { TranslationKey } from '~/i18n/types'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { Route } from './+types/index'

type Account = Awaited<
  ReturnType<typeof accountsRepository.getAllByOrganization>
>[number]

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      success: false,
      message: translateServer(
        locale,
        'messages.accounts.noOrganization' as TranslationKey
      ),
    }
  }

  const formData = await request.formData()
  const actionType = formData.get('_action')

  if (actionType === 'bulk-upload') {
    return bulkUploadAccounts(request, organizationId, formData)
  }

  return {
    success: false,
    message: translateServer(locale, 'common.unknown' as TranslationKey),
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  // Get flash message and headers to clear it
  const { flash } = getFlash(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      accounts: [],
      noOrganization: true,
      toast: flash,
    }
  }

  const accounts = await accountsRepository.getAllByOrganization(organizationId)

  return {
    accounts,
    noOrganization: false,
    toast: flash,
  }
}

export default function AccountsIndex({ loaderData }: Route.ComponentProps) {
  const { accounts, noOrganization, toast } = loaderData
  const { t } = useTranslation()

  // Show toast if present in loader data
  useToastFromLoader(toast)

  const columns = useMemo<ColumnDef<Account>[]>(
    () => [
      {
        accessorKey: 'accountNumber',
        header: t('accounts.number' as TranslationKey),
        cell: ({ row }) => (
          <span className='font-mono text-sm'>
            {row.getValue('accountNumber')}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('common.name' as TranslationKey),
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('name')}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/accounts/${row.original.id}`}
            className='text-primary text-sm font-medium hover:underline'
          >
            {t('common.view' as TranslationKey)}
          </Link>
        ),
      },
    ],
    [t]
  )

  if (noOrganization) {
    return (
      <div className='p-6'>
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            {t('messages.accounts.noOrganization' as TranslationKey)}
          </p>
          <Link to='/organization'>
            <Button>{t('sidebar.selectOrganization' as TranslationKey)}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>
            {t('accounts.title' as TranslationKey)}
          </h1>
          <p className='text-muted-foreground'>
            {t('accounts.manage' as TranslationKey)}
          </p>
        </div>
        <Link to='/accounts/new'>
          <Button>{t('accounts.addAccount' as TranslationKey)}</Button>
        </Link>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          {accounts.length === 0 ? (
            <div className='rounded-lg border border-dashed p-8 text-center'>
              <p className='text-muted-foreground mb-4'>
                {t('common.noData' as TranslationKey)}
              </p>
              <Link to='/accounts/new'>
                <Button>{t('accounts.createNew' as TranslationKey)}</Button>
              </Link>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={accounts}
              enableSearch
              searchPlaceholder={t(
                'accounts.searchPlaceholder' as TranslationKey
              )}
            />
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {t('accounts.bulkImport' as TranslationKey)}
              </CardTitle>
              <CardDescription>
                {t('accounts.bulkImportDescription' as TranslationKey)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDropzone />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
