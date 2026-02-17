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
import { useTranslation } from '~/i18n/context'
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
  const { t } = useTranslation()
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
        {isDeleting ? t('common.deleting') : t('common.delete')}
      </button>
    </fetcher.Form>
  )
}

export default function ServicesIndex({ loaderData }: Route.ComponentProps) {
  const { services, noOrganization, toast } = loaderData
  const { t } = useTranslation()

  useToastFromLoader(toast)

  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('services.name'),
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
        header: t('services.duration'),
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
        header: t('services.price'),
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
        header: t('services.color'),
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
        header: t('common.status'),
        cell: ({ row }) => {
          const isActive = row.getValue('isActive') as boolean
          return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? t('common.active') : t('common.inactive')}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'description',
        header: t('services.description'),
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
                  {t('common.edit')}
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
    [t]
  )

  if (noOrganization) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {t('sidebar.selectOrganization')}
          </p>
          <Link to="/organization">
            <Button>{t('sidebar.selectOrganization')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('services.title')}</h1>
          <p className="text-muted-foreground">
            {t('services.searchPlaceholder')}
          </p>
        </div>
        <Link to="/services/new">
          <Button>{t('services.new')}</Button>
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {t('common.noData')}
          </p>
          <Link to="/services/new">
            <Button>{t('services.new')}</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={services}
          enableSearch
          searchPlaceholder={t('services.searchPlaceholder')}
        />
      )}
    </div>
  )
}
