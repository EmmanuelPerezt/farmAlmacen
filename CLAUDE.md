# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> See also `AGENTS.md` for full coding conventions, naming rules, and agent execution standards.

## Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run lint         # Lint entire repo
npm run lint -- app/page.tsx  # Lint a single file
npx tsc --noEmit     # Type-check without emitting (required quality gate)
npx prisma migrate dev   # Apply pending migrations (creates/updates dev.db)
npx prisma db seed       # Seed the database with demo data
npx prisma studio        # Visual database browser (http://localhost:5555)
```

**No test runner is configured yet.** When added, Vitest is the intended framework:
- `npm run test` — run all tests
- `npm run test -- path/to/file.test.ts` — run one file
- `npm run test -- -t "test name"` — run one test by name

**Quality gate before marking any task done:** `npm run lint && npx tsc --noEmit && npm run build`

## Architecture

### What This App Is
FarmAlmacén is a **pharmaceutical warehouse management system** (MVP) for multi-pharmacy inventory control. Workers track medication stock across multiple warehouse locations with role-based access. Includes a point-of-sale (POS) terminal for registering sales.

Demo credentials (seeded via `npx prisma db seed`): `admin / admin123`, `empleado / empleado123`.

### Storage: Prisma + SQLite
Data is persisted in a local SQLite database (`prisma/dev.db`) via **Prisma ORM**. The schema is defined in `prisma/schema.prisma` with 6 models: `User`, `Product`, `Warehouse`, `Inventory`, `Movement`, `Sale`. Inventory uses a composite key `[warehouseId, sku]`.

`lib/db.ts` is the data access layer — all functions are **async** and use the Prisma Client singleton (stored in `globalThis.__prisma` during dev to survive HMR). Types in `lib/types.ts` remain database-agnostic; converter functions in `lib/db.ts` (e.g., `toProduct()`, `toUser()`) bridge Prisma models to app types.

> `lib/store.ts` is the **old in-memory store** (deprecated). All active code imports from `lib/db.ts`.

### Auth: Session Cookies
`lib/auth.ts` implements Base64url-encoded sessions stored in an httpOnly cookie (`farmalmacen_session`, 12h max-age). Two roles exist: `"admin"` and `"empleado"`.

- `requireSession()` — guards any page, redirects to `/login` if unauthenticated
- `requireAdminSession()` — guards admin-only operations
- Session is read server-side in layouts/pages via `getSessionFromCookies()`

### Routing: App Router Groups
```
app/
  login/             # Public — login form
  (app)/             # Protected group — all routes require session
    layout.tsx        # Calls requireSession(), renders AppShell
    dashboard/
    movimientos/      # Stock movement history + creation wizard
    productos/        # Product catalog
    almacenes/        # Warehouse management
    configuracion/    # Admin-only: user management
  (pos)/             # Protected POS terminal — separate layout
    layout.tsx        # POS-specific header with branding
    pos/              # Point-of-sale register
      recibo/         # Receipt view after sale
  api/
    auth/login|logout|me
    products/         # CRUD; [sku] dynamic route for update/delete
    warehouses/       # CRUD; [id] dynamic route for update/delete
    users/            # POST only, intent: create
    movements/        # POST only, intent: create (entrada|salida|traslado)
    sales/            # CRUD; [id] dynamic route for detail
```

### API Pattern
API routes accept **JSON** request bodies and return **JSON responses** with appropriate HTTP status codes (201 for creation, 422 for validation errors). Auth is checked via `getSessionFromRequest()`.

### Key Files
| File | Role |
|------|------|
| `lib/types.ts` | Full domain model (Product, Warehouse, User, Movement, Sale, Session, etc.) |
| `lib/db.ts` | All async CRUD operations via Prisma (replaces old `lib/store.ts`) |
| `lib/auth.ts` | Session create/read/destroy helpers |
| `lib/theme.ts` | Dark/light theme via cookie (`farmalmacen_theme`) |
| `lib/format.ts` | Text and date formatting utilities |
| `lib/query.ts` | URL query param parsing helpers |
| `prisma/schema.prisma` | Database schema (SQLite) |
| `prisma/seed.ts` | Demo data seeder (idempotent via upsert) |
| `components/app-shell.tsx` | Main layout: sidebar, header, user menu |
| `app/globals.css` | Design tokens (green/teal palette, semantic color vars, dark mode) |

### Styling
Tailwind CSS v4 with CSS custom properties. Design tokens (`--background`, `--foreground`, `--paper`, `--line`, `--danger`, `--success`, primary: `#1f6355`) are defined in `app/globals.css` with dark mode variants. Layout is mobile-first.

### Server vs. Client Components
Default to **Server Components**. Add `"use client"` only when browser APIs or interactive client state are required. Modals, wizards, and the POS register in `components/` are the main client-side components.
