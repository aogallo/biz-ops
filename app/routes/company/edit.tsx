import { useEffect } from 'react'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { updateCompany } from '~/features/company/server/actions/update.action.server'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { companyId } = params

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    throw redirect('/company')
  }

  const company = await companyRepository.getById(organizationId, companyId)
  if (!company) {
    throw redirect('/company')
  }

  return { company }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { companyId } = params
  const response = await updateCompany(request, companyId)
  if (response.success && response.data) {
    return redirect(`/company/${response.data.id}`)
  }
  return response
}

export default function EditCompany({ loaderData }: Route.ComponentProps) {
  const { company } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  useEffect(() => {
    if (actionData?.message && !actionData.success) {
      toast.error(actionData.message)
    }
  }, [actionData])

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Edit Company</CardTitle>
          <CardDescription>Update the details for this company</CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='name'
                  className='mb-2 block text-sm font-medium'
                >
                  Name *
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  required
                  defaultValue={company.name}
                  placeholder='Acme Corporation'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.name && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor='nit' className='mb-2 block text-sm font-medium'>
                  NIT *
                </label>
                <input
                  type='text'
                  id='nit'
                  name='nit'
                  required
                  defaultValue={company.nit}
                  placeholder='Nit'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.nit && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.nit}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor='code'
                  className='mb-2 block text-sm font-medium'
                >
                  POS Code *
                </label>
                <input
                  type='text'
                  id='code'
                  name='code'
                  required
                  maxLength={20}
                  defaultValue={company.code ?? ''}
                  placeholder='TIENDA-01'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm uppercase focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                  style={{ textTransform: 'uppercase' }}
                />
                {actionData?.errors?.code && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.code}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  Short code cashiers type at POS login to identify this
                  company.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor='email'
                className='mb-2 block text-sm font-medium'
              >
                Email
              </label>
              <input
                type='email'
                id='email'
                name='email'
                defaultValue={company.email ?? ''}
                placeholder='contact@company.com'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:max-w-md'
              />
              {actionData?.errors?.email && (
                <p className='text-destructive mt-1 text-xs'>
                  {actionData.errors.email}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <Link to={`/company/${company.id}`}>Cancel</Link>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
