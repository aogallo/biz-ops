# AGENTS.md

Quick reference for agents. See `CLAUDE.md` for full architecture docs.

## Essential Commands

```bash
# Dev
npm run dev

# Local database (REQUIRED for seeds)
USE_LOCAL_DB=true npx tsx scripts/seed.ts
USE_LOCAL_DB=true npx tsx scripts/seed-permissions.ts

# Typecheck before committing
npm run typecheck

# Deploy
npm run deploy
```

## Critical Gotchas

- **Local DB**: Seed scripts MUST use `USE_LOCAL_DB=true` or set `DATABASE_URL` env var
- **Schema location**: Database schema is `app/server/db/schemas/auth.ts`, NOT `auth-schema.ts` in root
- **Routes location**: All route files go in `app/routes/`, not in features
- **Permissions**: 83 system permissions seeded via `scripts/seed-permissions.ts` (run after schema changes)
- **DataTable**: Always use `~/components/dataTable/DataTable.tsx` for tabular data, not raw Table components

## TDD Requirement

Every feature/bugfix MUST follow Red-Green-Refactor:

1. Write failing test first
2. Write minimal code to pass
3. Refactor while keeping tests green

No implementation code without corresponding test.

## Permission Format

Permissions use `"resource:action"` format (e.g., `"products:create"`). Check with `hasPermission()` in `app/server/auth/permissions.server.ts`.

## Dual DB Connection

- **Production**: Neon HTTP (`@neondatabase/serverless`)
- **Local**: node-postgres (`pg`) via `USE_LOCAL_DB=true`
- Selection happens in `app/server/db/index.ts`
