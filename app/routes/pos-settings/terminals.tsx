import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Form, useFetcher, useNavigation } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { DataTable } from '~/components/dataTable/DataTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { posRepository } from '~/features/pos/server/repository'
import { createTerminalSchema } from '~/features/pos/schemas'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/terminals'
import type { PosTerminalWithCompany } from '~/features/pos/types'
import { db } from '~/server/db'
import { companyModel } from '~/server/db/schemas/company'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { eq } from 'drizzle-orm'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { terminals: [], companies: [], businessPartners: [] }
  }

  const [terminals, companies, businessPartners] = await Promise.all([
    posRepository.getTerminals(organizationId),
    db
      .select({ id: companyModel.id, name: companyModel.name })
      .from(companyModel)
      .where(eq(companyModel.organizationId, organizationId)),
    db
      .select({
        id: businessPartnerModel.id,
        name: businessPartnerModel.name,
        nit: businessPartnerModel.nit,
      })
      .from(businessPartnerModel)
      .where(eq(businessPartnerModel.organizationId, organizationId)),
  ])

  return { terminals, companies, businessPartners, organizationId }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create') {
    const data = {
      name: formData.get('name'),
      organizationId: formData.get('organizationId'),
      companyId: formData.get('companyId'),
      autoGenerateInvoice: formData.get('autoGenerateInvoice') === 'on',
      defaultBusinessPartnerId:
        formData.get('defaultBusinessPartnerId') || null,
    }

    const parsed = createTerminalSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    await posRepository.createTerminal(parsed.data)
    return { success: true }
  }

  if (intent === 'delete') {
    const id = formData.get('id') as string
    await posRepository.deleteTerminal(id)
    return { success: true }
  }

  if (intent === 'toggle-active') {
    const id = formData.get('id') as string
    const isActive = formData.get('isActive') === 'true'
    await posRepository.updateTerminal(id, { isActive: !isActive })
    return { success: true }
  }

  return { error: 'Unknown intent' }
}

export default function PosTerminals({ loaderData }: Route.ComponentProps) {
  const { terminals, companies, businessPartners, organizationId } =
    loaderData as {
      terminals: PosTerminalWithCompany[]
      companies: Array<{ id: string; name: string }>
      businessPartners: Array<{
        id: string
        name: string
        nit: string | null
      }>
      organizationId?: string
    }

  const [dialogOpen, setDialogOpen] = useState(false)
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const columns: ColumnDef<PosTerminalWithCompany>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
    },
    {
      accessorKey: 'companyName',
      header: 'Empresa',
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => (
        <fetcher.Form method='post'>
          <input type='hidden' name='intent' value='toggle-active' />
          <input type='hidden' name='id' value={row.original.id} />
          <input
            type='hidden'
            name='isActive'
            value={String(row.original.isActive)}
          />
          <Button variant='ghost' size='xs' type='submit'>
            <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
              {row.original.isActive ? 'Activa' : 'Inactiva'}
            </Badge>
          </Button>
        </fetcher.Form>
      ),
    },
    {
      accessorKey: 'autoGenerateInvoice',
      header: 'Auto Factura',
      cell: ({ row }) => (
        <Badge variant={row.original.autoGenerateInvoice ? 'default' : 'outline'}>
          {row.original.autoGenerateInvoice ? 'Sí' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
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
      ),
    },
  ]

  return (
    <div className='page-container space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold'>Cajas POS</h1>
          <p className='text-muted-foreground text-sm'>
            Configurá las cajas (terminales) del punto de venta.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className='size-4' />
          Nueva Caja
        </Button>
      </div>

      <DataTable columns={columns} data={terminals} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Caja POS</DialogTitle>
          </DialogHeader>
          <Form
            method='post'
            onSubmit={() => setTimeout(() => setDialogOpen(false), 200)}
          >
            <input type='hidden' name='intent' value='create' />
            <input
              type='hidden'
              name='organizationId'
              value={organizationId ?? ''}
            />

            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Nombre</label>
                <Input
                  name='name'
                  placeholder='Caja 1'
                  required
                  className='mt-1'
                />
              </div>

              <div>
                <label className='text-sm font-medium'>Empresa</label>
                <Select name='companyId' required>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder='Seleccionar empresa' />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='text-sm font-medium'>
                  Cliente por defecto (opcional)
                </label>
                <Select name='defaultBusinessPartnerId'>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder='Consumidor Final' />
                  </SelectTrigger>
                  <SelectContent>
                    {businessPartners.map((bp) => (
                      <SelectItem key={bp.id} value={bp.id}>
                        {bp.name} {bp.nit ? `(${bp.nit})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center gap-3'>
                <Switch name='autoGenerateInvoice' id='autoInvoice' />
                <label htmlFor='autoInvoice' className='text-sm font-medium'>
                  Generar factura automáticamente
                </label>
              </div>
            </div>

            <DialogFooter className='mt-6'>
              <Button
                variant='outline'
                type='button'
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Caja'}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
