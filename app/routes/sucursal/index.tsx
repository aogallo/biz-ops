import { Link } from 'react-router'
import { requireAuth } from '~/server/auth/session.server'
import { sucursalRepository } from '~/features/sucursal/server/repository/sucursal.repository'
import { DataTable } from '~/components/dataTable/DataTable'
import TitleAndActions from '~/components/TitleAndActions'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { Route } from './+types/index'
import type { ColumnDef } from '@tanstack/react-table'

type SucursalRow = {
  id: string
  name: string
  code: string
  address: string | null
  phone: string | null
  isActive: boolean
  companyName: string | null
}

const columns: ColumnDef<SucursalRow>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'code',
    header: 'Código POS',
    cell: ({ row }) => (
      <span className='font-mono text-sm font-medium'>{row.original.code}</span>
    ),
  },
  {
    accessorKey: 'companyName',
    header: 'Empresa',
    cell: ({ row }) => row.original.companyName ?? '—',
  },
  {
    accessorKey: 'address',
    header: 'Dirección',
    cell: ({ row }) => row.original.address ?? '—',
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
    cell: ({ row }) => row.original.phone ?? '—',
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) =>
      row.original.isActive ? (
        <Badge variant='default'>Activa</Badge>
      ) : (
        <Badge variant='secondary'>Inactiva</Badge>
      ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <Link
          to={`/sucursal/${row.original.id}/edit`}
          className='text-primary text-sm hover:underline'
        >
          Editar
        </Link>
        <a
          href={`/kitchen/${row.original.id}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-muted-foreground text-sm hover:underline'
        >
          Cocina
        </a>
      </div>
    ),
  },
]

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) return { sucursales: [] }

  const sucursales = await sucursalRepository.getByOrganization(organizationId)
  return { sucursales }
}

export default function SucursalIndex({ loaderData }: Route.ComponentProps) {
  const { sucursales } = loaderData

  return (
    <div className='flex-1 p-6'>
      <TitleAndActions title='Sucursales'>
        <Link to='/sucursal/new'>
          <Button>Nueva Sucursal</Button>
        </Link>
      </TitleAndActions>

      {sucursales.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>No hay sucursales registradas.</p>
          <Link to='/sucursal/new'>
            <Button variant='outline'>Crear primera sucursal</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sucursales}
          enableSearch
          searchPlaceholder='Buscar sucursal...'
        />
      )}
    </div>
  )
}
