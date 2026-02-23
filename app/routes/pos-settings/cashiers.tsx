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
import { posRepository } from '~/features/pos/server/repository'
import { createCashierSchema } from '~/features/pos/schemas'
import { requireAuth } from '~/server/auth/session.server'
import { useTranslation } from '~/i18n/context'
import { db } from '~/server/db'
import { userModel, memberModel } from '~/server/db/schemas/auth'
import { companyModel } from '~/server/db/schemas/company'
import { eq } from 'drizzle-orm'
import type { Route } from './+types/cashiers'

interface CashierRow {
  id: string
  name: string
  userId: string | null
  userName: string | null
  isActive: boolean
  companyId: string
  companyName: string
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { cashiers: [], users: [], companies: [] }
  }

  const [cashiers, users, companies] = await Promise.all([
    posRepository.getCashiersByOrganization(organizationId),
    db
      .select({ id: userModel.id, name: userModel.name })
      .from(userModel)
      .innerJoin(memberModel, eq(memberModel.userId, userModel.id))
      .where(eq(memberModel.organizationId, organizationId)),
    db
      .select({ id: companyModel.id, name: companyModel.name })
      .from(companyModel)
      .where(eq(companyModel.organizationId, organizationId)),
  ])

  return { cashiers, users, companies, organizationId }
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
      userId: formData.get('userId') || null,
      pin: formData.get('pin') || null,
    }

    const parsed = createCashierSchema.safeParse(data)
    if (!parsed.success) {
      return {
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    await posRepository.createCashier(parsed.data)
    return { success: true }
  }

  if (intent === 'delete') {
    const id = formData.get('id') as string
    await posRepository.deleteCashier(id)
    return { success: true }
  }

  if (intent === 'toggle-active') {
    const id = formData.get('id') as string
    const isActive = formData.get('isActive') === 'true'
    await posRepository.updateCashier(id, { isActive: !isActive })
    return { success: true }
  }

  return { error: 'Unknown intent' }
}

export default function PosCashiers({ loaderData }: Route.ComponentProps) {
  const { cashiers, users, companies, organizationId } = loaderData as {
    cashiers: CashierRow[]
    users: Array<{ id: string; name: string }>
    companies: Array<{ id: string; name: string }>
    organizationId?: string
  }

  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const columns: ColumnDef<CashierRow>[] = [
    {
      accessorKey: 'name',
      header: t('common.name'),
    },
    {
      accessorKey: 'userName',
      header: t('pos.linkedUser'),
      cell: ({ row }) => row.original.userName ?? '-',
    },
    {
      accessorKey: 'companyName',
      header: t('pos.company'),
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
          <h1 className='text-xl font-bold'>{t('pos.cashiers')}</h1>
          <p className='text-muted-foreground text-sm'>
            {t('pos.cashiersDescription')}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className='size-4' />
          {t('pos.newCashier')}
        </Button>
      </div>

      <DataTable columns={columns} data={cashiers} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pos.newCashierTitle')}</DialogTitle>
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
                <label className='text-sm font-medium'>{t('pos.cashierName')}</label>
                <Input
                  name='name'
                  required
                  className='mt-1'
                />
              </div>

              <div>
                <label className='text-sm font-medium'>{t('pos.company')}</label>
                <Select name='companyId' required>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder={t('pos.selectCompany')} />
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
                <label className='text-sm font-medium'>{t('pos.linkedUser')}</label>
                <Select name='userId'>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder={t('pos.selectUser')} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='text-sm font-medium'>{t('pos.pinOptional')}</label>
                <Input
                  name='pin'
                  type='password'
                  maxLength={6}
                  className='mt-1'
                />
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
                {isSubmitting ? t('common.creating') : t('pos.createCashier')}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
