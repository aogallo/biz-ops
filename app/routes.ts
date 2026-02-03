import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from '@react-router/dev/routes'

export default [
  index('routes/login.tsx'),
  route('/logout', 'routes/logout.tsx'),
  route('/welcome', 'routes/welcome.tsx'),

  // API Routes
  route('/api/auth/*', 'routes/api.auth.$.tsx'), // Required by Better Auth

  // Action routes
  route('/action/set-theme', 'routes/action.set-theme.tsx'),
  route('/action/switch-organization', 'routes/action.switch-organization.tsx'),

  // Public invitation acceptance
  route('/invitation/accept/:token', './routes/invitation/accept.$token.tsx'),

  // App routes with sidebar layout
  layout('./layout/AppLayout.tsx', [
    // Organization Routes
    ...prefix('organization', [
      index('./routes/organization/index.tsx'),
      route('/new', './routes/organization/create.tsx'),
      route('/:slug', './routes/organization/show.tsx'),
    ]),

    // Products Routes
    ...prefix('products', [
      index('./routes/products/index.tsx'),
      route('/new', './routes/products/create.tsx'),
      route('/:sku', './routes/products/show.tsx'),
      route('/:sku/edit', './routes/products/edit.tsx'),
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
      route('/:id', './routes/journal-entries/show.tsx'),
    ]),

    // Settings Routes
    ...prefix('settings', [
      route('/accounting', './routes/settings/accounting.tsx'),
    ]),

    // Dashboard Routes
    ...prefix('dashboard', [index('./routes/dashboard/index.tsx')]),

    // Appointments Routes
    ...prefix('appointments', [
      index('./routes/appointments/index.tsx'),
      route('/new', './routes/appointments/new.tsx'),
    ]),

    // Company Routes
    ...prefix('company', [
      index('./routes/company/index.tsx'),
      route('/new', './routes/company/create.tsx'),
      route('/:companyId', './routes/company/show.tsx'),
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
    ...prefix('reports', [index('./routes/reports/index.tsx')]),

    route('*', './routes/error/NotFound.tsx'),
  ]),
] satisfies RouteConfig
