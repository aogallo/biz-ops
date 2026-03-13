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
import { sucursalRepository } from '~/features/sucursal/server/repository/sucursal.repository'
import { updateSucursalAction } from '~/features/sucursal/server/actions/update-sucursal.action'
import { updateSucursalSchema } from '~/features/sucursal/schemas'
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
import type { Route } from './+types/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) throw redirect('/sucursal')

  const [sucursal, companies] = await Promise.all([
    sucursalRepository.getById(organizationId, params.id),
    db
      .select({ id: companyModel.id, name: companyModel.name })
      .from(companyModel)
      .where(eq(companyModel.organizationId, organizationId))
      .orderBy(companyModel.name),
  ])

  if (!sucursal) throw redirect('/sucursal')

  return { sucursal, companies }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) return { error: 'No active organization' }

  const formData = await request.formData()

  const result = updateSucursalSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code'),
    companyId: formData.get('companyId') || null,
    address: formData.get('address') || null,
    phone: formData.get('phone') || null,
    isActive: formData.get('isActive') === 'true',
    kitchenPin: formData.get('kitchenPin') || null,
  })

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors }
  }

  try {
    await updateSucursalAction(organizationId, params.id, result.data)
    throw redirect('/sucursal')
  } catch (error) {
    if (error instanceof Response) throw error
    return {
      error: error instanceof Error ? error.message : 'Error al actualizar',
    }
  }
}

export default function EditSucursal({ loaderData }: Route.ComponentProps) {
  const { sucursal, companies } = loaderData
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
          <CardTitle>Editar Sucursal</CardTitle>
          <CardDescription>
            Actualizá los datos de {sucursal.name}.
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
                  defaultValue={sucursal.name}
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
                  defaultValue={sucursal.code}
                  className={`${inputClass} uppercase`}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label
                  htmlFor='companyId'
                  className='mb-2 block text-sm font-medium'
                >
                  Empresa
                </label>
                <select
                  id='companyId'
                  name='companyId'
                  defaultValue={sucursal.companyId ?? ''}
                  className={inputClass}
                >
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
                  defaultValue={sucursal.phone ?? ''}
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
                defaultValue={sucursal.address ?? ''}
                className={inputClass}
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium'>Estado</label>
              <select
                name='isActive'
                defaultValue={sucursal.isActive ? 'true' : 'false'}
                className={inputClass}
              >
                <option value='true'>Activa</option>
                <option value='false'>Inactiva</option>
              </select>
            </div>

            <div>
              <label
                htmlFor='kitchenPin'
                className='mb-2 block text-sm font-medium'
              >
                PIN de Cocina
              </label>
              <input
                type='password'
                id='kitchenPin'
                name='kitchenPin'
                inputMode='numeric'
                maxLength={6}
                defaultValue={sucursal.kitchenPin ?? ''}
                className={inputClass}
                placeholder='PIN numérico (opcional)'
                autoComplete='new-password'
              />
              <p className='text-muted-foreground mt-1 text-xs'>
                PIN para que el personal de cocina acceda al display de cocina.
              </p>
            </div>
          </CardContent>

          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <Link to='/sucursal'>Cancelar</Link>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
