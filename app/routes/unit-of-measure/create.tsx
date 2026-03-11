import { Form, redirect, useActionData } from 'react-router'
import { requireAuth } from '~/server/auth/session.server'
import { createUomSchema } from '~/features/unitOfMeasure/schemas'
import { createUomAction } from '~/features/unitOfMeasure/server/actions/create-uom.action'
import type { Route } from './+types/create'

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId!
  const formData = await request.formData()

  const result = createUomSchema.safeParse({
    organizationId,
    name: formData.get('name'),
    abbreviation: formData.get('abbreviation'),
    category: formData.get('category'),
  })

  if (!result.success) {
    return { error: 'Datos inválidos', fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createUomAction(result.data)
    return redirect('/unit-of-measure')
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}

export default function CreateUnitOfMeasure() {
  const actionData = useActionData<typeof action>()

  return (
    <div className='container max-w-lg py-8'>
      <h1 className='mb-6 text-2xl font-bold'>Nueva Unidad de Medida</h1>

      {actionData && 'error' in actionData && (
        <p className='mb-4 text-sm text-red-600'>{actionData.error}</p>
      )}

      <Form method='post' className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>Nombre</label>
          <input name='name' className='w-full rounded border px-3 py-2 text-sm' required />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Abreviatura</label>
          <input name='abbreviation' className='w-full rounded border px-3 py-2 text-sm' required />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Categoría</label>
          <select name='category' className='w-full rounded border px-3 py-2 text-sm'>
            <option value='count'>Conteo</option>
            <option value='weight'>Peso</option>
            <option value='volume'>Volumen</option>
            <option value='other'>Otro</option>
          </select>
        </div>
        <div className='flex gap-3'>
          <a href='/unit-of-measure' className='rounded border px-4 py-2 text-sm'>
            Cancelar
          </a>
          <button type='submit' className='rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'>
            Crear
          </button>
        </div>
      </Form>
    </div>
  )
}
