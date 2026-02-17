import { Link } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import TitleAndActions from '~/components/TitleAndActions'
import { Button } from '~/components/ui/button'
import { useTranslation } from '~/i18n/context'
import { listCompanies } from '~/features/company/server/loader.server'
import { useCanPerformAction } from '~/hooks/usePermissions'
import { CompanyColumns } from '../../features/company/components/Columns'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const result = await listCompanies(request)

    if (!result.success || !result.data) {
      return []
    }

    return result.data
  } catch (error) {
    console.error(
      `Failed to get companies error: ${error instanceof Error ? error.message : error}`
    )
    return []
  }
}

const CompanyIndex = ({ loaderData }: Route.ComponentProps) => {
  const companies = loaderData
  const canCreateCompany = useCanPerformAction('company.create')
  const { t } = useTranslation()

  return (
    <div className='flex-1 p-6'>
      <TitleAndActions title={t('company.title')}>
        {canCreateCompany && (
          <Link to='/company/new'>
            <Button>{t('company.addCompany')}</Button>
          </Link>
        )}
      </TitleAndActions>
      {companies?.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            {t('company.noCompanies')}
          </p>
        </div>
      ) : (
        <DataTable
          columns={CompanyColumns}
          data={companies}
          enableSearch
          searchPlaceholder={t('company.searchPlaceholder')}
        />
      )}
    </div>
  )
}

export default CompanyIndex
