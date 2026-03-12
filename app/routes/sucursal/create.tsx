import { useEffect } from 'react'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router'
import { toast } from 'sonner'
import { requireAuth } from '~/server/auth/session.server'
import { createSucursalAction } from '~/features/sucursal/server/actions/create-sucursal.action'
import { createSucursalSchema } from '~/features/sucursal/schemas'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card'
import { companyModel } from '~/server/db/schemas/company'
import { db } from '~/server/db'
import { eq } from 'drizzle-orm'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) return { companies: [], organizationId: '' }

  const companies = await db
    .select({ id: companyModel.id, name: companyModel.name })
    .from(companyModel)
    .where(eq(companyModel.organizationId, organizationId))
    .orderBy(companyModel.name)

  return { companies, organizationId }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) return { error: 'No active organization' }

  const formData = await request.formData()

  const result = createSucursalSchema.safeParse({
    organizationId,
    name: formData.get('name'),
    code: formData.get('code'),
    companyId: formData.get('companyId') || null,
    address: formData.get('address') || null,
    phone: formData.get('phone') || null,
    isActive: formData.get('isActive') === 'true',
  })

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors }
  }

  try {
    await createSucursalAction(result.data)
    throw redirect(`/sucursal`)
  } catch (error) {
    if (error instanceof Response) throw error
    return {
      error:
        error instanceof Error ? error.message : 'Error al crear la sucursal',
    }
  }
}

export default function CreateSucursal({ loaderData }: Route.ComponentProps) {
  const { companies } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  useEffect(() => {
    if (
      actionData &&
      'error' in actionData &&
      typeof actionData.error === 'string'
    ) {
      toast.error(actionData.error)
    }
  }, [actionData])

  const inputClass =
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Nueva Sucursal</CardTitle>
          <CardDescription>
            Registrá una nueva sucursal o local físico.
          </CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='name'
                  className='mb-2 block text-sm font-medium'
                >
                  Nombre *
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  required
                  placeholder='Sucursal Centro'
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor='code'
                  className='mb-2 block text-sm font-medium'
                >
                  Código POS *
                </label>
                <input
                  type='text'
                  id='code'
                  name='code'
                  required
                  maxLength={20}
                  placeholder='SUCURSAL-01'
                  className={`${inputClass} uppercase`}
                  style={{ textTransform: 'uppercase' }}
                />
                <p className='text-muted-foreground mt-1 text-xs'>
                  Los cajeros usan este código para iniciar sesión en el POS.
                </p>
              </div>

              <div>
                <label
                  htmlFor='companyId'
                  className='mb-2 block text-sm font-medium'
                >
                  Empresa (opcional)
                </label>
                <select id='companyId' name='companyId' className={inputClass}>
                  <option value=''>Sin empresa asociada</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor='phone'
                  className='mb-2 block text-sm font-medium'
                >
                  Teléfono
                </label>
                <input
                  type='text'
                  id='phone'
                  name='phone'
                  placeholder='2222-3333'
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='address'
                className='mb-2 block text-sm font-medium'
              >
                Dirección
              </label>
              <input
                type='text'
                id='address'
                name='address'
                placeholder='5ta Avenida 10-20 zona 1'
                className={inputClass}
              />
            </div>

            <input type='hidden' name='isActive' value='true' />
          </CardContent>

          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <Link to='/sucursal'>Cancelar</Link>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Sucursal'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
