import 'dotenv/config'
import { db } from '../app/server/db'
import { permissionModel } from '../app/server/db/schemas/auth'

const permissions = [
  {
    resource: 'organization',
    action: 'create',
    description: 'Create organization',
  },
  {
    resource: 'organization',
    action: 'view',
    description: 'View organization',
  },
  {
    resource: 'organization',
    action: 'update',
    description: 'Update organization',
  },
  {
    resource: 'organization',
    action: 'delete',
    description: 'Delete organization',
  },

  { resource: 'products', action: 'create', description: 'Create product' },
  { resource: 'products', action: 'view', description: 'View product' },
  { resource: 'products', action: 'update', description: 'Update product' },
  { resource: 'products', action: 'delete', description: 'Delete product' },

  { resource: 'stock', action: 'create', description: 'Create stock movement' },
  { resource: 'stock', action: 'view', description: 'View stock movement' },
  { resource: 'stock', action: 'update', description: 'Update stock movement' },
  { resource: 'stock', action: 'delete', description: 'Delete stock movement' },

  { resource: 'categories', action: 'create', description: 'Create category' },
  { resource: 'categories', action: 'view', description: 'View category' },
  { resource: 'categories', action: 'update', description: 'Update category' },
  { resource: 'categories', action: 'delete', description: 'Delete category' },

  {
    resource: 'business-partners',
    action: 'create',
    description: 'Create business partner',
  },
  {
    resource: 'business-partners',
    action: 'view',
    description: 'View business partner',
  },
  {
    resource: 'business-partners',
    action: 'update',
    description: 'Update business partner',
  },
  {
    resource: 'business-partners',
    action: 'delete',
    description: 'Delete business partner',
  },

  {
    resource: 'invitations',
    action: 'create',
    description: 'Create invitation',
  },
  { resource: 'invitations', action: 'view', description: 'View invitation' },
  {
    resource: 'invitations',
    action: 'update',
    description: 'Update invitation',
  },
  {
    resource: 'invitations',
    action: 'delete',
    description: 'Delete invitation',
  },

  { resource: 'users', action: 'create', description: 'Create user' },
  { resource: 'users', action: 'view', description: 'View user' },
  { resource: 'users', action: 'update', description: 'Update user' },
  { resource: 'users', action: 'delete', description: 'Delete user' },

  { resource: 'roles', action: 'create', description: 'Create role' },
  { resource: 'roles', action: 'view', description: 'View role' },
  { resource: 'roles', action: 'update', description: 'Update role' },
  { resource: 'roles', action: 'delete', description: 'Delete role' },

  {
    resource: 'sat-processor',
    action: 'view',
    description: 'View SAT processor',
  },
  {
    resource: 'sat-processor',
    action: 'process',
    description: 'Process SAT data',
  },

  {
    resource: 'journal-entries',
    action: 'create',
    description: 'Create journal entry',
  },
  {
    resource: 'journal-entries',
    action: 'view',
    description: 'View journal entry',
  },
  {
    resource: 'journal-entries',
    action: 'update',
    description: 'Update journal entry',
  },
  {
    resource: 'journal-entries',
    action: 'delete',
    description: 'Delete journal entry',
  },

  { resource: 'settings', action: 'view', description: 'View settings' },
  { resource: 'settings', action: 'update', description: 'Update settings' },

  { resource: 'dashboard', action: 'view', description: 'View dashboard' },

  {
    resource: 'appointments',
    action: 'create',
    description: 'Create appointment',
  },
  { resource: 'appointments', action: 'view', description: 'View appointment' },
  {
    resource: 'appointments',
    action: 'update',
    description: 'Update appointment',
  },
  {
    resource: 'appointments',
    action: 'delete',
    description: 'Delete appointment',
  },

  { resource: 'services', action: 'create', description: 'Create service' },
  { resource: 'services', action: 'view', description: 'View service' },
  { resource: 'services', action: 'update', description: 'Update service' },
  { resource: 'services', action: 'delete', description: 'Delete service' },

  { resource: 'company', action: 'create', description: 'Create company' },
  { resource: 'company', action: 'view', description: 'View company' },
  { resource: 'company', action: 'update', description: 'Update company' },
  { resource: 'company', action: 'delete', description: 'Delete company' },

  {
    resource: 'permissions',
    action: 'create',
    description: 'Create permission',
  },
  { resource: 'permissions', action: 'view', description: 'View permission' },
  {
    resource: 'permissions',
    action: 'update',
    description: 'Update permission',
  },
  {
    resource: 'permissions',
    action: 'delete',
    description: 'Delete permission',
  },

  { resource: 'accounts', action: 'create', description: 'Create account' },
  { resource: 'accounts', action: 'view', description: 'View account' },
  { resource: 'accounts', action: 'update', description: 'Update account' },
  { resource: 'accounts', action: 'delete', description: 'Delete account' },

  { resource: 'reports', action: 'view', description: 'View report' },
  { resource: 'reports', action: 'export', description: 'Export report' },

  { resource: 'invoices', action: 'create', description: 'Create invoice' },
  { resource: 'invoices', action: 'view', description: 'View invoice' },
  { resource: 'invoices', action: 'update', description: 'Update invoice' },
  { resource: 'invoices', action: 'delete', description: 'Delete invoice' },

  {
    resource: 'pos-settings',
    action: 'view',
    description: 'View POS settings',
  },
  {
    resource: 'pos-settings',
    action: 'update',
    description: 'Update POS settings',
  },

  { resource: 'sucursal', action: 'create', description: 'Create sucursal' },
  { resource: 'sucursal', action: 'view', description: 'View sucursal' },
  { resource: 'sucursal', action: 'update', description: 'Update sucursal' },
  { resource: 'sucursal', action: 'delete', description: 'Delete sucursal' },

  {
    resource: 'unit-of-measure',
    action: 'create',
    description: 'Create unit of measure',
  },
  {
    resource: 'unit-of-measure',
    action: 'view',
    description: 'View unit of measure',
  },
  {
    resource: 'unit-of-measure',
    action: 'update',
    description: 'Update unit of measure',
  },
  {
    resource: 'unit-of-measure',
    action: 'delete',
    description: 'Delete unit of measure',
  },

  { resource: 'inventory', action: 'view', description: 'View inventory' },
  { resource: 'inventory', action: 'update', description: 'Update inventory' },

  { resource: 'purchase', action: 'create', description: 'Create purchase' },
  { resource: 'purchase', action: 'view', description: 'View purchase' },
  { resource: 'purchase', action: 'update', description: 'Update purchase' },
  { resource: 'purchase', action: 'delete', description: 'Delete purchase' },

  { resource: 'pos', action: 'view', description: 'View POS' },
  { resource: 'pos', action: 'create', description: 'Create POS sale' },
  { resource: 'pos', action: 'cancel', description: 'Cancel POS sale' },

  { resource: 'kitchen', action: 'view', description: 'View kitchen' },
]

async function main() {
  try {
    console.log('Seeding system permissions...')

    const existingPermissions = await db
      .insert(permissionModel)
      .values(permissions)
      .onConflictDoNothing()
      .returning()

    console.log(`Inserted ${existingPermissions.length} system permissions.`)
  } catch (error) {
    console.error('Error seeding system permissions:', error)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
