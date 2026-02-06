# Interface Design System

## Product Identity

**Domain:** Multi-tenant B2B ERP for Guatemalan businesses
- Accounting & tax compliance (SAT integration)
- Appointment scheduling & service management
- Inventory control & supplier management
- Organization & user management

**Feel:** Professional, reliable, structured — like a well-organized ledger. Not sterile, but purposeful. Warm enough to feel approachable, serious enough to trust with financial data.

**Signature Element:** Domain-contextual color coding that persists across feature areas. Each major section carries its accent color through headers, badges, and interactive elements.

---

## Domain Color Mapping

| Domain | Accent | Use For |
|--------|--------|---------|
| Accounting | `emerald-600` | Headers, badges, positive financial indicators |
| Appointments | `blue-500` | Calendar accents, time-related elements |
| Inventory | `amber-500` | Stock alerts, product highlights |
| Admin | `stone-500` | Neutral system pages, settings |

These colors appear in:
- Section headers (icon tint)
- Primary action buttons within that section
- Status badges relevant to that domain
- Chart/visualization accents

---

## Depth Strategy: Subtle Shadows

**Three elevation levels:**

```css
/* Ground — page background, no lift */
.elevation-ground {
  background: var(--background);
  /* no shadow */
}

/* Raised — cards, primary containers */
.elevation-raised {
  background: var(--card);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04);
}

/* Floating — dialogs, sheets, dropdowns */
.elevation-floating {
  background: var(--popover);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07);
}
```

**Border usage:**
- Primary cards: shadow only, no border (cleaner appearance)
- Internal structure: light borders (`border-border/50`)
- Interactive elements: borders for focus states
- Tables: subtle row dividers (`border-b border-border/30`)

---

## Spacing System

**Base unit:** 4px

**Scale:**
- `1` = 4px — tight spacing, icon gaps
- `2` = 8px — element spacing within components
- `3` = 12px — compact section spacing
- `4` = 16px — standard component padding
- `6` = 24px — section gaps, card padding
- `8` = 32px — major section breaks
- `12` = 48px — page section spacing

**Page layout:**
```
Container: w-full px-6 py-6 (fluid width for better laptop screen utilization)
Forms: max-w-4xl mx-auto (narrow layout for readability)
Section gap: space-y-8
Card gap: space-y-6
Form field gap: space-y-4
```

---

## Typography Scale

**Page title:** `text-2xl font-semibold tracking-tight`
**Section header:** `text-lg font-medium`
**Card title:** `text-base font-semibold`
**Label:** `text-sm font-medium`
**Body:** `text-sm`
**Caption:** `text-xs text-muted-foreground`
**Data/numbers:** `font-mono tabular-nums`

**Hierarchy rules:**
- Only one `text-2xl` per page (page title)
- Section headers are `text-lg`, not bold
- Card titles are `font-semibold`, same size as body

---

## Status Colors (Semantic)

| Status | Color | Token | Use Case |
|--------|-------|-------|----------|
| Success/Confirmed/Active | Green | `bg-green-500/10 text-green-700` | Completed, verified, ready |
| Pending/Warning/Due | Amber | `bg-amber-500/10 text-amber-700` | Awaiting action, attention needed |
| Error/Cancelled/Overdue | Red | `bg-red-500/10 text-red-700` | Failed, stopped, problem |
| Draft/Inactive/Muted | Gray | `bg-muted text-muted-foreground` | Not live, archived |
| Info/In Progress | Blue | `bg-blue-500/10 text-blue-700` | Processing, informational |

**Dark mode variants:** Same hues, adjusted for contrast
- `dark:bg-green-500/20 dark:text-green-400`

---

## Component Patterns

### Page Header
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="text-muted-foreground">{description}</p>
  </div>
  <div className="flex items-center gap-2">
    {/* Primary action button */}
  </div>
</div>
```

### Card (Standard)
```tsx
<div className="rounded-xl bg-card p-6 shadow-sm">
  <div className="mb-4">
    <h2 className="font-semibold">{title}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
  <div>{/* content */}</div>
</div>
```

### Section Divider
Use whitespace, not visible separators. If separation is needed:
```tsx
<Separator className="my-6 bg-border/50" />
```

### Empty State
```tsx
<div className="rounded-lg border border-dashed border-border/50 p-8 text-center">
  <p className="text-muted-foreground mb-4">{message}</p>
  <Button variant="outline">{action}</Button>
</div>
```

### Data Table
- Enable search by default
- Use `text-sm` for all cells
- Action column: text links, not icon buttons
- Row hover: `hover:bg-accent/50`

### Form Layout
```tsx
<div className="grid gap-6 md:grid-cols-2">
  {/* Two-column layout for wide forms */}
</div>
<div className="space-y-4">
  {/* Single-column for narrow contexts */}
</div>
```

---

## Navigation Patterns

### Sidebar
- Section icons carry domain color
- Active item: `bg-accent text-accent-foreground font-medium`
- Hover: `hover:bg-accent/50`
- Collapsed state shows icons only

### Active State
Do NOT use harsh contrast (`bg-blue-800`). Use subtle highlight:
```tsx
className={isActive ? 'bg-accent font-medium' : 'hover:bg-accent/50'}
```

---

## Calendar/Scheduling

**Appointment colors:** Map to service categories
- Blue: Consultation/meeting types
- Green: Completion/delivery types
- Orange: Urgent/priority types
- Teal: Recurring/routine types

**Time display:** 12-hour format with AM/PM
**Date display:** `toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })`

---

## Border Radius Scale

| Use Case | Radius |
|----------|--------|
| Buttons, inputs | `rounded-md` (6px) |
| Cards, dialogs | `rounded-xl` (12px) |
| Badges, chips | `rounded-full` |
| Avatars | `rounded-full` |
| Tables | `rounded-lg` (8px) |

---

## Interaction States

**Buttons:**
- Default: solid background
- Hover: slightly darker (or lighter in dark mode)
- Active: scale(0.98) subtle press
- Disabled: opacity-50, cursor-not-allowed

**Inputs:**
- Focus: ring-2 ring-ring ring-offset-2
- Error: ring-destructive border-destructive
- Disabled: bg-muted cursor-not-allowed

**Cards/Clickable areas:**
- Hover: bg-accent/50 transition-colors
- No scale transforms on cards

---

## Dark Mode Considerations

- Shadows become more subtle (reduce opacity)
- Borders become more visible (increase opacity slightly)
- Status colors shift to darker backgrounds with lighter text
- Avoid pure white text on dark — use `text-foreground` (slightly off-white)

---

## Anti-Patterns to Avoid

- Mixing direct color classes (`text-emerald-600`) with semantic tokens — pick one
- Multiple shadow intensities on the same page
- Borders + shadows on the same element
- Inconsistent border-radius within a component
- Hard-coded pixel values in spacing
- Bold text for emphasis (use weight sparingly)
- Icon buttons without labels for primary actions
- Horizontal scrolling in tables (truncate or wrap instead)
