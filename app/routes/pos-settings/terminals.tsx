import { type ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import { createTerminalSchema, updateTerminalSchema } from '~/features/pos/schemas'
import { requireAuth } from '~/server/auth/session.server'
import { useTranslation } from '~/i18n/context'
import type { Route } from './+types/terminals'
import type { PosTerminalWithSucursal } from '~/features/pos/types'
import { db } from '~/server/db'
import { sucursalModel } from '~/server/db/schemas/sucursal'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { companyModel } from '~/server/db/schemas/company'
import { eq } from 'drizzle-orm'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { terminals: [], sucursales: [], businessPartners: [] }
  }

  const [terminals, sucursales, businessPartners, companies] = await Promise.all([
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
    db
      .select({ id: companyModel.id, name: companyModel.name, nit: companyModel.nit })
      .from(companyModel)
      .where(eq(companyModel.organizationId, organizationId))
      .orderBy(companyModel.name),
  ])

  return { terminals, sucursales, businessPartners, companies, organizationId }
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
      companyId: formData.get('companyId') || null,
      autoGenerateInvoice: formData.get('autoGenerateInvoice') === 'on',
      autoPrintReceipt: formData.get('autoPrintReceipt') === 'on',
      printerName: formData.get('printerName') || null,
      printMethod: formData.get('printMethod') || 'qz-tray',
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

  if (intent === 'update') {
    const id = formData.get('id') as string
    const data = {
      name: formData.get('name'),
      sucursalId: formData.get('sucursalId') || null,
      companyId: formData.get('companyId') || null,
      isActive: formData.get('isActive') === 'on',
      autoGenerateInvoice: formData.get('autoGenerateInvoice') === 'on',
      autoPrintReceipt: formData.get('autoPrintReceipt') === 'on',
      printerName: formData.get('printerName') || null,
      printMethod: formData.get('printMethod') || 'qz-tray',
      defaultBusinessPartnerId:
        formData.get('defaultBusinessPartnerId') || null,
    }

    const parsed = updateTerminalSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    await posRepository.updateTerminal(id, parsed.data)
    return { success: true, intent: 'update' }
  }

  return { error: 'Unknown intent' }
}

export default function PosTerminals({ loaderData }: Route.ComponentProps) {
  const { terminals, sucursales, businessPartners, companies, organizationId } =
    loaderData as {
      terminals: PosTerminalWithSucursal[]
      sucursales: Array<{ id: string; name: string; code: string }>
      businessPartners: Array<{ id: string; name: string; nit: string | null }>
      companies: Array<{ id: string; name: string; nit: string }>
      organizationId?: string
    }

  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTerminal, setEditingTerminal] =
    useState<PosTerminalWithSucursal | null>(null)
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
      accessorKey: 'companyName',
      header: 'Empresa',
      cell: ({ row }) => row.original.companyName ?? '-',
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
      accessorKey: 'autoPrintReceipt',
      header: t('pos.autoPrintCol'),
      cell: ({ row }) => (
        <Badge variant={row.original.autoPrintReceipt ? 'default' : 'outline'}>
          {row.original.autoPrintReceipt ? t('pos.yes') : t('pos.no')}
        </Badge>
      ),
    },
    {
      accessorKey: 'printMethod',
      header: t('pos.printMethodCol'),
      cell: ({ row }) => (
        <Badge variant='outline'>
          {row.original.printMethod === 'qz-tray' ? 'QZ Tray' : t('pos.browserPrint')}
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
            onClick={() => setEditingTerminal(row.original)}
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

      <Dialog
        open={!!editingTerminal}
        onOpenChange={(open) => !open && setEditingTerminal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar terminal</DialogTitle>
          </DialogHeader>
          {editingTerminal && (
            <Form
              method='post'
              onSubmit={() => setTimeout(() => setEditingTerminal(null), 200)}
            >
              <input type='hidden' name='intent' value='update' />
              <input type='hidden' name='id' value={editingTerminal.id} />

              <div className='space-y-4'>
                <div>
                  <label className='text-sm font-medium'>
                    {t('pos.terminalName')}
                  </label>
                  <Input
                    name='name'
                    defaultValue={editingTerminal.name}
                    required
                    className='mt-1'
                  />
                </div>

                <div>
                  <label className='text-sm font-medium'>{t('pos.printerName')}</label>
                  <Input
                    name='printerName'
                    defaultValue={editingTerminal.printerName ?? ''}
                    placeholder='EPSON TM-T88'
                    className='mt-1'
                  />
                </div>

                <div>
                  <label className='text-sm font-medium'>{t('pos.printMethod')}</label>
                  <Select
                    name='printMethod'
                    defaultValue={editingTerminal.printMethod ?? 'qz-tray'}
                  >
                    <SelectTrigger className='mt-1'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='qz-tray'>QZ Tray (ESC/POS)</SelectItem>
                      <SelectItem value='browser'>{t('pos.browserPrint')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className='text-sm font-medium'>Sucursal</label>
                  <Select
                    name='sucursalId'
                    defaultValue={editingTerminal.sucursalId ?? undefined}
                  >
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
                  <label className='text-sm font-medium'>Empresa legal</label>
                  <Select
                    name='companyId'
                    defaultValue={editingTerminal.companyId ?? undefined}
                  >
                    <SelectTrigger className='mt-1'>
                      <SelectValue placeholder='Seleccionar empresa (opcional)' />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.nit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className='text-sm font-medium'>
                    {t('pos.defaultCustomerLabel')}
                  </label>
                  <Select
                    name='defaultBusinessPartnerId'
                    defaultValue={
                      editingTerminal.defaultBusinessPartnerId ?? undefined
                    }
                  >
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
                  <Switch
                    name='isActive'
                    id='edit-isActive'
                    defaultChecked={editingTerminal.isActive}
                  />
                  <label htmlFor='edit-isActive' className='text-sm font-medium'>
                    {t('common.active')}
                  </label>
                </div>

                <div className='flex items-center gap-3'>
                  <Switch
                    name='autoGenerateInvoice'
                    id='edit-autoInvoice'
                    defaultChecked={editingTerminal.autoGenerateInvoice}
                  />
                  <label
                    htmlFor='edit-autoInvoice'
                    className='text-sm font-medium'
                  >
                    {t('pos.autoInvoice')}
                  </label>
                </div>

                <div className='flex items-center gap-3'>
                  <Switch
                    name='autoPrintReceipt'
                    id='edit-autoPrintReceipt'
                    defaultChecked={editingTerminal.autoPrintReceipt}
                  />
                  <label
                    htmlFor='edit-autoPrintReceipt'
                    className='text-sm font-medium'
                  >
                    {t('pos.autoPrintReceipt')}
                  </label>
                </div>
              </div>

              <DialogFooter className='mt-6'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => setEditingTerminal(null)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>

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
                <label className='text-sm font-medium'>{t('pos.printerName')}</label>
                <Input
                  name='printerName'
                  placeholder='EPSON TM-T88'
                  className='mt-1'
                />
              </div>

              <div>
                <label className='text-sm font-medium'>{t('pos.printMethod')}</label>
                <Select name='printMethod' defaultValue='qz-tray'>
                  <SelectTrigger className='mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='qz-tray'>QZ Tray (ESC/POS)</SelectItem>
                    <SelectItem value='browser'>{t('pos.browserPrint')}</SelectItem>
                  </SelectContent>
                </Select>
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
                <label className='text-sm font-medium'>Empresa legal</label>
                <Select name='companyId'>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder='Seleccionar empresa (opcional)' />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.nit})
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

              <div className='flex items-center gap-3'>
                <Switch name='autoPrintReceipt' id='autoPrintReceipt' />
                <label htmlFor='autoPrintReceipt' className='text-sm font-medium'>
                  {t('pos.autoPrintReceipt')}
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
