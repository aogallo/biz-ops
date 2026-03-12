# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-tenant B2B SaaS application built with React Router v7, Cloudflare Workers, and Neon PostgreSQL. The app uses Better Auth for authentication with organization/team management and email OTP support.

## Common Commands

### Development

```bash
npm run dev                # Start development server (localhost:5173)
npm run build              # Build for production
npm run preview            # Preview production build locally
npm run typecheck          # Run TypeScript type checking
```

### Database (Drizzle ORM)

```bash
npm run cf-typegen         # Generate Cloudflare Worker types from wrangler.jsonc
npx drizzle-kit generate   # Generate migration files from schema
npx drizzle-kit migrate    # Run migrations
npx drizzle-kit studio     # Open Drizzle Studio (database GUI)
npx tsx scripts/seed.ts    # Seed database (Neon)
npx tsx scripts/seed-local.ts  # Seed local database
```

### Deployment (Cloudflare)

```bash
npm run deploy            # Build and deploy to Cloudflare Workers
wrangler deploy           # Deploy without rebuilding
wrangler tail             # View live logs
```

## Architecture

### Stack

- **Framework**: React Router v7 with SSR enabled
- **Runtime**: Cloudflare Workers (edge runtime)
- **Database**: Neon PostgreSQL (serverless Postgres)
- **ORM**: Drizzle ORM with dual connection support (Neon HTTP for prod, node-postgres for local)
- **Auth**: Better Auth with organization plugin and email OTP
- **UI**: shadcn/ui components (New York style, stone base color)
- **Styling**: Tailwind CSS v4 with CSS variables

### Path Aliases

The project uses `~/*` path alias pointing to `app/*`:

```typescript
import { Button } from '~/components/ui/button'
import { db } from '~/server/db'
```

### Project Structure

```
app/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── AppSidebar.tsx  # Main sidebar component
├── features/           # Feature-based modules (server logic + components only)
│   └── organization/   # Example feature
│       ├── components/ # Feature-specific components
│       ├── server/     # Server-side logic
│       │   ├── repository.ts
│       │   └── actions/
│       └── schemas.ts  # Zod schemas (drizzle-zod)
├── hooks/              # Custom React hooks
├── layout/             # Layout components
│   └── AppLayout.tsx   # Main app layout with sidebar
├── lib/                # Utilities
│   └── utils.ts        # cn() helper and utilities
├── routes/             # ALL routes live here (file-based routing ready)
│   ├── login.tsx       # Login page
│   ├── organization/   # Organization routes
│   │   ├── index.tsx
│   │   └── create.tsx
│   ├── users/          # Users routes
│   ├── roles/          # Roles routes
│   └── ...
├── server/             # Server-side code
│   ├── auth-client.ts  # Better Auth client config
│   ├── auth-server.ts  # Better Auth server config
│   └── db/             # Database layer
│       ├── schema.ts   # Drizzle schema (tables & relations)
│       ├── index.ts    # DB connection selector (local vs Neon)
│       ├── local.ts    # Local Postgres connection (node-postgres)
│       └── neon.ts     # Neon HTTP connection
├── app.css             # Global styles (Tailwind + theme variables)
├── index.ts            # App entry point
└── routes.ts           # Route configuration
```

**Note**: All routes are placed in `/app/routes/` to prepare for file-based routing. Features only contain server logic (repository, actions) and components.

### Database Architecture

The application uses a **dual database connection strategy**:

- **Production/Neon**: Uses `@neondatabase/serverless` with HTTP driver (serverless-optimized)
- **Local Development**: Uses `pg` (node-postgres) with connection pooling
- **Selection**: Automatic based on `NODE_ENV === "development"` or `USE_LOCAL_DB === "true"`

**Database schema** (`app/server/db/schema.ts`):

- Multi-tenant design with `organization`, `member`, and `invitation` tables
- Better Auth tables: `user`, `session`, `account`, `verification`
- Full Drizzle relations defined for type-safe joins

**Schema location**: The schema is defined in `app/server/db/schema.ts` (NOT `auth-schema.ts` in root, which appears to be legacy).

### Authentication Flow

Better Auth is configured with:

- Email/password authentication
- Email OTP (one-time password) for verification
- Organization plugin for multi-tenancy
- Drizzle adapter with Neon HTTP provider
- Custom UUID generation using `crypto.randomUUID()`

**Auth files**:

- `app/server/auth-server.ts`: Server-side Better Auth instance
- `app/server/auth-client.ts`: Client-side auth configuration

### Routing

Routes are defined in `app/routes.ts` using React Router v7's configuration. All routes are in `/app/routes/`:

```typescript
;[
  index('routes/login.tsx'), // /
  layout('./layout/AppLayout.tsx', [
    // Nested routes with sidebar
    prefix('organization', [
      index('./routes/organization/index.tsx'), // /organization
      route('/new', './routes/organization/create.tsx'), // /organization/new
    ]),
    prefix('users', [
      index('./routes/users/index.tsx'), // /users
      route('/create', './routes/users/create.tsx'), // /users/create
    ]),
  ]),
]
```

Layout wraps routes with `AppSidebar` and `SidebarProvider`.

**Note**: The project is preparing for file-based routing, so all routes are centralized in `/app/routes/`.

### Cloudflare Workers Integration

The app is deployed as a Cloudflare Worker with React Router SSR:

- **Entry point**: `workers/app.ts` (specified in `wrangler.jsonc`)
- **Environment**: Variables defined in `wrangler.jsonc` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
- **Context**: Cloudflare env and execution context available in loaders/actions via `context.cloudflare`

## Development Patterns

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Components are installed to `app/components/ui/` and use the `~/*` path alias.

### Creating New Features

Follow this two-step structure:

**Step 1: Create feature logic in `app/features/`:**

1. Create feature directory (e.g., `app/features/invoices/`)
2. Add `server/repository.ts` for database access
3. Add `server/actions/` for business logic
4. Add `schemas.ts` for Zod validation schemas
5. Add `components/` for feature-specific UI components (optional)

**Step 2: Create routes in `app/routes/`:**

1. Create route directory (e.g., `app/routes/invoices/`)
2. Add route files (`index.tsx`, `create.tsx`, `edit.tsx`, etc.)
3. Import server logic from features: `import { invoicesRepository } from "~/features/invoices/server/repository"`
4. Register routes in `app/routes.ts`

### Database Changes

1. Modify schema in `app/server/db/**`
2. Generate migration: `npx drizzle-kit generate`
3. Apply migration: `npx drizzle-kit migrate`
4. Update TypeScript types: `npm run typecheck`

### Working with Database Connections

- **Local development**: Set `USE_LOCAL_DB=true` or run in development mode
- **Production**: Automatically uses Neon HTTP connection
- The connection is selected in `app/server/db/index.ts`

## Important Notes

- **SSR is enabled**: All routes support server-side rendering (configured in `react-router.config.ts`)
- **Edge runtime**: Code runs on Cloudflare Workers, not Node.js (avoid Node.js-only APIs)
- **Environment variables**: Production secrets are in `wrangler.jsonc` (should be moved to Cloudflare dashboard)
- **Database schema**: The canonical schema is `app/server/db/schema.ts`, not the root `auth-schema.ts`

## Code Architecture & Standards

### Feature Structure

Features contain **server logic and components only**. Routes live in `/app/routes/`.

```
app/features/<feature-name>/
├── server/              # Server-side logic
│   ├── repository.ts    # Database access layer
│   └── actions/         # Business logic layer
├── components/          # Feature-specific components (optional)
├── schemas.ts           # Zod schemas from drizzle-zod
└── types.ts            # Feature-specific types (optional)

app/routes/<feature-name>/
├── index.tsx           # List view
├── create.tsx          # Create form
├── edit.tsx            # Edit form
└── show.tsx            # Detail view
```

**Example**:

```
app/features/users/
├── server/
│   ├── repository.ts           # UsersRepository class
│   └── actions/
│       └── create-user.action.ts
├── components/
│   └── user-form.tsx
└── schemas.ts                  # createUserSchema, updateUserSchema

app/routes/users/
├── index.tsx       # List users (imports from ~/features/users/server/repository)
├── create.tsx      # Create user form
└── edit.tsx        # Edit user form
```

### Repository Pattern (Data Access Layer)

**ALWAYS** use repository classes for database access. **NEVER** access the database directly from actions, loaders or routes.

```typescript
// ✅ CORRECT - users.repository.ts
import { db } from '~/server/db'
import { userModel } from '~/server/db/schemas/auth'
import { eq } from 'drizzle-orm'

export class UsersRepository {
  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, email))
      .limit(1)
    return user
  }

  async create(data: typeof userModel.$inferInsert) {
    const [user] = await db.insert(userModel).values(data).returning()
    return user
  }

  async updateById(id: string, data: Partial<typeof userModel.$inferInsert>) {
    const [user] = await db
      .update(userModel)
      .set(data)
      .where(eq(userModel.id, id))
      .returning()
    return user
  }
}

export const usersRepository = new UsersRepository()
```

```typescript
// ✅ CORRECT - create-user.action.ts
import { usersRepository } from '../repository/users.repository'

export async function createUserAction(data: CreateUserInput) {
  // Check if user exists
  const existingUser = await usersRepository.findByEmail(data.email)
  if (existingUser) {
    throw new Error('User already exists')
  }

  // Create user
  return await usersRepository.create(data)
}
```

```typescript
// ❌ WRONG - Accessing database directly from action
import { db } from '~/server/db'

export async function createUserAction(data: CreateUserInput) {
  // Don't do this - use repository instead
  const [user] = await db.insert(userModel).values(data).returning()
  return user
}
```

### Type Safety with drizzle-zod

**NEVER** create manual types for database operations. Use `drizzle-zod` to generate schemas and types.

```bash
# Install drizzle-zod if not already installed
npm install drizzle-zod
```

```typescript
// ✅ CORRECT - Using drizzle-zod
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { userModel } from '~/server/db/schemas/auth'
import { z } from 'zod'

// Generate base schemas from Drizzle
export const insertUserSchema = createInsertSchema(userModel)
export const selectUserSchema = createSelectSchema(userModel)

// Extend schemas with additional validation
export const createUserSchema = insertUserSchema.extend({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  name: z.string().min(1, 'Name is required'),
})

// Infer types from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>
export type User = z.infer<typeof selectUserSchema>
```

```typescript
// ❌ WRONG - Manual type definitions
interface CreateUserInput {
  email: string
  password: string
  name: string
}

interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}
```

### Input Validation in Actions

**ALWAYS** validate input using Zod schemas. **NEVER** use type casting (`as string`, `as any`).

```typescript
// ✅ CORRECT - Using Zod validation
import { createUserSchema } from '../types'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()

  // Parse and validate form data
  const result = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return {
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors,
    }
  }

  // result.data is fully typed and validated
  const user = await createUserAction(result.data)
  return redirect('/users')
}
```

```typescript
// ❌ WRONG - Type casting without validation
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()

  // Don't do this - no validation, unsafe type casting
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Don't do this - extremely unsafe
  const data = (await request.json()) as any
}
```

### Extending Schemas

When you need additional validation beyond the database schema, extend the schema instead of creating new types.

```typescript
// ✅ CORRECT - Extending schemas
import { createInsertSchema } from 'drizzle-zod'
import { userModel } from '~/server/db/schemas/auth'
import { z } from 'zod'

// Base schema from database
const baseUserSchema = createInsertSchema(userModel)

// Extend for specific use cases
export const createUserSchema = baseUserSchema
  .extend({
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const updateUserSchema = baseUserSchema
  .partial() // All fields optional
  .omit({ password: true }) // Remove password field

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
```

```typescript
// ❌ WRONG - Creating duplicate types
interface CreateUserData {
  email: string
  password: string
  confirmPassword: string
}

interface UpdateUserData {
  email?: string
  name?: string
}
```

### Complete Example

Here's a complete example following all standards:

**Repository** (`app/features/users/server/repository/users.repository.ts`):

```typescript
import { db } from '~/server/db'
import { userModel, memberModel } from '~/server/db/schemas/auth'
import { eq } from 'drizzle-orm'
import type { CreateUserInput, UpdateUserInput } from '../../types'

export class UsersRepository {
  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, email))
      .limit(1)
    return user
  }

  async create(data: CreateUserInput) {
    const [user] = await db.insert(userModel).values(data).returning()
    return user
  }

  async updateById(id: string, data: UpdateUserInput) {
    const [user] = await db
      .update(userModel)
      .set(data)
      .where(eq(userModel.id, id))
      .returning()
    return user
  }

  async findByOrganization(organizationId: string) {
    return await db
      .select({
        user: userModel,
      })
      .from(userModel)
      .innerJoin(memberModel, eq(memberModel.userId, userModel.id))
      .where(eq(memberModel.organizationId, organizationId))
  }
}

export const usersRepository = new UsersRepository()
```

**Schemas** (`app/features/users/schemas.ts`):

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { userModel } from '~/server/db/schemas/auth'
import { z } from 'zod'

export const insertUserSchema = createInsertSchema(userModel)
export const selectUserSchema = createSelectSchema(userModel)

export const createUserSchema = insertUserSchema.extend({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  organizationId: z.string().uuid('Invalid organization ID'),
})

export const updateUserSchema = insertUserSchema
  .partial()
  .omit({ id: true, createdAt: true })

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type User = z.infer<typeof selectUserSchema>
```

**Action** (`app/features/users/server/actions/create-user.action.ts`):

```typescript
import { hashPassword } from 'better-auth/crypto'
import { usersRepository } from '../repository/users.repository'
import type { CreateUserInput } from '../../types'

export async function createUserAction(input: CreateUserInput) {
  // Check if user exists
  const existingUser = await usersRepository.findByEmail(input.email)
  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  // Hash password
  const hashedPassword = await hashPassword(input.password)

  // Create user via repository
  const user = await usersRepository.create({
    ...input,
    password: hashedPassword,
    emailVerified: false,
  })

  return user
}
```

**Route** (`app/routes/users/create.tsx`):

```typescript
import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/create";
import { createUserAction } from "~/features/users/server/actions/create-user.action";
import { createUserSchema } from "~/features/users/schemas";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Validate input with Zod
  const result = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationId: formData.get("organizationId"),
  });

  if (!result.success) {
    return {
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await createUserAction(result.data);
    return redirect("/users");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

export default function CreateUser() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      {actionData?.error && (
        <div className="text-red-600">{actionData.error}</div>
      )}

      <input name="name" required />
      {actionData?.fieldErrors?.name && (
        <span className="text-red-600">{actionData.fieldErrors.name}</span>
      )}

      <input name="email" type="email" required />
      {actionData?.fieldErrors?.email && (
        <span className="text-red-600">{actionData.fieldErrors.email}</span>
      )}

      <input name="password" type="password" required />
      {actionData?.fieldErrors?.password && (
        <span className="text-red-600">{actionData.fieldErrors.password}</span>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create User"}
      </button>
    </Form>
  );
}
```

### Summary of Rules

1. **Feature Structure**: Features contain `server/repository.ts`, `server/actions/`, `schemas.ts`, and optional `components/`. Routes go in `/app/routes/<feature-name>/`
2. **Repository Pattern**: Always use repository classes for database access, never access DB directly from actions or routes
3. **Type Safety**: Use `drizzle-zod` with `createInsertSchema` and `createSelectSchema` to generate types from database schemas
4. **No Type Casting**: Never use `as string`, `as any`, or similar type assertions - use Zod validation instead
5. **Schema Extension**: Extend base schemas with `.extend()` or `.refine()` for additional validation rules
6. **Input Validation**: Always validate user input with Zod schemas using `.safeParse()` before processing
7. **Route Location**: ALL routes live in `/app/routes/` directory, not in features (file-based routing ready)
8. **Table Pagination**: Every table displaying data MUST implement pagination. Use server-side pagination with URL searchParams for page state. Default page size: 10 items.
9. **Drizzle Migrations**: Every time update or create table use the command `npm run db:generate`
10. **Always Use DataTable Component**: When displaying tabular data, ALWAYS use the `~/components/dataTable/DataTable.tsx` component. Do not create tables from scratch using raw Table components. The DataTable component provides built-in sorting, pagination, column visibility, and row selection.
11. **Test-Driven Development (TDD)**: Every new feature, bug fix, or update MUST follow the Red-Green-Refactor cycle:
    1. **Red**: Write a failing test that describes the expected behavior BEFORE writing any implementation code
    2. **Green**: Write the minimum amount of code necessary to make the test pass
    3. **Refactor**: Clean up the code while keeping tests green
    - Schema changes → write schema validation tests first
    - New actions → write action tests with mocked repos first
    - New components → write component tests with `createRoutesStub` first
    - Bug fixes → write a test that reproduces the bug first, then fix it
    - No implementation code is written without a corresponding test

12. **Single Responsibility for Actions (SOLID)**: When creating a component with a form that uses `useFetcher`, that component should be responsible for handling its own action responses (errors and success messages via toast notifications). Avoid having multiple unrelated action types in a single route action function. Each action should have a single responsibility. If a route needs multiple actions, consider:
    - Using separate routes for each action
    - Creating dedicated action components that use `useFetcher` with their own response handling
    - Splitting the action handler into separate functions with clear routing patterns

# React Router v7 Framework Guidelines

This project uses React Router v7 with loaders and actions for data fetching and mutations. This is a **server-first framework** - loaders and actions run on the server, enabling SSR, progressive enhancement, and better performance.

## Core Principles

### 1. Server-Side Data Fetching (Loaders)

- **ALWAYS** use `loader` functions for data fetching, **NEVER** create separate API endpoints
- Loaders run on the server during SSR and on subsequent navigations
- Multiple data sources can be fetched in parallel using `Promise.all()`
- Return data directly from loaders - React Router handles serialization

### 2. URL as Source of Truth

- Use `searchParams` for filtering, pagination, and UI state that should be shareable
- Changing search params automatically triggers loader re-runs
- Browser back/forward works automatically
- Deep linking works out of the box

### 3. Progressive Enhancement

- Forms work without JavaScript using `<Form>` component
- Actions run on the server whether JS is enabled or not
- Provides excellent accessibility and SEO

## Data Fetching Patterns

### Basic Loader

```typescript
import type { Route } from "./+types/users";
import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  const users = await db.select().from(user).where(eq(user.orgId, session.orgId));

  return { users };
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;
  return <div>{users.map(u => <div key={u.id}>{u.name}</div>)}</div>;
}
```

### Loader with SearchParams (Filtering)

```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  // Fetch data based on URL parameter
  const users = await db.getUsersByOrganization(organizationId);

  return { users, selectedOrgId: organizationId };
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { users, selectedOrgId } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Select
      value={selectedOrgId || ""}
      onValueChange={(id) => setSearchParams({ organizationId: id })}
    >
      {/* Changing this updates URL and triggers loader automatically */}
    </Select>
  );
}
```

### Parallel Data Fetching

```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)
  const orgId = url.searchParams.get('organizationId')

  // Fetch multiple data sources in parallel
  const [isSuperAdmin, organizations, users] = await Promise.all([
    checkSuperAdmin(session.user.id),
    getUserOrganizations(session.user.id),
    orgId ? getUsersByOrg(orgId) : Promise.resolve([]),
  ])

  return {
    isSuperAdmin,
    organizations,
    users,
    selectedOrgId: orgId || organizations[0]?.id,
  }
}
```

## Data Mutation Patterns

### Basic Action with Form

```typescript
import { Form, redirect, useActionData, useNavigation } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  // Validate
  if (!name || !email) {
    return { error: "Name and email are required" };
  }

  try {
    await db.insert(user).values({ name, email });
    return redirect("/users");
  } catch (error) {
    return { error: "Failed to create user" };
  }
}

export default function CreateUser() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      {actionData?.error && <div className="error">{actionData.error}</div>}

      <input name="name" required />
      <input name="email" type="email" required />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create User"}
      </button>
    </Form>
  );
}
```

### Action with Complex Validation

```typescript
export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const formData = await request.formData()

  const organizationId = formData.get('organizationId') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Field validation
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  // Permission checks
  const hasPermission = await checkPermission(session.user.id, organizationId)
  if (!hasPermission) {
    return { error: "You don't have permission to create users" }
  }

  // Duplicate checks
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  })
  if (existing) {
    return { error: 'A user with this email already exists' }
  }

  try {
    await db.transaction(async (tx) => {
      const userId = crypto.randomUUID()
      await tx.insert(user).values({ id: userId, email })
      await tx.insert(member).values({ userId, organizationId })
    })

    return redirect('/users')
  } catch (error) {
    return { error: 'Failed to create user' }
  }
}
```

### Action with Result Display (No Redirect)

```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const users = JSON.parse(formData.get("users") as string);

  const result = { created: 0, failed: 0, errors: [] };

  for (const userData of users) {
    try {
      await createUser(userData);
      result.created++;
    } catch (error) {
      result.failed++;
      result.errors.push({ email: userData.email, error: error.message });
    }
  }

  // Don't redirect if there are errors - show results
  return { result };
}

export default function BulkCreate() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      {actionData?.result && (
        <div>
          <p>Created: {actionData.result.created}</p>
          <p>Failed: {actionData.result.failed}</p>
          {actionData.result.errors.map(e => <div key={e.email}>{e.error}</div>)}
        </div>
      )}

      {/* Form fields */}
    </Form>
  );
}
```

## Form Handling Best Practices

### Using React Router Form Component

```typescript
import { Form } from "react-router";

// ✅ CORRECT - Uses React Router Form
<Form method="post">
  <input name="email" type="email" required />
  <button type="submit">Submit</button>
</Form>

// ❌ WRONG - Regular HTML form or manual fetch
<form onSubmit={handleSubmit}>...</form>
```

### Uncontrolled Inputs (Preferred for Forms)

```typescript
// ✅ CORRECT - Let React Router handle form data
<Form method="post">
  <input name="email" type="email" required />
  <input name="password" type="password" required />
</Form>

// ❌ AVOID - Unnecessary controlled inputs for form submission
const [email, setEmail] = useState("");
<Form method="post">
  <input value={email} onChange={(e) => setEmail(e.target.value)} />
</Form>
```

**Note**: Use controlled inputs only when you need:

- Real-time validation
- Character counting
- Auto-formatting (e.g., phone numbers)
- Dependent field updates (e.g., slug generation from name)

### Hidden Inputs for Context

```typescript
export default function CreateUser({ loaderData }: Route.ComponentProps) {
  const { selectedOrganizationId } = loaderData;

  return (
    <Form method="post">
      {/* Pass context via hidden input */}
      <input type="hidden" name="organizationId" value={selectedOrganizationId} />

      <input name="name" required />
      <button type="submit">Create</button>
    </Form>
  );
}
```

### Loading States with useNavigation

```typescript
import { useNavigation } from "react-router";

export default function CreateUser() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isLoading = navigation.state === "loading";

  return (
    <Form method="post">
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create User"}
      </button>
    </Form>
  );
}
```

### Error Handling with useActionData

```typescript
export default function CreateUser() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      {actionData?.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {/* Form fields */}
    </Form>
  );
}
```

## Advanced Patterns

### useFetcher for Non-Navigation Actions

```typescript
import { useFetcher } from "react-router";

export default function DeleteButton({ userId }: { userId: string }) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action={`/users/${userId}/delete`}>
      <button type="submit" disabled={fetcher.state !== "idle"}>
        {fetcher.state === "submitting" ? "Deleting..." : "Delete"}
      </button>
    </fetcher.Form>
  );
}
```

### Optimistic UI Updates

```typescript
export default function TodoItem({ todo }: { todo: Todo }) {
  const fetcher = useFetcher();

  // Optimistically show updated state
  const isCompleted = fetcher.formData
    ? fetcher.formData.get("completed") === "true"
    : todo.completed;

  return (
    <fetcher.Form method="post" action={`/todos/${todo.id}`}>
      <input type="hidden" name="completed" value={String(!isCompleted)} />
      <button type="submit">
        {isCompleted ? "✓" : "○"}
      </button>
    </fetcher.Form>
  );
}
```

## Anti-Patterns to Avoid

### ❌ Don't Create REST API Endpoints

```typescript
// ❌ WRONG - Separate API endpoint
;(route('/api/users/list', 'routes/api.users.list.tsx'),
  // Component makes fetch call
  useEffect(() => {
    fetch('/api/users/list')
      .then((r) => r.json())
      .then(setUsers)
  }, []))
```

```typescript
// ✅ CORRECT - Loader in route
export async function loader() {
  const users = await db.query.user.findMany()
  return { users }
}
```

### ❌ Don't Use useEffect for Data Fetching

```typescript
// ❌ WRONG
const [users, setUsers] = useState([])
useEffect(() => {
  fetch('/api/users')
    .then((r) => r.json())
    .then(setUsers)
}, [])
```

```typescript
// ✅ CORRECT
export async function loader() {
  const users = await db.query.user.findMany()
  return { users }
}
```

### ❌ Don't Use Component State for URL-Shareable Data

```typescript
// ❌ WRONG - Filter state not in URL
const [selectedOrg, setSelectedOrg] = useState('')
```

```typescript
// ✅ CORRECT - Filter in URL searchParams
const [searchParams, setSearchParams] = useSearchParams()
const selectedOrg = searchParams.get('organizationId')
```

### ❌ Don't Use Controlled Forms Unnecessarily

```typescript
// ❌ WRONG - Unnecessary state management
const [name, setName] = useState("");
const [email, setEmail] = useState("");

<Form method="post">
  <input value={name} onChange={(e) => setName(e.target.value)} />
  <input value={email} onChange={(e) => setEmail(e.target.value)} />
</Form>
```

```typescript
// ✅ CORRECT - Let React Router handle it
<Form method="post">
  <input name="name" required />
  <input name="email" type="email" required />
</Form>
```

## Type Safety

React Router v7 generates route types automatically:

```typescript
import type { Route } from './+types/users'

export async function loader({ request }: Route.LoaderArgs) {
  // Full type inference
  return { users: [] }
}

export async function action({ request }: Route.ActionArgs) {
  // Full type inference
  const formData = await request.formData()
  return { error: 'Something went wrong' }
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  // loaderData is fully typed based on loader return type
  const { users } = loaderData
}
```

## Common Patterns in This Codebase

### Authentication in Loaders

```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request) // Throws redirect if not authenticated
  return { user: session.user }
}
```

### Permission Checks in Actions

```typescript
export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)

  const isSuperAdmin = await isSuperAdmin(db, session.user.id)
  if (!isSuperAdmin) {
    return { error: 'Permission denied' }
  }

  // Proceed with mutation
}
```

### Multi-Org Filtering Pattern

```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const orgId = url.searchParams.get('organizationId')

  const [orgs, data] = await Promise.all([
    getUserOrganizations(session.user.id),
    orgId ? getDataForOrg(orgId) : Promise.resolve([]),
  ])

  const selectedOrgId = orgId || orgs[0]?.organization.id

  return { orgs, data, selectedOrgId }
}
```

## Testing Loaders and Actions

```typescript
import { loader, action } from './users'

describe('users loader', () => {
  it('fetches users for organization', async () => {
    const request = new Request('http://localhost/users?organizationId=123')
    const result = await loader({ request, params: {}, context: {} })

    expect(result.users).toHaveLength(5)
  })
})

describe('users action', () => {
  it('creates user and redirects', async () => {
    const formData = new FormData()
    formData.set('name', 'John')
    formData.set('email', 'john@example.com')

    const request = new Request('http://localhost/users', {
      method: 'POST',
      body: formData,
    })

    const result = await action({ request, params: {}, context: {} })

    expect(result).toBeInstanceOf(Response)
    expect(result.status).toBe(302)
  })
})
```

## Performance Considerations

1. **Parallel Fetching**: Use `Promise.all()` in loaders
2. **Caching**: React Router caches loader data automatically
3. **Pagination**: Add `limit` and `offset` to searchParams
4. **Optimistic UI**: Use `useFetcher` with optimistic updates
5. **Database Indexes**: Ensure proper indexes on filtered columns

## Migration from API Endpoints

When refactoring from REST API endpoints:

1. **Move data fetching logic** from `api.*.tsx` into route loaders
2. **Move mutation logic** from API endpoints into route actions
3. **Replace `useEffect` + `fetch`** with loader data
4. **Replace manual fetch on submit** with `<Form>` component
5. **Use `useSearchParams`** instead of component state for filters
6. **Delete old API route files** after migration
7. **Update `routes.ts`** to remove API endpoint definitions

This refactoring improves:

- Performance (server-side data fetching, no waterfalls)
- SEO (all data rendered server-side)
- UX (progressive enhancement, works without JS)
- DX (simpler code, better type safety)
- Maintainability (consistent patterns throughout)
