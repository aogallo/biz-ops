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
import { useTranslation } from '~/i18n/context'
import type { Route } from './+types/terminals'
import type { PosTerminalWithSucursal } from '~/features/pos/types'
import { db } from '~/server/db'
import { sucursalModel } from '~/server/db/schemas/sucursal'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { eq } from 'drizzle-orm'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { terminals: [], sucursales: [], businessPartners: [] }
  }

  const [terminals, sucursales, businessPartners] = await Promise.all([
    posRepository.getTerminals(organizationId),
    db
      .select({ id: sucursalModel.id, name: sucursalModel.name, code: sucursalModel.code })
      .from(sucursalModel)
      .where(eq(sucursalModel.organizationId, organizationId))
      .orderBy(sucursalModel.name),
    db
      .select({
        id: businessPartnerModel.id,
        name: businessPartnerModel.name,
        nit: businessPartnerModel.nit,
      })
      .from(businessPartnerModel)
      .where(eq(businessPartnerModel.organizationId, organizationId)),
  ])

  return { terminals, sucursales, businessPartners, organizationId }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create') {
    const data = {
      name: formData.get('name'),
      organizationId: formData.get('organizationId'),
      sucursalId: formData.get('sucursalId') || null,
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
  const { terminals, sucursales, businessPartners, organizationId } =
    loaderData as {
      terminals: PosTerminalWithSucursal[]
      sucursales: Array<{ id: string; name: string; code: string }>
      businessPartners: Array<{
        id: string
        name: string
        nit: string | null
      }>
      organizationId?: string
    }

  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const columns: ColumnDef<PosTerminalWithSucursal>[] = [
    {
      accessorKey: 'name',
      header: t('common.name'),
    },
    {
      accessorKey: 'sucursalName',
      header: 'Sucursal',
      cell: ({ row }) => row.original.sucursalName ?? '-',
    },
    {
      accessorKey: 'isActive',
      header: t('common.status'),
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
              {row.original.isActive ? t('common.active') : t('common.inactive')}
            </Badge>
          </Button>
        </fetcher.Form>
      ),
    },
    {
      accessorKey: 'autoGenerateInvoice',
      header: t('pos.autoInvoiceCol'),
      cell: ({ row }) => (
        <Badge variant={row.original.autoGenerateInvoice ? 'default' : 'outline'}>
          {row.original.autoGenerateInvoice ? t('pos.yes') : t('pos.no')}
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
          <h1 className='text-xl font-bold'>{t('pos.posTerminals')}</h1>
          <p className='text-muted-foreground text-sm'>
            {t('pos.terminalsDescription')}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className='size-4' />
          {t('pos.newTerminal')}
        </Button>
      </div>

      <DataTable columns={columns} data={terminals} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pos.newTerminalTitle')}</DialogTitle>
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
                <label className='text-sm font-medium'>{t('pos.terminalName')}</label>
                <Input
                  name='name'
                  placeholder={t('pos.terminalName')}
                  required
                  className='mt-1'
                />
              </div>

              <div>
                <label className='text-sm font-medium'>Sucursal</label>
                <Select name='sucursalId'>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder='Seleccionar sucursal (opcional)' />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='text-sm font-medium'>
                  {t('pos.defaultCustomerLabel')}
                </label>
                <Select name='defaultBusinessPartnerId'>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder={t('pos.defaultCustomer')} />
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
                  {t('pos.autoInvoice')}
                </label>
              </div>
            </div>

            <DialogFooter className='mt-6'>
              <Button
                variant='outline'
                type='button'
                onClick={() => setDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? t('common.creating') : t('pos.createTerminal')}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
