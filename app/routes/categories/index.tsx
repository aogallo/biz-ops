import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import {
  categoryColorMap,
  type CategoryColor,
} from '~/features/categories/schemas'
import { deleteCategory } from '~/features/categories/server/actions/delete.action'
import { categoriesRepository } from '~/features/categories/server/repository'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { Route } from './+types/index'

type Category = Awaited<
  ReturnType<typeof categoriesRepository.getAllByOrganization>
>[number]

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { flash } = getFlash(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return { categories: [], noOrganization: true, toast: flash }
  }

  const categories =
    await categoriesRepository.getAllByOrganization(organizationId)

  return { categories, noOrganization: false, toast: flash }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const actionType = formData.get('_action')

  if (actionType === 'delete') {
    const categoryId = formData.get('id') as string
    if (!categoryId) return { success: false, message: 'Missing category ID' }
    return deleteCategory(request, categoryId)
  }

  return { success: false, message: 'Invalid action' }
}

function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const fetcher = useFetcher()
  const isDeleting = fetcher.state !== 'idle'

  return (
    <fetcher.Form method='post'>
      <input type='hidden' name='_action' value='delete' />
      <input type='hidden' name='id' value={categoryId} />
      <button
        type='submit'
        disabled={isDeleting}
        className='text-destructive flex w-full items-center'
      >
        <Trash2 className='mr-2 size-4' />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </fetcher.Form>
  )
}

export default function CategoriesIndex({ loaderData }: Route.ComponentProps) {
  const { categories, noOrganization, toast } = loaderData

  useToastFromLoader(toast)

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const color = row.original.color as CategoryColor
          const colorStyles = categoryColorMap[color]
          return (
            <div className='flex items-center gap-2'>
              <div className={`size-3 rounded-full ${colorStyles.dot}`} />
              <span className='font-medium'>{row.getValue('name')}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'color',
        header: 'Color',
        cell: ({ row }) => {
          const color = row.getValue('color') as CategoryColor
          const colorStyles = categoryColorMap[color]
          return (
            <Badge
              variant='outline'
              className={`${colorStyles.bg} ${colorStyles.text}`}
            >
              {color}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as Date
          return <div>{new Date(date).toLocaleDateString()}</div>
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem asChild>
                <Link to={`/categories/${row.original.id}/edit`}>
                  <Pencil className='mr-2 size-4' />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <DeleteCategoryButton categoryId={row.original.id} />
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
      <div className='p-6'>
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            Please select an organization to view categories.
          </p>
          <Link to='/organization'>
            <Button>Select Organization</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Product Categories</h1>
          <p className='text-muted-foreground'>
            Organize your products into categories
          </p>
        </div>
        <Link to='/categories/new'>
          <Button>Add Category</Button>
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            No categories found. Create your first category to organize
            products.
          </p>
          <Link to='/categories/new'>
            <Button>Create Category</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          enableSearch
          searchPlaceholder='Search categories...'
        />
      )}
    </div>
  )
}
