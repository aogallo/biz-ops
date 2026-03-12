import { Form, redirect, useActionData } from 'react-router'
import { requireAuth } from '~/server/auth/session.server'
import { unitOfMeasureRepository } from '~/features/unitOfMeasure/server/repository'
import { updateUomSchema } from '~/features/unitOfMeasure/schemas'
import { updateUomAction } from '~/features/unitOfMeasure/server/actions/update-uom.action'
import type { Route } from './+types/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request)
  const unit = await unitOfMeasureRepository.findById(params.id)
  if (!unit) throw new Response('Not Found', { status: 404 })
  return { unit }
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireAuth(request)
  const formData = await request.formData()

  const result = updateUomSchema.safeParse({
    name: formData.get('name'),
    abbreviation: formData.get('abbreviation'),
    category: formData.get('category'),
  })

  if (!result.success) {
    return { error: 'Datos inválidos' }
  }

  try {
    await updateUomAction(params.id, result.data)
    return redirect('/unit-of-measure')
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}

export default function EditUnitOfMeasure({
  loaderData,
}: Route.ComponentProps) {
  const { unit } = loaderData
  const actionData = useActionData<typeof action>()

  return (
    <div className='container max-w-lg py-8'>
      <h1 className='mb-6 text-2xl font-bold'>Editar Unidad de Medida</h1>

      {actionData && 'error' in actionData && (
        <p className='mb-4 text-sm text-red-600'>{actionData.error}</p>
      )}

      <Form method='post' className='space-y-4'>
        <div>
          <label className='mb-1 block text-sm font-medium'>Nombre</label>
          <input
            name='name'
            defaultValue={unit.name}
            className='w-full rounded border px-3 py-2 text-sm'
            required
          />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium'>Abreviatura</label>
          <input
            name='abbreviation'
            defaultValue={unit.abbreviation}
            className='w-full rounded border px-3 py-2 text-sm'
            required
          />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium'>Categoría</label>
          <select
            name='category'
            defaultValue={unit.category}
            className='w-full rounded border px-3 py-2 text-sm'
          >
            <option value='count'>Conteo</option>
            <option value='weight'>Peso</option>
            <option value='volume'>Volumen</option>
            <option value='other'>Otro</option>
          </select>
        </div>
        <div className='flex gap-3'>
          <a
            href='/unit-of-measure'
            className='rounded border px-4 py-2 text-sm'
          >
            Cancelar
          </a>
          <button
            type='submit'
            className='bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium'
          >
            Guardar
          </button>
        </div>
      </Form>
    </div>
  )
}
