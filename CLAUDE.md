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
```

**No test runner is configured yet.** When added, Vitest is the intended framework:
- `npm run test` — run all tests
- `npm run test -- path/to/file.test.ts` — run one file
- `npm run test -- -t "test name"` — run one test by name

**Quality gate before marking any task done:** `npm run lint && npx tsc --noEmit && npm run build`

## Architecture

### What This App Is
FarmAlmacén is a **pharmaceutical warehouse management system** (MVP) for multi-pharmacy inventory control. Workers track medication stock across multiple warehouse locations with role-based access.

Demo credentials (seeded at startup): `admin / admin123`, `empleado / empleado123`.

### Storage: In-Memory Only
There is **no database**. All data lives in `lib/store.ts` in a global in-memory store (`Map` + arrays). Data is lost on server restart. The store is intentionally temporary; types in `lib/types.ts` are database-agnostic for eventual migration.

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
  api/
    auth/login|logout
    products/         # POST only, intent: create|update|delete
    warehouses/       # POST only, intent: create|update|delete
    users/            # POST only, intent: create
    movements/        # POST only, intent: create (entrada|salida|traslado)
```

### API Pattern
All API routes accept `FormData` (not JSON) and return **redirects with query params** (e.g., `?success=true` or `?error=message`). There is no JSON REST API.

### Key Files
| File | Role |
|------|------|
| `lib/types.ts` | Full domain model (Product, Warehouse, User, Movement, Session, etc.) |
| `lib/store.ts` | All CRUD operations against the in-memory store |
| `lib/auth.ts` | Session create/read/destroy helpers |
| `lib/format.ts` | Text and date formatting utilities |
| `lib/query.ts` | URL query param parsing helpers |
| `components/app-shell.tsx` | Main layout: sidebar, header, user menu |
| `app/globals.css` | Design tokens (green/teal palette, semantic color vars) |

### Styling
Tailwind CSS v4 with CSS custom properties. Design tokens (`--background`, `--foreground`, `--paper`, `--line`, `--danger`, `--success`, primary: `#1f6355`) are defined in `app/globals.css`. Layout is mobile-first.

### Server vs. Client Components
Default to **Server Components**. Add `"use client"` only when browser APIs or interactive client state are required. Modals and wizards in `components/` are the main client-side components.
