import { Calculator, Calendar, Package, ShoppingCart } from 'lucide-react'

export const APP_MODULES = [
  'pos',
  'inventory',
  'accounting',
  'appointments',
] as const

export type ModuleKey = (typeof APP_MODULES)[number]
export type ModuleAccessLevel = 'none' | 'user' | 'admin'

export const MODULE_META: Record<
  ModuleKey,
  {
    label: string
    icon: typeof ShoppingCart
    description: string
    route: string
  }
> = {
  pos: {
    label: 'Punto de Venta',
    icon: ShoppingCart,
    description: 'Terminal y gestión de caja',
    route: '/pos',
  },
  inventory: {
    label: 'Inventario',
    icon: Package,
    description: 'Productos, stock y sucursales',
    route: '/products',
  },
  accounting: {
    label: 'Contabilidad',
    icon: Calculator,
    description: 'Facturas, journal entries, cuentas',
    route: '/invoices',
  },
  appointments: {
    label: 'Citas',
    icon: Calendar,
    description: 'Calendario y servicios',
    route: '/appointments',
  },
}
