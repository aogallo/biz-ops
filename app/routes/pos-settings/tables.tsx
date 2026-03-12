import { type ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Form, useFetcher, useNavigation } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/dataTable/DataTable'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { createTableSchema, updateTableSchema } from '~/features/pos/schemas'
import { posTablesRepository } from '~/features/pos/server/repository/tables.repository'
import { requireModule } from '~/server/auth/module.server'
import { db } from '~/server/db'
import { sucursalModel } from '~/server/db/schemas/sucursal'
import { eq } from 'drizzle-orm'
import type { PosTable } from '~/server/db/schemas/pos'
import type { Route } from './+types/tables'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireModule(request, 'pos')
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) return { tables: [], sucursales: [], organizationId: null }

  const [tables, sucursales] = await Promise.all([
    posTablesRepository.getTables(organizationId),
    db
      .select({ id: sucursalModel.id, name: sucursalModel.name })
      .from(sucursalModel)
      .where(eq(sucursalModel.organizationId, organizationId))
      .orderBy(sucursalModel.name),
  ])

  return { tables, sucursales, organizationId }
}

export async function action({ request }: Route.ActionArgs) {
  await requireModule(request, 'pos')
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create') {
    const parsed = createTableSchema.safeParse({
      number: formData.get('number'),
      organizationId: formData.get('organizationId'),
      sucursalId: formData.get('sucursalId') || null,
      capacity: formData.get('capacity') || null,
    })
    if (!parsed.success) return { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }
    await posTablesRepository.createTable(parsed.data)
    return { success: true }
  }

  if (intent === 'update') {
    const id = formData.get('id') as string
    const parsed = updateTableSchema.safeParse({
      number: formData.get('number'),
      sucursalId: formData.get('sucursalId') || null,
      capacity: formData.get('capacity') || null,
    })
    if (!parsed.success) return { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }
    await posTablesRepository.updateTable(id, parsed.data)
    return { success: true }
  }

  if (intent === 'delete') {
    const id = formData.get('id') as string
    await posTablesRepository.deleteTable(id)
    return { success: true }
  }

  return { error: 'Acción desconocida' }
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  occupied: 'Ocupada',
  reserved: 'Reservada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  available: 'default',
  occupied: 'secondary',
  reserved: 'outline',
}

export default function PosTablesPage({ loaderData }: Route.ComponentProps) {
  const { tables, sucursales, organizationId } = loaderData as {
    tables: PosTable[]
    sucursales: Array<{ id: string; name: string }>
    organizationId: string | null
  }

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<PosTable | null>(null)
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const columns: ColumnDef<PosTable>[] = [
    {
      accessorKey: 'number',
      header: 'Mesa',
      cell: ({ row }) => (
        <span className='font-medium'>Mesa {row.original.number}</span>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacidad',
      cell: ({ row }) =>
        row.original.capacity ? `${row.original.capacity} personas` : '-',
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon-xs'
            type='button'
            onClick={() => setEditingTable(row.original)}
          >
            <Pencil className='size-4' />
          </Button>
          <fetcher.Form method='post'>
            <input type='hidden' name='intent' value='delete' />
            <input type='hidden' name='id' value={row.original.id} />
            <Button
              variant='ghost'
              size='icon-xs'
              type='submit'
              className='text-destructive'
            >
              <Trash2 className='size-4' />
            </Button>
          </fetcher.Form>
        </div>
      ),
    },
  ]

  return (
    <div className='page-container space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold'>Mesas</h1>
          <p className='text-muted-foreground text-sm'>
            Configurá las mesas disponibles en tu restaurante
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className='size-4' />
          Nueva mesa
        </Button>
      </div>

      <DataTable columns={columns} data={tables} />

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva mesa</DialogTitle>
          </DialogHeader>
          <Form
            method='post'
            onSubmit={() => setTimeout(() => setDialogOpen(false), 200)}
          >
            <input type='hidden' name='intent' value='create' />
            <input type='hidden' name='organizationId' value={organizationId ?? ''} />

            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Número / Nombre</label>
                <Input name='number' placeholder='1, A1, Terraza 3…' required className='mt-1' />
              </div>
              <div>
                <label className='text-sm font-medium'>Capacidad (personas)</label>
                <Input name='capacity' type='number' min='1' placeholder='4' className='mt-1' />
              </div>
              {sucursales.length > 0 && (
                <div>
                  <label className='text-sm font-medium'>Sucursal</label>
                  <Select name='sucursalId'>
                    <SelectTrigger className='mt-1'>
                      <SelectValue placeholder='Seleccionar sucursal (opcional)' />
                    </SelectTrigger>
                    <SelectContent>
                      {sucursales.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className='mt-6'>
              <Button variant='outline' type='button' onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Creando…' : 'Crear mesa'}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingTable} onOpenChange={(open) => !open && setEditingTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar mesa {editingTable?.number}</DialogTitle>
          </DialogHeader>
          {editingTable && (
            <Form
              method='post'
              onSubmit={() => setTimeout(() => setEditingTable(null), 200)}
            >
              <input type='hidden' name='intent' value='update' />
              <input type='hidden' name='id' value={editingTable.id} />

              <div className='space-y-4'>
                <div>
                  <label className='text-sm font-medium'>Número / Nombre</label>
                  <Input name='number' defaultValue={editingTable.number} required className='mt-1' />
                </div>
                <div>
                  <label className='text-sm font-medium'>Capacidad (personas)</label>
                  <Input
                    name='capacity'
                    type='number'
                    min='1'
                    defaultValue={editingTable.capacity ?? ''}
                    className='mt-1'
                  />
                </div>
                {sucursales.length > 0 && (
                  <div>
                    <label className='text-sm font-medium'>Sucursal</label>
                    <Select name='sucursalId' defaultValue={editingTable.sucursalId ?? undefined}>
                      <SelectTrigger className='mt-1'>
                        <SelectValue placeholder='Seleccionar sucursal (opcional)' />
                      </SelectTrigger>
                      <SelectContent>
                        {sucursales.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter className='mt-6'>
                <Button variant='outline' type='button' onClick={() => setEditingTable(null)}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando…' : 'Guardar'}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
