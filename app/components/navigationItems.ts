import {
  Banknote,
  BookOpen,
  BookOpenIcon,
  Briefcase,
  Building2,
  BuildingIcon,
  Calendar1,
  CalendarDays,
  ChartColumnBig,
  Drumstick,
  FileText,
  FolderTreeIcon,
  HandshakeIcon,
  Mail,
  Monitor,
  NewspaperIcon,
  Notebook,
  NotebookPenIcon,
  Package,
  PackageCheck,
  PlusCircle,
  ScanLine,
  Settings,
  Shapes,
  ShieldXIcon,
  ShoppingCart,
  Store,
  Tag,
  Ticket,
  TicketsPlane,
  Truck,
  Users,
  UserStarIcon,
} from 'lucide-react'
import type { TranslationKey } from '~/i18n/types'

// Domain-specific accent colors per system.md
export const navigationItems = [
  {
    section: 'Admin',
    sectionKey: 'sidebar.sections.admin' as TranslationKey,
    icon: Drumstick,
    color: 'accent-admin', // indigo/brand for system pages
    items: [
      {
        name: 'Dashboard',
        nameKey: 'sidebar.items.dashboard' as TranslationKey,
        path: '/dashboard',
        icon: ChartColumnBig,
      },
      {
        name: 'Accounts',
        nameKey: 'sidebar.items.accounts' as TranslationKey,
        path: '/accounts',
        icon: BookOpenIcon,
      },
      {
        name: 'Organization',
        nameKey: 'sidebar.items.organization' as TranslationKey,
        path: '/organization',
        icon: Building2,
      },
      {
        name: 'Users',
        nameKey: 'sidebar.items.users' as TranslationKey,
        path: '/users',
        icon: Users,
      },
      {
        name: 'Permissions',
        nameKey: 'sidebar.items.permissions' as TranslationKey,
        path: '/permissions',
        icon: ShieldXIcon,
      },
      {
        name: 'Roles',
        nameKey: 'sidebar.items.roles' as TranslationKey,
        path: '/roles',
        icon: HandshakeIcon,
      },
      {
        name: 'Business Partners',
        nameKey: 'sidebar.items.businessPartners' as TranslationKey,
        path: '/business-partners',
        icon: UserStarIcon,
      },
      {
        name: 'Companies',
        nameKey: 'sidebar.items.companies' as TranslationKey,
        path: '/company',
        icon: BuildingIcon,
      },
      {
        name: 'Invitations',
        nameKey: 'sidebar.items.invitations' as TranslationKey,
        path: '/invitations',
        icon: Mail,
      },
      {
        name: 'Modules',
        nameKey: 'sidebar.items.modules' as TranslationKey,
        path: '/settings/modules',
        icon: Settings,
      },
    ],
  },
  {
    section: 'Inventory',
    sectionKey: 'sidebar.sections.inventory' as TranslationKey,
    icon: Package,
    color: 'accent-inventory', // amber for inventory domain
    items: [
      {
        name: 'Products',
        nameKey: 'sidebar.items.products' as TranslationKey,
        path: '/products',
        icon: Shapes,
      },
      {
        name: 'Categories',
        nameKey: 'sidebar.items.categories' as TranslationKey,
        path: '/categories',
        icon: Tag,
      },
      {
        name: 'Stock',
        nameKey: 'sidebar.items.stock' as TranslationKey,
        path: '/stock',
        icon: PackageCheck,
      },
      {
        name: 'Inventory Sucursal',
        nameKey: 'sidebar.items.inventorySucursal' as TranslationKey,
        path: '/inventory',
        icon: Store,
      },
      {
        name: 'Scan QR',
        nameKey: 'sidebar.items.scanQr' as TranslationKey,
        path: '/products/scan',
        icon: ScanLine,
      },
      {
        name: 'Suppliers',
        nameKey: 'sidebar.items.suppliers' as TranslationKey,
        path: '/suppliers',
        icon: Truck,
      },
    ],
  },
  {
    section: 'Purchase',
    sectionKey: 'sidebar.sections.purchase' as TranslationKey,
    icon: TicketsPlane,
    color: '',
    items: [
      {
        name: 'Orders',
        nameKey: 'sidebar.items.orders' as TranslationKey,
        path: '/purchase/orders',
        icon: Ticket,
      },
      {
        name: 'Quotations',
        nameKey: 'sidebar.items.quotations' as TranslationKey,
        path: '/purchase/quotations',
        icon: FileText,
      },
    ],
  },
  {
    section: 'Accounting',
    sectionKey: 'sidebar.sections.accounting' as TranslationKey,
    moduleKey: 'accounting',
    icon: Building2,
    color: 'accent-accounting', // emerald for accounting domain
    items: [
      {
        name: 'Journal Entries',
        nameKey: 'sidebar.items.journalEntries' as TranslationKey,
        path: '/journal-entries',
        icon: BookOpen,
      },
      {
        name: 'New Entry',
        nameKey: 'sidebar.items.newEntry' as TranslationKey,
        path: '/journal-entries/new',
        icon: PlusCircle,
      },
      {
        name: 'SAT Processor',
        nameKey: 'sidebar.items.satProcessor' as TranslationKey,
        path: '/sat-processor',
        icon: FolderTreeIcon,
      },
      {
        name: 'Invoices',
        nameKey: 'sidebar.items.invoices' as TranslationKey,
        path: '/invoices',
        icon: NewspaperIcon,
      },
      {
        name: 'Expenses',
        nameKey: 'sidebar.items.expenses' as TranslationKey,
        path: '/sat-processor',
        icon: Banknote,
      },
      {
        name: 'Accounting',
        nameKey: 'sidebar.items.accountingSettings' as TranslationKey,
        path: '/settings/accounting',
        icon: Settings,
      },
    ],
  },
  {
    section: 'POS',
    sectionKey: 'sidebar.sections.pos' as TranslationKey,
    moduleKey: 'pos',
    icon: ShoppingCart,
    color: 'accent-pos',
    items: [
      {
        name: 'Open POS',
        nameKey: 'sidebar.items.openPos' as TranslationKey,
        path: '/pos',
        icon: Monitor,
      },
      {
        name: 'Kitchen',
        nameKey: 'sidebar.items.kitchen' as TranslationKey,
        path: '/kitchen',
        icon: Drumstick,
      },
      {
        name: 'Terminals',
        nameKey: 'sidebar.items.posTerminals' as TranslationKey,
        path: '/pos-settings/terminals',
        icon: Settings,
      },
      {
        name: 'Cashiers',
        nameKey: 'sidebar.items.posCashiers' as TranslationKey,
        path: '/pos-settings/cashiers',
        icon: Users,
      },
      {
        name: 'Tables',
        nameKey: 'sidebar.items.posTables' as TranslationKey,
        path: '/pos-settings/tables',
        icon: Shapes,
      },
      {
        name: 'sucursal',
        nameKey: 'sidebar.items.sucursal' as TranslationKey,
        path: '/sucursal',
        icon: Store,
      },
    ],
  },
  {
    section: 'Appointments',
    sectionKey: 'sidebar.sections.appointments' as TranslationKey,
    moduleKey: 'appointments',
    icon: CalendarDays,
    color: 'accent-appointments', // blue for appointments domain
    items: [
      {
        name: 'Calendar',
        nameKey: 'sidebar.items.calendar' as TranslationKey,
        path: '/appointments',
        icon: Calendar1,
      },
      {
        name: 'Services',
        nameKey: 'sidebar.items.services' as TranslationKey,
        path: '/services',
        icon: Briefcase,
      },
    ],
  },
  {
    section: 'Reports',
    sectionKey: 'sidebar.sections.reports' as TranslationKey,
    icon: NotebookPenIcon,
    color: 'accent-accounting', // emerald for financial reports
    items: [
      {
        name: 'Financial Report',
        nameKey: 'sidebar.items.financialReport' as TranslationKey,
        path: '/reports',
        icon: Notebook,
      },
      {
        name: 'Inventory Report',
        nameKey: 'sidebar.items.inventoryReport' as TranslationKey,
        path: '/reports/inventory',
        icon: Package,
      },
    ],
  },
]
