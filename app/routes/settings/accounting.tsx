import { ArrowLeft, Save } from 'lucide-react'
import { Form, Link, useNavigation } from 'react-router'
import z from 'zod'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Combobox } from '~/components/ui/combobox'
import { accountsRepository } from '~/features/accounts/server/repository'
import { updateAccountingConfigSchema } from '~/features/organization-config/schemas'
import { updateAccountingConfigAction } from '~/features/organization-config/server/actions/update.action'
import { organizationConfigRepository } from '~/features/organization-config/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/accounting'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  if (!session.session.activeOrganizationId) {
    return { config: null, accounts: [] }
  }

  const organizationId = session.session.activeOrganizationId

  const [config, accounts] = await Promise.all([
    organizationConfigRepository.getOrCreate(organizationId),
    accountsRepository.getAllByOrganization(organizationId),
  ])

  return { config, accounts }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)

  if (!session.session.activeOrganizationId) {
    return { error: 'No organization selected' }
  }

  const organizationId = session.session.activeOrganizationId
  const formData = await request.formData()

  // Parse form data
  const data = {
    ivaCreditoFiscalAccountId:
      (formData.get('ivaCreditoFiscalAccountId') as string) || null,
    ivaDebitoFiscalAccountId:
      (formData.get('ivaDebitoFiscalAccountId') as string) || null,
    accountsReceivableAccountId:
      (formData.get('accountsReceivableAccountId') as string) || null,
    accountsPayableAccountId:
      (formData.get('accountsPayableAccountId') as string) || null,
    defaultSalesAccountId:
      (formData.get('defaultSalesAccountId') as string) || null,
    defaultPurchaseAccountId:
      (formData.get('defaultPurchaseAccountId') as string) || null,
    journalEntryPrefix:
      (formData.get('journalEntryPrefix') as string) || undefined,
    posCashAccountId:
      (formData.get('posCashAccountId') as string) || null,
    posCardAccountId:
      (formData.get('posCardAccountId') as string) || null,
    posCheckAccountId:
      (formData.get('posCheckAccountId') as string) || null,
  }

  // Clean up empty strings to null
  const cleanedData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === '' || value === 'none' ? null : value,
    ])
  ) as typeof data

  // Validate
  const result = updateAccountingConfigSchema.safeParse(cleanedData)
  if (!result.success) {
    return {
      error: 'Validation failed',
      fieldErrors: z.flattenError(result.error).fieldErrors,
    }
  }

  // Update config
  const updateResult = await updateAccountingConfigAction(
    organizationId,
    result.data
  )

  if (!updateResult.success) {
    return { error: updateResult.error }
  }

  return { success: true, message: 'Accounting settings saved successfully' }
}

interface AccountSelectProps {
  name: string
  label: string
  description: string
  value: string | null
  accounts: Array<{
    id: string
    name: string | null
    accountNumber: string | null
  }>
}

function AccountSelect({
  name,
  label,
  description,
  value,
  accounts,
}: AccountSelectProps) {
  const options = [
    { value: 'none', label: 'Not configured' },
    ...accounts.map((account) => ({
      value: account.id,
      label: account.accountNumber
        ? `${account.accountNumber} - ${account.name}`
        : account.name || '',
    })),
  ]

  return (
    <div className='space-y-2'>
      <Label htmlFor={name}>{label}</Label>
      <Combobox
        name={name}
        options={options}
        defaultValue={value || 'none'}
        placeholder='Select an account'
        searchPlaceholder='Search accounts...'
        emptyMessage='No accounts found.'
      />
      <p className='text-muted-foreground text-sm'>{description}</p>
    </div>
  )
}

export default function AccountingSettings({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { config, accounts } = loaderData
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='container mx-auto py-6'>
      {/* Back Link */}
      <Link
        to='/dashboard'
        className='text-muted-foreground hover:text-foreground mb-4 inline-flex items-center text-sm'
      >
        <ArrowLeft className='mr-1 h-4 w-4' />
        Back to Dashboard
      </Link>

      {/* Error/Success Messages */}
      {actionData && 'error' in actionData && actionData.error && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'>
          {actionData.error}
        </div>
      )}
      {actionData && 'success' in actionData && actionData.success && (
        <div className='mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400'>
          {'message' in actionData && actionData.message}
        </div>
      )}

      <Form method='post'>
        <div className='space-y-6'>
          {/* IVA Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>IVA Accounts</CardTitle>
              <CardDescription>
                Configure the accounts used for IVA (Value Added Tax) tracking
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6 md:grid-cols-2'>
              <AccountSelect
                name='ivaCreditoFiscalAccountId'
                label='IVA Credito Fiscal'
                description='Account for IVA on purchases (debit when buying)'
                value={config?.ivaCreditoFiscalAccountId ?? null}
                accounts={accounts}
              />
              <AccountSelect
                name='ivaDebitoFiscalAccountId'
                label='IVA Debito Fiscal'
                description='Account for IVA on sales (credit when selling)'
                value={config?.ivaDebitoFiscalAccountId ?? null}
                accounts={accounts}
              />
            </CardContent>
          </Card>

          {/* Receivable/Payable Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Receivable and Payable Accounts</CardTitle>
              <CardDescription>
                Configure the accounts for tracking amounts owed and owing
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6 md:grid-cols-2'>
              <AccountSelect
                name='accountsReceivableAccountId'
                label='Accounts Receivable'
                description='Account for amounts customers owe you (sales)'
                value={config?.accountsReceivableAccountId ?? null}
                accounts={accounts}
              />
              <AccountSelect
                name='accountsPayableAccountId'
                label='Accounts Payable'
                description='Account for amounts you owe suppliers (purchases)'
                value={config?.accountsPayableAccountId ?? null}
                accounts={accounts}
              />
            </CardContent>
          </Card>

          {/* Default Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Default Accounts</CardTitle>
              <CardDescription>
                Default accounts used when creating entries (can be overridden
                per transaction)
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6 md:grid-cols-2'>
              <AccountSelect
                name='defaultSalesAccountId'
                label='Default Sales Account'
                description='Default revenue account for sales'
                value={config?.defaultSalesAccountId ?? null}
                accounts={accounts}
              />
              <AccountSelect
                name='defaultPurchaseAccountId'
                label='Default Purchase Account'
                description='Default expense account for purchases'
                value={config?.defaultPurchaseAccountId ?? null}
                accounts={accounts}
              />
            </CardContent>
          </Card>

          {/* POS Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>POS Accounts</CardTitle>
              <CardDescription>
                Configure the accounts used for POS session journal entries
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6 md:grid-cols-3'>
              <AccountSelect
                name='posCashAccountId'
                label='POS Cash Account'
                description='Account for cash received at POS (e.g., Caja)'
                value={config?.posCashAccountId ?? null}
                accounts={accounts}
              />
              <AccountSelect
                name='posCardAccountId'
                label='POS Card Account'
                description='Account for card payments at POS (e.g., Banco tarjetas)'
                value={config?.posCardAccountId ?? null}
                accounts={accounts}
              />
              <AccountSelect
                name='posCheckAccountId'
                label='POS Check Account'
                description='Account for check payments at POS (e.g., Cheques por cobrar)'
                value={config?.posCheckAccountId ?? null}
                accounts={accounts}
              />
            </CardContent>
          </Card>

          {/* Journal Entry Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Journal Entry Settings</CardTitle>
              <CardDescription>
                Configure journal entry numbering and format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='max-w-xs space-y-2'>
                <Label htmlFor='journalEntryPrefix'>Entry Number Prefix</Label>
                <Input
                  id='journalEntryPrefix'
                  name='journalEntryPrefix'
                  defaultValue={config?.journalEntryPrefix || 'JE'}
                  placeholder='JE'
                  maxLength={10}
                />
                <p className='text-muted-foreground text-sm'>
                  Prefix for journal entry numbers (e.g., JE-000001)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className='flex justify-end'>
            <Button type='submit' disabled={isSubmitting}>
              <Save className='mr-2 h-4 w-4' />
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}
