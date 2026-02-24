# Video Script — POS Technical Deep Dive

**Target Duration**: ~6 minutes
**Narrator**: Direct, engineering-focused. English or Spanish (choose one, stay consistent)
**Format**: Screen recording + architecture diagrams + code walkthroughs
**Resolution**: 1920×1080, 30fps

---

## SETUP BEFORE RECORDING

**Files to have open**:

- [ ] `app/features/pos/server/actions/create-sale.action.ts` — Core transaction logic
- [ ] `app/server/db/schema.ts` — Database schema (pos tables section)
- [ ] `app/features/pos/schemas.ts` — Zod schemas
- [ ] `app/features/pos/server/repository/pos.repository.ts` — Repository pattern
- [ ] Latest migration file in `drizzle/` — indexes

**Screens to have ready**:

- [ ] Architecture diagram (from `pos-slides-technical.md` slide 3)
- [ ] `/pos` — Terminal selection
- [ ] `/pos/terminal?terminalId=[id]` — Main POS

**Code highlights** (prepare in editor):

- Idempotency key generation (client side)
- `SELECT FOR UPDATE` block in create-sale action
- Transaction scope (what's inside vs outside)
- Index definitions in migration
- drizzle-zod schema chain

---

## SCRIPT

---

### [0:00 – 0:30] INTRO + STACK

**[Show: slide 1 or terminal selection screen]**

> "Let me walk you through how this POS is built — and more importantly, why it's built this way."
>
> "The stack: React Router v7 running on Cloudflare Workers at the edge, connected to Neon serverless PostgreSQL via HTTP driver."
>
> "No persistent connections. No traditional server. Every request is a stateless edge function."
>
> "That constraint shapes every architectural decision we made."

---

### [0:30 – 1:30] ARCHITECTURE WALKTHROUGH

**[Show: architecture diagram — Slide 3]**

> "Here's how a request flows."
>
> "A cashier on any of the 40 terminals hits the browser. That request lands on a Cloudflare Worker — at the edge node closest to Neon thanks to Smart Placement."
>
> "React Router handles SSR inside the Worker. Data fetching happens in loader functions — no REST API layer, no useEffect waterfalls. Loaders run on the server, return typed data, and the component hydrates on the client."

**[Show: a loader function in the POS route]**

> "When the cashier opens their terminal, the loader fetches products, active shift, and customer data — in parallel with Promise.all. One round trip to the DB, everything ready for SSR."

**[Show: Neon connection code]**

> "Each DB query is an HTTP call via Neon's serverless driver. This is what makes it work inside Workers — no TCP connection pools, no persistent sockets. Just fast HTTP."

---

### [1:30 – 2:30] THE 40-TERMINAL CHALLENGE

**[Show: terminal selection screen with multiple terminals]**

> "Now, the hard part. Supporting 40 concurrent terminals selling the same products."

**[Show: diagram or whiteboard — two terminals reading stock = 1 simultaneously]**

> "Classic race condition: two terminals read stock for a product — both see 1. Both sell it. Stock goes to -2. Customer's mad. You're losing money."
>
> "Two separate problems here. First: race conditions on stock. Second: network retries creating duplicate sales."
>
> "Let me show you exactly how we solved both."

**[Open: `create-sale.action.ts`]**

---

### [2:30 – 3:30] PESSIMISTIC LOCKING + IDEMPOTENCY

**[Highlight: SELECT FOR UPDATE in the transaction block]**

> "For race conditions: pessimistic locking."
>
> "Before we touch stock, we run SELECT FOR UPDATE on the product row. That locks it at the PostgreSQL level. Any other terminal trying to sell the same product waits."
>
> "Terminal 1 locks, validates stock, inserts the sale, decrements stock to zero — then commits and releases the lock."
>
> "Terminal 2 gets the lock, reads stock = 0, throws 'Insufficient stock'. Clean. No negative inventory. Ever."

**[Highlight: idempotency key generation]**

> "For duplicates: idempotency keys."
>
> "The client generates a UUID before submitting checkout. That key goes with the request."

**[Show: unique constraint in schema]**

> "The database has a unique constraint on that column. If the client retries — connection drop, timeout, whatever — the second attempt hits the constraint."

**[Show: findSaleByIdempotencyKey in repository]**

> "The action checks for an existing sale with that key. If found, returns it immediately. ~10 milliseconds. No duplicate sale created."
>
> "Retry-safe by design."

---

### [3:30 – 4:15] TRANSACTION SCOPE

**[Show: the transaction block in create-sale.action.ts]**

> "Now — transaction scope. This is where a lot of systems get it wrong."
>
> "The transaction is intentionally minimal. Here's what's inside:"

**[Highlight each step as you say it]**

> "One: check idempotency. Two: SELECT FOR UPDATE on each product. Three: validate stock. Four: insert the sale record. Five: bulk insert sale items. Six: bulk insert payments. Seven: decrement stock. Commit."
>
> "That's it."

**[Scroll down to show invoice/email code OUTSIDE the transaction]**

> "Invoice generation? Outside the transaction. Email notification? Outside. Analytics events? Outside."
>
> "Why? Because a shorter transaction means a shorter lock window. Shorter lock window means 40 terminals queue up and move fast — instead of stacking up waiting for a slow transaction to finish."
>
> "If invoice generation fails, the sale is already committed. That's the right behavior."

---

### [4:15 – 5:00] TYPE SAFETY

**[Open: `app/server/db/schema.ts` — pos_sales table]**

> "Let me show you the type safety chain — because this is end-to-end, with zero manual types."
>
> "The database schema is the single source of truth."

**[Open: `app/features/pos/schemas.ts`]**

> "drizzle-zod generates Zod schemas directly from the Drizzle table definitions."

**[Highlight: createInsertSchema, then the .extend() call]**

> "We extend those generated schemas to add business rules — items must have at least one product, payments must cover the total, idempotency key is required."

**[Show: type inference line]**

> "TypeScript types are inferred from the Zod schemas. Not written by hand. If the DB schema changes, the Zod schema updates, the TypeScript types update. One change propagates everywhere."

**[Show: the action using safeParse]**

> "And at runtime, every form submission goes through safeParse. If validation fails, we return field errors without throwing. If it passes, result.data is fully typed. No casting. No 'as any'."

---

### [5:00 – 5:30] INDEXES + REAL NUMBERS

**[Open: migration file — show index definitions]**

> "Five indexes on hot query paths."

**[Highlight each index]**

> "Idempotency key — unique index — 10 to 20ms lookup. Terminal load by org and active status. Sales by terminal and date for shift reports. Status filtering for queue management. Cross-terminal analytics by org and date."

**[Show: performance table from slide 12]**

> "Real numbers: full sale creation — lock, validation, three inserts, stock update — 200 to 400 milliseconds end-to-end."
>
> "Z-Report for a full shift: 50 to 150ms. Paginated sales history: 30 to 80ms."
>
> "40 terminals running simultaneously. PostgreSQL serializes per-product — not per-terminal. If terminals are selling different products, they're fully parallel."

---

### [5:30 – 6:00] CLOSE

**[Show: roadmap slide or code editor]**

> "This architecture scales horizontally. Add terminals — add more Workers. Cloudflare handles that."
>
> "The bottleneck as you scale is the database. Neon's pooler handles burst traffic. Next step is read replicas for reporting — separate the Z-Report read path from the transactional write path."
>
> "After that: offline-first support for connectivity issues, real-time analytics via Server-Sent Events, and cross-location consolidated reporting."
>
> "The foundation is solid. It's designed to grow without rewrites."
>
> "Questions?"

---

## PRODUCTION NOTES

**Code editor setup**:

- Dark theme, large font (18–20px minimum for readability)
- Hide file explorer sidebar during recording
- Use split view to show schema + action side by side for type safety section

**Cuts / transitions**:

- Hard cuts between sections (no fades — this is a technical audience)
- Use code highlighting / zoom for SELECT FOR UPDATE and idempotency key lines
- Consider adding callout boxes on screen for key numbers (200-400ms, 10-20ms)

**Sections that benefit from diagram overlay**:

- [1:30] — Race condition diagram (can be drawn live or shown as static image)
- [0:30] — Architecture diagram (show while narrating the flow)

**Files to show during recording**:

```
create-sale.action.ts     → locks, transaction scope, idempotency check
schema.ts                 → pos_sales, pos_sale_items, idempotency_key column
schemas.ts                → drizzle-zod chain, createSaleSchema
pos.repository.ts         → findSaleByIdempotencyKey, lockProductForUpdate
[latest migration].sql    → CREATE INDEX statements
```
