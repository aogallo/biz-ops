import {
  FileText,
  PlusCircle,
  Receipt,
  ShoppingCart,
  UserPlus,
} from 'lucide-react'
import { getUserPermissions } from '~/server/auth/permissions.server'
import { isSuperAdmin } from '~/server/permissions'

export interface QuickAction {
  id: string
  icon: string
  label: string
  href: string
}

const ALL_ACTIONS: Array<{
  id: string
  icon: typeof FileText
  label: string
  href: string
  permission: string
}> = [
  {
    id: 'create-invoice',
    icon: Receipt,
    label: 'Create invoice',
    href: '/invoices/new',
    permission: 'invoices:create',
  },
  {
    id: 'record-payment',
    icon: FileText,
    label: 'Record payment',
    href: '/journal-entries/new',
    permission: 'journal-entries:create',
  },
  {
    id: 'create-client',
    icon: UserPlus,
    label: 'Create client',
    href: '/business-partners/new',
    permission: 'business-partners:create',
  },
  {
    id: 'create-expense',
    icon: PlusCircle,
    label: 'Create expense',
    href: '/purchase/orders/new',
    permission: 'purchase:create',
  },
  {
    id: 'new-sale',
    icon: ShoppingCart,
    label: 'New Sale',
    href: '/pos',
    permission: 'pos:create',
  },
]

export async function getQuickActions(
  userId: string,
  organizationId: string
): Promise<QuickAction[]> {
  const superAdmin = await isSuperAdmin(userId)

  const permissionSet = superAdmin
    ? new Set(ALL_ACTIONS.map((a) => a.permission))
    : new Set(await getUserPermissions(userId, organizationId))

  return ALL_ACTIONS.filter((action) =>
    permissionSet.has(action.permission)
  ).map((action) => ({
    id: action.id,
    icon: action.icon.name,
    label: action.label,
    href: action.href,
  }))
}
