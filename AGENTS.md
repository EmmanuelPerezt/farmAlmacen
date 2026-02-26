# AGENTS.md

## Purpose
- This document defines working rules for coding agents in this repository.
- Apply these standards by default unless a human explicitly overrides them.
- Prefer consistency with the existing codebase over personal style.
- Keep changes small, reviewable, and scoped to the requested task.

## Project Context
- Project: `farmalmacen`.
- Domain: warehouse management and administration for multiple pharmacies.
- Current maturity: clean Next.js base template with TypeScript, ESLint, and Tailwind.
- Most domain features are not implemented yet; prioritize maintainable foundations.

## AI Rule Sources (Cursor / Copilot)
- Checked and not found: `.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md`.
- There are no additional AI instruction files to merge at this time.
- If these files are added later, treat them as higher-priority guidance.

## Stack Snapshot
- Next.js `16.1.6` (App Router).
- React `19.2.3` / `react-dom` `19.2.3`.
- TypeScript `^5` with `strict: true`.
- ESLint `^9` with `eslint-config-next` (`core-web-vitals` and `typescript`).
- Tailwind CSS `^4` with PostCSS plugin `@tailwindcss/postcss`.
- Package manager in use: npm (`package-lock.json` exists).

## Repository Structure
- `app/`: routes, layouts, pages, and global styles.
- `public/`: static assets.
- `eslint.config.mjs`: lint configuration.
- `tsconfig.json`: TypeScript settings and alias `@/*`.
- `next.config.ts`: Next.js configuration.
- `postcss.config.mjs`: PostCSS + Tailwind setup.

## Build, Lint, and Run Commands
- Install dependencies: `npm install`.
- Start development server: `npm run dev`.
- Build for production: `npm run build`.
- Start built app: `npm run start`.
- Lint entire repo: `npm run lint`.
- Lint one file: `npm run lint -- app/page.tsx`.
- Type-check (recommended quality gate): `npx tsc --noEmit`.

## Test Commands
- Current status: no test runner configured yet, and no `test` script in `package.json`.
- Until tests are added, validate changes with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

## Single-Test Standard (Vitest Default)
- Use Vitest as the default test runner when tests are introduced.
- Recommended scripts:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
- Run all tests: `npm run test`.
- Run one test file: `npm run test -- app/inventory/inventory.service.test.ts`.
- Run one test case by name: `npm run test -- -t "creates warehouse record"`.
- Watch mode: `npm run test:watch`.

## Code Style: General
- Prefer explicit, straightforward code over clever abstractions.
- Keep functions and components focused on a single responsibility.
- Avoid speculative abstractions and premature optimization.
- Do not add dependencies unless there is clear, documented value.
- Match existing patterns in nearby files before introducing new ones.

## Imports
- Use ESM imports only.
- Import order: external packages, internal absolute imports (`@/...`), relative imports, side-effect imports.
- Use `import type` for type-only imports.
- Remove unused imports and avoid circular dependencies.

## Formatting
- Follow repository conventions already present in source files.
- Use 2-space indentation, semicolons, double quotes, and trailing commas in multiline structures.
- Let ESLint be the primary style authority.
- Do not introduce a formatter configuration unless requested.

## TypeScript Guidelines
- Keep `strict` mode enabled.
- Avoid `any`; prefer precise types or `unknown` + narrowing.
- Add explicit types for exported functions and shared public APIs.
- Prefer discriminated unions for complex state variants.
- Validate external data at boundaries (API, storage, forms).
- Keep type utilities readable; avoid over-engineered type logic.

## Naming Conventions
- Components and types: PascalCase.
- Variables and functions: camelCase.
- Hooks: `useSomething`.
- Constants: UPPER_SNAKE_CASE only for real constants.
- Next.js route files must use framework naming (`page.tsx`, `layout.tsx`, etc.).
- Prefer descriptive names over abbreviations.

## Next.js and React Conventions
- Default to Server Components.
- Add `"use client"` only when required by browser APIs or client state.
- Keep route-specific logic close to its route segment.
- Prefer Next primitives (`next/image`, `next/link`) where appropriate.
- Use metadata APIs for titles/descriptions when adding pages.
- Avoid unnecessary client-side fetching when server rendering is enough.

## Styling Conventions
- Use Tailwind utility classes for most UI styling.
- Keep reusable design tokens in `app/globals.css`.
- Use semantic HTML and accessible attributes by default.
- Ensure layouts work on mobile and desktop.
- Avoid large duplicated class strings; extract reusable UI primitives when needed.

## Error Handling
- Never swallow errors silently.
- Return or throw actionable errors with context.
- Keep user-facing messages clear and non-technical.
- Avoid leaking sensitive details in errors.
- Normalize error shapes once API routes are implemented.

## Quality Gate for Agents
- For any non-trivial change, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- If checks fail, fix root causes instead of suppressing rules.
- Avoid broad disables like file-level lint ignores unless justified.

## Git and Change Hygiene
- Keep diffs focused; do not mix unrelated refactors.
- Do not edit generated artifacts intentionally (`.next/`, coverage outputs).
- Update docs when behavior or conventions change.
- Never commit secrets, tokens, or local environment files.

## Agent Execution Defaults
- Prefer non-interactive commands and deterministic scripts.
- Before proposing new tools, check if existing repo scripts already cover the need.
- For risky operations (data migrations, production config changes), document assumptions in the PR.
- If a command fails, report the root cause and the exact retry command.
- Keep logs concise; include only the lines needed to diagnose issues.
- Avoid placeholder implementations unless explicitly requested.

## Definition of Done
- Requested scope is complete.
- Code follows this document's style and architecture rules.
- Lint, type-check, and build pass.
- Tests are added or updated when a test framework exists.
- No dead code, unused imports, or placeholder TODO noise is introduced.

## Future Improvements
- Add project-specific architecture notes as modules are created.
- Add Vitest setup and baseline tests early.
- Add CI pipeline for lint, type-check, build, and tests.
- Revisit this file when Cursor or Copilot rule files are introduced.
