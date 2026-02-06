import { redirect } from 'react-router'
import { businessPartnersRepository } from '~/features/business-partners/server/repository'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import {
  InvoiceForm,
  type BusinessPartnerOption,
  type CompanyOption,
} from '~/features/invoice/components'
import { createDraftInvoiceSchema } from '~/features/invoice/schemas'
import { createDraftInvoiceAction } from '~/features/invoice/server/actions/create-draft.action'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/new'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return redirect('/invoices')
  }

  const [companies, businessPartners] = await Promise.all([
    companyRepository.getByOrganization(organizationId),
    businessPartnersRepository.getAllByOrganization(organizationId),
  ])

  return {
    companies: companies.map(
      (c): CompanyOption => ({
        id: c.id,
        name: c.name,
      })
    ),
    businessPartners: businessPartners.map(
      (bp): BusinessPartnerOption => ({
        id: bp.id,
        name: bp.name,
        nit: bp.nit,
      })
    ),
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { error: 'No organization selected' }
  }

  const formData = await request.formData()

  // Parse form data
  const type = formData.get('type') as 'purchase' | 'sale'
  const companyId = formData.get('companyId') as string
  const businessPartnerId = formData.get('businessPartnerId') as string
  const invoiceDateStr = formData.get('invoiceDate') as string
  const dueDateStr = formData.get('dueDate') as string

  // Validate that company belongs to organization
  const company = await companyRepository.getById(organizationId, companyId)
  if (!company) {
    return {
      error: 'Invalid company',
      fieldErrors: { companyId: ['Selected company not found'] },
    }
  }

  // Validate that business partner belongs to organization
  const partner = await businessPartnersRepository.getByIdForOrganization(
    organizationId,
    businessPartnerId
  )
  if (!partner) {
    return {
      error: 'Invalid business partner',
      fieldErrors: { businessPartnerId: ['Selected business partner not found'] },
    }
  }

  // Build input for validation
  const input = {
    organizationId,
    companyId,
    businessPartnerId,
    type,
    invoiceDate: new Date(invoiceDateStr),
    dueDate: dueDateStr ? new Date(dueDateStr) : null,
  }

  // Validate with Zod
  const result = createDraftInvoiceSchema.safeParse(input)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) {
        fieldErrors[path] = []
      }
      fieldErrors[path].push(issue.message)
    }

    return {
      error: 'Validation failed',
      fieldErrors,
    }
  }

  // Create draft invoice
  const createResult = await createDraftInvoiceAction(result.data)

  if (!createResult.success) {
    return { error: createResult.error }
  }

  // Redirect to edit page to add lines
  return redirect(`/invoices/${createResult.invoice?.id}/edit`)
}

export default function NewInvoicePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { companies, businessPartners } = loaderData

  return (
    <div className="container mx-auto py-6">
      <InvoiceForm
        mode="create"
        companies={companies}
        businessPartners={businessPartners}
        actionData={actionData}
      />
    </div>
  )
}
