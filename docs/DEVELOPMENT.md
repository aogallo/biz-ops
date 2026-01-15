# Development Workflow

This guide explains how to set up and work with the ERP application locally.

## Quick Start

### New Developer Setup (with Docker)

**Recommended for new team members who don't have PostgreSQL installed.**

1. **Prerequisites:**
   - Docker Desktop installed ([download here](https://www.docker.com/products/docker-desktop))
   - Node.js 18+ installed

2. **Clone and install:**

   ```bash
   git clone <repository-url>
   cd erp
   npm install
   ```

3. **Environment setup:**

   ```bash
   # Copy environment templates
   cp .env.docker .env
   cp .dev.vars.example .dev.vars

   # Edit .dev.vars with your actual Neon credentials
   ```

4. **Start PostgreSQL:**

   ```bash
   npm run docker:up
   ```

   This starts PostgreSQL on port 5433 and pgAdmin on port 5050.

5. **Run migrations and seed data:**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start development server:**

   ```bash
   npm run dev
   ```

   App will be available at `http://localhost:5173`

7. **Access pgAdmin (optional):**
   - URL: `http://localhost:5050`
   - Email: `admin@local.dev`
   - Password: `admin`

### New Developer Setup (existing PostgreSQL)

**If you already have PostgreSQL installed locally:**

1. **Create database:**

   ```bash
   createdb bizops_dev
   ```

2. **Environment setup:**

   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials

   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your Neon credentials
   ```

3. **Run migrations and seed:**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

## Understanding Environment Files

The project uses different environment files for different purposes:

```
┌──────────────────────────────────────────────────────────┐
│  .env          → Local PostgreSQL (for db:* commands)    │
│                  Used by: drizzle-kit, tsx scripts       │
├──────────────────────────────────────────────────────────┤
│  .dev.vars     → Neon database (for npm run dev)         │
│                  Used by: Cloudflare Workers dev mode    │
├──────────────────────────────────────────────────────────┤
│  wrangler.jsonc → Config only (NO SECRETS!)              │
│                  Production secrets in Cloudflare dash   │
└──────────────────────────────────────────────────────────┘
```

**Why two database configurations?**

- `.env` uses local PostgreSQL for fast migrations and seeds
- `.dev.vars` uses Neon HTTP for testing production-like environment
- This mimics the production setup (Cloudflare Workers + Neon)

## Common Commands

### Development

```bash
npm run dev              # Start dev server (uses Neon via .dev.vars)
npm run build            # Build for production
npm run typecheck        # Run TypeScript type checking
```

### Database - Local PostgreSQL

```bash
npm run db:generate      # Generate migration from schema changes
npm run db:migrate       # Run migrations on local database
npm run db:push          # Push schema changes without migration files
npm run db:studio        # Open Drizzle Studio (visual database browser)
npm run db:seed          # Seed local database with test data
```

### Database - Neon (Production-like)

```bash
npm run db:migrate:neon  # Run migrations on Neon database
npm run db:push:neon     # Push schema directly to Neon
npm run db:studio:neon   # Open Drizzle Studio for Neon database
npm run db:seed:neon     # Seed Neon database
```

### Docker

```bash
npm run docker:up        # Start PostgreSQL + pgAdmin containers
npm run docker:down      # Stop containers (keeps data)
npm run docker:logs      # View PostgreSQL logs
npm run docker:reset     # Complete reset (deletes all data!)
```

### Deployment

```bash
npm run deploy           # Build and deploy to Cloudflare Workers
```

## Development Workflow

### Making Schema Changes

1. **Edit the schema:**

   ```bash
   # Edit app/server/db/schema.ts
   # Add/modify tables, columns, indexes, etc.
   ```

2. **Generate migration:**

   ```bash
   npm run db:generate
   ```

   This creates a new migration file in `drizzle/` directory.

3. **Apply to local database:**

   ```bash
   npm run db:migrate
   ```

4. **Test locally:**

   ```bash
   npm run dev
   # Test your changes
   ```

5. **When ready, apply to Neon:**
   ```bash
   npm run db:migrate:neon
   ```

### Daily Development

1. **Pull latest changes:**

   ```bash
   git pull
   npm install              # Install any new dependencies
   npm run db:migrate       # Apply any new migrations
   ```

2. **Make your changes and test:**

   ```bash
   npm run dev
   ```

3. **Before committing:**

   ```bash
   npm run typecheck        # Ensure no TypeScript errors
   git status               # Review your changes
   git add .
   git commit -m "your message"
   ```

4. **Push to repository:**
   ```bash
   git push
   ```

### Working with Teammates

**When you pull changes that include database migrations:**

```bash
git pull
npm run db:migrate       # Apply new migrations locally
npm run dev              # Continue development
```

**Before pushing database schema changes:**

1. Generate migration: `npm run db:generate`
2. Test migration locally: `npm run db:migrate`
3. Commit both schema changes AND migration files
4. Push to repository

## Database Operations

### Inspecting the Database

**Drizzle Studio (Visual UI):**

```bash
npm run db:studio        # Opens at http://localhost:4983
```

Browse tables, view data, run queries visually.

**pgAdmin (Docker only):**

- URL: `http://localhost:5050`
- Login: admin@local.dev / admin
- Server already configured (ERP Local Development)

### Seeding Data

```bash
# Seed local database
npm run db:seed

# Seed Neon database
npm run db:seed:neon
```

The seed scripts create:

- A test organization
- Sample data for development

Edit `scripts/seed-local.ts` or `scripts/seed.ts` to customize seed data.

### Resetting the Database

**Local PostgreSQL (Docker):**

```bash
npm run docker:reset     # Deletes everything and starts fresh
npm run db:migrate       # Reapply migrations
npm run db:seed          # Reseed data
```

**Neon Database:**
Be careful! This affects shared database.

```bash
# Manual process:
# 1. Use Neon dashboard to reset
# 2. Run: npm run db:migrate:neon
# 3. Run: npm run db:seed:neon
```

## Troubleshooting

### "Worker hangs on login"

**Symptoms:** Submitting the login form freezes, no response.

**Solutions:**

1. Check `.dev.vars` has valid Neon connection string
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Check console logs for database connection errors

### "Database connection error" (npm run dev)

**Cause:** `.dev.vars` DATABASE_URL is incorrect or Neon is unreachable.

**Fix:**

1. Verify `.dev.vars` has correct Neon connection string
2. Test connection: Visit Neon dashboard, check database status
3. Ensure `USE_LOCAL_DB=false` in `.dev.vars`

### "Database connection error" (npm run db:\*)

**Cause:** `.env` DATABASE_URL is incorrect or PostgreSQL not running.

**Fix for Docker users:**

```bash
npm run docker:up        # Start PostgreSQL
npm run db:migrate       # Try again
```

**Fix for local PostgreSQL users:**

```bash
# Check if PostgreSQL is running
psql --version
pg_ctl status

# If not running, start it (macOS):
brew services start postgresql@16

# Test connection:
psql $DATABASE_URL -c "SELECT 1"
```

### "pgAdmin not loading"

1. Check Docker containers are running: `docker ps`
2. Access correct URL: `http://localhost:5050`
3. Use correct credentials: admin@local.dev / admin
4. Check logs: `npm run docker:logs`

### "Permission denied" on npm scripts

**On Unix/Linux/macOS, you might need:**

```bash
chmod +x scripts/*.ts
```

### "Port already in use"

**PostgreSQL (5433):**

```bash
# Find what's using the port
lsof -i :5433

# Stop Docker containers
npm run docker:down

# Or change port in docker-compose.yml
```

**Dev server (5173):**

```bash
# Find and kill process
lsof -i :5173
kill -9 <PID>
```

## Architecture Notes

### Database Driver Strategy

**Why we use two different drivers:**

- **Local Development (`pg`)**: Full PostgreSQL client with connection pooling
- **Cloudflare Workers (`@neondatabase/serverless`)**: HTTP-based, works in edge runtime

The app automatically detects the environment and uses the correct driver.

### Environment Variable Flow

```
┌─────────────────────────────────────────────┐
│  npm run dev                                │
│  └─> Reads .dev.vars                       │
│      └─> USE_LOCAL_DB=false                │
│          └─> Uses Neon HTTP driver         │
├─────────────────────────────────────────────┤
│  npm run db:migrate                         │
│  └─> Reads .env                            │
│      └─> USE_LOCAL_DB=true                 │
│          └─> Uses local PostgreSQL driver  │
└─────────────────────────────────────────────┘
```

### Better Auth Adapter

The Better Auth adapter automatically matches the database driver:

- Local PostgreSQL: Uses `pg` provider
- Neon: Uses `neon-http` provider

This is handled automatically in `app/server/auth-server.ts`.

## Production Deployment

### First-Time Setup

1. **Set Cloudflare secrets:**

   ```bash
   wrangler secret put DATABASE_URL
   # Paste your Neon production connection string

   wrangler secret put BETTER_AUTH_SECRET
   # Generate: openssl rand -base64 32

   wrangler secret put BETTER_AUTH_URL
   # Your production domain, e.g., https://erp.yourdomain.com
   ```

2. **Run migrations on production Neon:**

   ```bash
   # Use Neon dashboard or CLI to run migrations
   npm run db:migrate:neon
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

### Subsequent Deployments

```bash
npm run deploy
```

If you have database migrations, run them on Neon first:

```bash
npm run db:migrate:neon
npm run deploy
```

## Best Practices

### Database

- Always test migrations locally before applying to Neon
- Never run `db:push:neon` in production (use migrations instead)
- Keep seed scripts updated with representative data
- Use Drizzle Studio to inspect data, not for manual edits

### Environment Variables

- Never commit `.env` or `.dev.vars` files
- Always use `.example` files for templates
- Use Cloudflare dashboard for production secrets
- Document any new environment variables in `.example` files

### Git Workflow

- Commit migration files with schema changes
- Run `npm run typecheck` before committing
- Pull before pushing to avoid conflicts
- Communicate schema changes to team

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Better Auth Documentation](https://www.better-auth.com/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [React Router v7 Documentation](https://reactrouter.com/)
- [Neon PostgreSQL Documentation](https://neon.tech/docs)

## Getting Help

If you encounter issues:

1. Check this DEVELOPMENT.md guide
2. Review the main README.md
3. Check the Troubleshooting section above
4. Ask your teammates
5. Check application logs: `npm run dev` console output
6. Check database logs: `npm run docker:logs` (if using Docker)
