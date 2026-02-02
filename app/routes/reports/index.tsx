import { DownloadIcon, PlayIcon } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Route } from './+types/index'
import TitleAndActions from '~/components/TitleAndActions'
import TitleAndActionsBody from '~/components/TitleAndActionsBody'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Combobox } from '~/components/ui/combobox'
import { Label } from '~/components/ui/label'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import { requireAuth } from '~/server/auth/session.server'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { companies: [], selectedCompanyId: undefined }
  }

  const url = new URL(request.url)
  const companyId = url.searchParams.get('companyId') || undefined

  const companies = await companyRepository.getByOrganization(organizationId)

  return { companies, selectedCompanyId: companyId }
}

export default function JournalEntry({ loaderData }: Route.ComponentProps) {
  const { companies, selectedCompanyId } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const [date, setDate] = useState<Date | undefined>(new Date())

  const companyOptions = companies.map((company) => ({
    value: company.id,
    label: company.name,
  }))

  const handleCompanyChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('companyId', value)
    } else {
      params.delete('companyId')
    }
    setSearchParams(params)
  }
  return (
    <>
      <TitleAndActions title='Journal Report'>
        <TitleAndActionsBody>
          <Button variant='outline'>
            <DownloadIcon />
            Export
          </Button>
          <Button>
            <PlayIcon />
            Generate Report
          </Button>
        </TitleAndActionsBody>
      </TitleAndActions>
      <section className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
        <Card>
          <CardHeader>
            <h4>Report Configurations</h4>
          </CardHeader>
          <CardContent>
            <section className='grid grid-cols-1 sm:grid-cols-2'>
              <div>
                <h4>Date Range Presets</h4>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='company'>Company</Label>
                <Combobox
                  options={companyOptions}
                  value={selectedCompanyId}
                  onValueChange={handleCompanyChange}
                  placeholder='Select a company...'
                  searchPlaceholder='Search companies...'
                  emptyMessage='No companies found.'
                />
              </div>
            </section>
          </CardContent>
        </Card>
        <Calendar
          mode='single'
          selected={date}
          onSelect={setDate}
          captionLayout='dropdown'
          className='rounded-lg border'
        />
      </section>
      {date?.toLocaleDateString()}
    </>
  )
}
