import { redirect, useActionData, useNavigation } from 'react-router'
import { QuotationForm } from '~/features/quotations/components/QuotationForm'
import { createQuotationAction } from '~/features/quotations/server/actions/create-quotation.action'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import { businessPartnersRepository } from '~/features/business-partners/server/repository'
import { productsRepository } from '~/features/products/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { companies: [], businessPartners: [], products: [] }
  }

  const [companies, businessPartners, productsData] = await Promise.all([
    companyRepository.getByOrganization(organizationId),
    businessPartnersRepository.getAllByOrganization(organizationId),
    productsRepository.getAllByOrganization(organizationId),
  ])

  const products = productsData.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    attributesJson: p.attributesJson as Record<
      string,
      {
        type: 'text' | 'number' | 'boolean' | 'date' | 'select'
        required: boolean
        options?: string[]
      }
    > | null,
  }))

  return { companies, businessPartners, products }
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createQuotationAction(request)

  if (response.success && response.data) {
    return redirect(`/purchase/quotations/${response.data.id}`)
  }
  return response
}

export default function CreateQuotation({ loaderData }: Route.ComponentProps) {
  const { companies, businessPartners, products } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold tracking-tight'>New Quotation</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Create a new quotation. It will be saved as Draft.
        </p>
      </div>

      <QuotationForm
        companies={companies}
        businessPartners={businessPartners}
        products={products}
        isSubmitting={isSubmitting}
        error={
          actionData && 'message' in actionData ? actionData.message : null
        }
      />
    </div>
  )
}
