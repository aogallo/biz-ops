import { Link, useSearchParams } from 'react-router'
import { Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/dataTable/DataTable'
import TitleAndActions from '~/components/TitleAndActions'
import TitleAndActionsBody from '~/components/TitleAndActionsBody'
import {
  quotationColumns,
  type QuotationRow,
} from '~/features/quotations/components/columns'
import { quotationsRepository } from '~/features/quotations/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { useCanPerformAction } from '~/hooks/usePermissions'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { quotations: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  }

  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') ?? '1')
  const pageSize = Number(url.searchParams.get('pageSize') ?? '10')
  const status = url.searchParams.get('status') ?? undefined
  const search = url.searchParams.get('search') ?? undefined

  const result = await quotationsRepository.getFiltered(
    organizationId,
    { status, search },
    { page, pageSize }
  )

  return result
}

export default function QuotationsIndex({ loaderData }: Route.ComponentProps) {
  const { quotations } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const canCreateQuotation = useCanPerformAction('quotations.create')

  const statusFilter = searchParams.get('status') ?? ''

  return (
    <div className='p-6'>
      <TitleAndActions title='Quotations'>
        <TitleAndActionsBody>
          <select
            value={statusFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value) {
                params.set('status', e.target.value)
              } else {
                params.delete('status')
              }
              params.set('page', '1')
              setSearchParams(params)
            }}
            className='border-input bg-background rounded-md border px-3 py-2 text-sm'
          >
            <option value=''>All Status</option>
            <option value='DRAFT'>Draft</option>
            <option value='SENT'>Sent</option>
            <option value='ACCEPTED'>Accepted</option>
            <option value='REJECTED'>Rejected</option>
          </select>
          {canCreateQuotation && (
            <Link to='/purchase/quotations/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                New Quotation
              </Button>
            </Link>
          )}
        </TitleAndActionsBody>
      </TitleAndActions>

      <DataTable
        columns={quotationColumns}
        data={quotations as QuotationRow[]}
        enableSearch
        searchPlaceholder='Search quotations...'
      />
    </div>
  )
}
