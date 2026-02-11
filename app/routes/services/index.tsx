import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link, useFetcher } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { servicesRepository } from '~/features/services/server/repository'
import { serviceColorMap, type ServiceColor } from '~/features/services/schemas'
import { deleteServiceAction } from '~/features/services/server/actions/delete.action'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Route } from './+types/index'

type Service = Awaited<
  ReturnType<typeof servicesRepository.getAllByOrganization>
>[number]

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { flash } = getFlash(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      services: [],
      noOrganization: true,
      toast: flash,
    }
  }

  const services = await servicesRepository.getAllByOrganization(organizationId)

  return {
    services,
    noOrganization: false,
    toast: flash,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const actionType = formData.get('_action')

  if (actionType === 'delete') {
    return deleteServiceAction(request)
  }

  return { success: false, message: 'Invalid action' }
}

function DeleteServiceButton({ serviceId }: { serviceId: string }) {
  const fetcher = useFetcher()
  const isDeleting = fetcher.state !== 'idle'

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="_action" value="delete" />
      <input type="hidden" name="id" value={serviceId} />
      <button
        type="submit"
        disabled={isDeleting}
        className="flex w-full items-center text-destructive"
      >
        <Trash2 className="mr-2 size-4" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </fetcher.Form>
  )
}

export default function ServicesIndex({ loaderData }: Route.ComponentProps) {
  const { services, noOrganization, toast } = loaderData

  useToastFromLoader(toast)

  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const color = row.original.color as ServiceColor
          const colorStyles = serviceColorMap[color]
          return (
            <div className="flex items-center gap-2">
              <div className={`size-3 rounded-full ${colorStyles.dot}`} />
              <span className="font-medium">{row.getValue('name')}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        cell: ({ row }) => {
          const duration = row.getValue('duration') as number
          const hours = Math.floor(duration / 60)
          const minutes = duration % 60
          return (
            <span>
              {hours > 0 ? `${hours}h ` : ''}
              {minutes > 0 ? `${minutes}min` : ''}
            </span>
          )
        },
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => {
          const price = row.getValue('price') as string | null
          if (!price) return <span className="text-muted-foreground">-</span>
          return (
            <span>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(Number(price))}
            </span>
          )
        },
      },
      {
        accessorKey: 'color',
        header: 'Color',
        cell: ({ row }) => {
          const color = row.getValue('color') as ServiceColor
          const colorStyles = serviceColorMap[color]
          return (
            <Badge variant="outline" className={`${colorStyles.bg} ${colorStyles.text}`}>
              {color}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.getValue('isActive') as boolean
          return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const description = row.getValue('description') as string | null
          return (
            <span className="text-muted-foreground text-sm line-clamp-1">
              {description || '-'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/services/${row.original.id}/edit`}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <DeleteServiceButton serviceId={row.original.id} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  )

  if (noOrganization) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Please select an organization to view services.
          </p>
          <Link to="/organization">
            <Button>Select Organization</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Manage services that can be booked for appointments
          </p>
        </div>
        <Link to="/services/new">
          <Button>Add Service</Button>
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No services found. Create your first service to get started.
          </p>
          <Link to="/services/new">
            <Button>Create Service</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={services}
          enableSearch
          searchPlaceholder="Search services..."
        />
      )}
    </div>
  )
}
