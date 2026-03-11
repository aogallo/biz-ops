import { Form } from 'react-router'
import { requireAuth } from '~/server/auth/session.server'
import { unitOfMeasureRepository } from '~/features/unitOfMeasure/server/repository'
import { deleteUomAction } from '~/features/unitOfMeasure/server/actions/delete-uom.action'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId!
  const units = await unitOfMeasureRepository.findByOrganization(organizationId)
  return { units, organizationId }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'delete') {
    const id = formData.get('id')
    if (typeof id !== 'string') return { error: 'Invalid id' }
    try {
      await deleteUomAction(id)
      return { success: true }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Error' }
    }
  }

  return { error: 'Unknown intent' }
}

export default function UnitOfMeasureIndex({ loaderData }: Route.ComponentProps) {
  const { units } = loaderData

  return (
    <div className='container py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Unidades de Medida</h1>
        <a
          href='/unit-of-measure/create'
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
        >
          Nueva Unidad
        </a>
      </div>

      <div className='rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='border-b bg-muted/50'>
            <tr>
              <th className='px-4 py-3 text-left'>Nombre</th>
              <th className='px-4 py-3 text-left'>Abreviatura</th>
              <th className='px-4 py-3 text-left'>Categoría</th>
              <th className='px-4 py-3 text-right'>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id} className='border-b last:border-0'>
                <td className='px-4 py-3'>{unit.name}</td>
                <td className='px-4 py-3'>{unit.abbreviation}</td>
                <td className='px-4 py-3 capitalize'>{unit.category}</td>
                <td className='px-4 py-3 text-right'>
                  <a
                    href={`/unit-of-measure/${unit.id}/edit`}
                    className='mr-2 text-blue-600 hover:underline'
                  >
                    Editar
                  </a>
                  <Form method='post' className='inline'>
                    <input type='hidden' name='intent' value='delete' />
                    <input type='hidden' name='id' value={unit.id} />
                    <button
                      type='submit'
                      className='text-red-600 hover:underline'
                      onClick={(e) => {
                        if (!confirm('¿Eliminar esta unidad?')) e.preventDefault()
                      }}
                    >
                      Eliminar
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={4} className='px-4 py-8 text-center text-muted-foreground'>
                  No hay unidades de medida configuradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
