# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-tenant B2B SaaS application built with React Router v7, Cloudflare Workers, and Neon PostgreSQL. The app uses Better Auth for authentication with organization/team management and email OTP support.

## Common Commands

### Development
```bash
npm run dev                 # Start development server (localhost:5173)
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
npm run deploy             # Build and deploy to Cloudflare Workers
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
import { Button } from "~/components/ui/button";
import { db } from "~/server/db";
```

### Project Structure

```
app/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── AppSidebar.tsx  # Main sidebar component
├── features/           # Feature-based modules
│   └── organization/   # Organization feature
│       └── routes/     # Organization routes
├── hooks/              # Custom React hooks
├── layout/             # Layout components
│   └── AppLayout.tsx   # Main app layout with sidebar
├── lib/                # Utilities
│   └── utils.ts        # cn() helper and utilities
├── routes/             # Top-level routes
│   └── login.tsx       # Login page
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
- `auth-schema.ts` (root): Legacy schema file (actual schema is in `app/server/db/schema.ts`)

### Routing

Routes are defined in `app/routes.ts` using React Router v7's file-based routing:
```typescript
[
  index("routes/login.tsx"),                    // /
  layout("./layout/AppLayout.tsx", [            // Nested routes with sidebar
    prefix("organization", [
      index("./features/organization/routes/index.tsx"),        // /organization
      route("/new", "./features/organization/routes/CreateOrganization.tsx"), // /organization/new
    ]),
  ]),
]
```

Layout wraps routes with `AppSidebar` and `SidebarProvider`.

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
Follow the feature-based structure in `app/features/`:
1. Create feature directory (e.g., `app/features/invoices/`)
2. Add `routes/` subdirectory for route components
3. Add feature-specific components, hooks, and utilities
4. Register routes in `app/routes.ts`

### Database Changes
1. Modify schema in `app/server/db/schema.ts`
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
