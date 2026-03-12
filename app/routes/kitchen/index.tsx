import { redirect } from 'react-router'
import { getPosSession } from '~/server/auth/pos-session.server'
import { getOptionalAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { sucursalModel } from '~/server/db/schemas/sucursal'
import { eq } from 'drizzle-orm'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const [userSession, posSession] = await Promise.all([
    getOptionalAuth(request),
    getPosSession(request),
  ])

  if (!userSession && !posSession) throw redirect('/pos-login')

  const organizationId =
    posSession?.organizationId ?? userSession?.session.activeOrganizationId

  if (!organizationId) throw redirect('/pos-login')

  const [firstSucursal] = await db
    .select({ id: sucursalModel.id })
    .from(sucursalModel)
    .where(eq(sucursalModel.organizationId, organizationId))
    .limit(1)

  if (firstSucursal) throw redirect(`/kitchen/${firstSucursal.id}`)

  return {}
}

export default function KitchenIndex() {
  return (
    <div className='flex h-screen items-center justify-center bg-gray-950 text-white'>
      <div className='space-y-2 text-center'>
        <h2 className='text-xl font-bold'>Sin sucursales configuradas</h2>
        <p className='text-sm text-gray-400'>
          Configurá una sucursal en Ajustes para usar el display de cocina.
        </p>
      </div>
    </div>
  )
}
