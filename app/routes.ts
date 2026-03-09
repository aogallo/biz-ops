import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from '@react-router/dev/routes'

export default [
  index('routes/landing.tsx'),
  route('/login', 'routes/login.tsx'),
  route('/logout', 'routes/logout.tsx'),
  route('/welcome', 'routes/welcome.tsx'),

  // API Routes
  route('/api/auth/*', 'routes/api.auth.$.tsx'), // Required by Better Auth
  route('/api/qz/sign', 'routes/api.qz.sign.ts'), // QZ Tray request signing

  // Action routes
  route('/action/set-theme', 'routes/action.set-theme.tsx'),
  route('/action/set-locale', 'routes/action.set-locale.tsx'),
  route('/action/switch-organization', 'routes/action.switch-organization.tsx'),

  // Public invitation acceptance
  route('/invitation/accept/:token', './routes/invitation/accept.$token.tsx'),

  // POS Login / Logout (no auth required)
  route('/pos-login', './routes/pos-login.tsx'),
  route('/pos-logout', './routes/pos-logout.tsx'),

  // POS routes (full-screen, no sidebar)
  layout('./layout/PosLayout.tsx', [
    ...prefix('pos', [
      index('./routes/pos/index.tsx'),
      route('/terminal', './routes/pos/terminal.tsx'),
      ...prefix('sales', [
        index('./routes/pos/sales/index.tsx'),
        route('/:id', './routes/pos/sales/$id.tsx'),
      ]),
      route('/z-report/:id', './routes/pos/z-report/$id.tsx'),
    ]),
  ]),

  // App routes with sidebar layout
  layout('./layout/AppLayout.tsx', [
    //Home
    route('/home', './routes/home.tsx'),
    // Organization Routes
    ...prefix('organization', [
      index('./routes/organization/index.tsx'),
      route('/new', './routes/organization/create.tsx'),
      route('/:slug', './routes/organization/show.tsx'),
      route('/:slug/edit', './routes/organization/edit.tsx'),
    ]),

    // Products Routes
    ...prefix('products', [
      index('./routes/products/index.tsx'),
      route('/new', './routes/products/create.tsx'),
      route('/scan', './routes/products/scan.tsx'),
      route('/:sku', './routes/products/show.tsx'),
      route('/:sku/edit', './routes/products/edit.tsx'),
    ]),

    // Stock Movement Routes
    ...prefix('stock', [
      index('./routes/stock/index.tsx'),
      route('/new', './routes/stock/new.tsx'),
    ]),

    // Categories Routes
    ...prefix('categories', [
      index('./routes/categories/index.tsx'),
      route('/new', './routes/categories/create.tsx'),
      route('/:id/edit', './routes/categories/edit.tsx'),
    ]),

    // Pertner Routes
    ...prefix('business-partners', [
      index('./routes/business-partner/index.tsx'),
      route('/new', './routes/business-partner/create.tsx'),
      route('/:id', './routes/business-partner/show.tsx'),
      route('/:id/edit', './routes/business-partner/edit.tsx'),
    ]),

    // Invitation Routes
    ...prefix('invitations', [
      index('./routes/invitation/index.tsx'),
      route('/new', './routes/invitation/new.tsx'),
      route('/roles', './routes/invitation/roles.tsx'),
    ]),

    // User Routes
    ...prefix('users', [
      index('./routes/users/index.tsx'),
      route('/invite', './routes/users/invite.tsx'),
      route('/:memberId/roles', './routes/users/$memberId.roles.tsx'),
      route('/:memberId/module-permissions', './routes/users/$memberId.module-permissions.tsx'),
    ]),

    // Roles Routes
    ...prefix('roles', [
      index('./routes/roles/index.tsx'),
      route('/new', './routes/roles/create.tsx'),
      route('/assign', './routes/roles/assign.tsx'),
      route('/:id', './routes/roles/show.tsx'),
      route('/:id/edit', './routes/roles/edit.tsx'),
    ]),

    // SAT Processor Routes
    ...prefix('sat-processor', [index('./routes/sat-processor/index.tsx')]),
    ...prefix('journal-entries', [
      index('./routes/journal-entries/index.tsx'),
      route('/new', './routes/journal-entries/new.tsx'),
      route('/:id', './routes/journal-entries/show.tsx'),
      route('/:id/edit', './routes/journal-entries/$id.edit.tsx'),
    ]),

    // Settings Routes
    ...prefix('settings', [
      route('/accounting', './routes/settings/accounting.tsx'),
      route('/modules', './routes/settings/modules.tsx'),
    ]),

    // Dashboard Routes
    ...prefix('dashboard', [index('./routes/dashboard/index.tsx')]),

    // Appointments Routes
    ...prefix('appointments', [
      index('./routes/appointments/index.tsx'),
      route('/new', './routes/appointments/new.tsx'),
      route('/send-reminders', './routes/appointments/send-reminders.tsx'),
    ]),

    // Services Routes
    ...prefix('services', [
      index('./routes/services/index.tsx'),
      route('/new', './routes/services/create.tsx'),
      route('/:id/edit', './routes/services/edit.tsx'),
    ]),

    // Company Routes
    ...prefix('company', [
      index('./routes/company/index.tsx'),
      route('/new', './routes/company/create.tsx'),
      route('/:companyId', './routes/company/show.tsx'),
      route('/:companyId/edit', './routes/company/edit.tsx'),
    ]),
    ...prefix('permissions', [
      index('./routes/permissions/index.tsx'),
      route('/new', './routes/permissions/create.tsx'),
      route('/:id', './routes/permissions/show.tsx'),
      route('/:id/edit', './routes/permissions/edit.tsx'),
    ]),

    // Accounts Routes
    ...prefix('accounts', [
      index('./routes/accounts/index.tsx'),
      route('/new', './routes/accounts/create.tsx'),
      route('/:id', './routes/accounts/show.tsx'),
      route('/:id/edit', './routes/accounts/edit.tsx'),
    ]),

    // Report Routes
    ...prefix('reports', [
      index('./routes/reports/index.tsx'),
      route('/inventory', './routes/reports/inventory.tsx'),
    ]),

    // Invoice Routes
    ...prefix('invoices', [
      index('./routes/invoices/index.tsx'),
      route('/new', './routes/invoices/new.tsx'),
      route('/:id', './routes/invoices/$id.tsx'),
      route('/:id/edit', './routes/invoices/$id.edit.tsx'),
    ]),

    // POS Settings Routes
    ...prefix('pos-settings', [
      index('./routes/pos-settings/index.tsx'),
      route('/terminals', './routes/pos-settings/terminals.tsx'),
      route('/cashiers', './routes/pos-settings/cashiers.tsx'),
    ]),

    // Sucursal Routes
    ...prefix('sucursal', [
      index('./routes/sucursal/index.tsx'),
      route('/new', './routes/sucursal/create.tsx'),
      route('/:id/edit', './routes/sucursal/edit.tsx'),
    ]),

    // Inventory Routes
    ...prefix('inventory', [index('./routes/inventory/index.tsx')]),

    // Purchase Routes
    ...prefix('purchase', [
      route('/orders', './routes/orders/index.tsx'),
      route('/orders/new', './routes/orders/create.tsx'),
      route('/orders/:id', './routes/orders/show.tsx'),
      route('/quotations', './routes/quotations/index.tsx'),
      route('/quotations/new', './routes/quotations/create.tsx'),
      route('/quotations/:id', './routes/quotations/show.tsx'),
    ]),

    route('*', './routes/error/NotFound.tsx'),
  ]),
] satisfies RouteConfig
