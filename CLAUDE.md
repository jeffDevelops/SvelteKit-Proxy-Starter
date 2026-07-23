# SvelteKit Proxy Starter

This project is a proxy template for SvelteKit projects requiring an API.

All requests are routed through SvelteKit to an internal API

## Tech stack (decided)

- **Bun** runtime, Bun-workspace monorepo, TypeScript strict
- **Hono** internal API — never publicly exposed, always behind the proxy
- **SvelteKit** web app; `+server.ts` endpoints proxy Hono and enforce
  auth
- **@shadcn/svelte + tailwindcss** UI
- **PostgreSQL** via **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`); **Better Auth** for sessions
  (validated in both SvelteKit `hooks.server.ts` and Hono middleware)
- **Mailgun** email, **Docker** + **Render** deploy, code hosted on
  **GitHub** (`jeffDevelops/SvelteKit-Proxy-Starter`)

### Planned monorepo layout

```
apps/web/         SvelteKit (UI + proxy endpoints)
apps/api/         Hono (internal API)
packages/db/      Drizzle schema + drizzle-kit migrations; exports inferred DB entity types
packages/shared/  Zod schemas for API request/response validation; provider interfaces; utility types
```

## Architectural invariants

These are deliberate commitments — don't quietly violate them:

1. **The Hono API is internal-only.** All public traffic enters through
   SvelteKit, which validates session + membership before proxying.
2. **External vendors sit behind interfaces in `packages/shared`:**
   `EmailProvider` (Mailgun adapter). No code outside an adapter touches a real
   vendor API.

## Code quality

After making any code changes, run `bun lint`, `bun format`, and `bun test` before
reporting completion. All must pass with no new errors introduced.

## Testing methodology

Development is test-driven: write the test first (it should fail for the
right reason), then write the minimum code to make it pass, then refactor.
Don't write implementation code with no failing test behind it.

- **Unit tests** for all in-house code where feasible — components, hooks,
  validation logic, business rules. Colocate as `*.spec.ts` (or
  `*.svelte.spec.ts` for anything using runes, per the Vitest browser/server
  project split in `vite.config.ts`) next to the source file.
- **End-to-end tests** (Playwright, `test:e2e`) for full-stack functionality
  — flows that cross the SvelteKit → Hono → Postgres boundary (sign-up,
  sign-in, etc.). Unit tests mock/stub across that boundary; e2e is what proves the real path works.

## CSS and UI conventions

- **Components**: default to `@shadcn/svelte` — don't build UI primitives
  from scratch when a shadcn component exists.
- **Colors**: use CSS variables already defined in the shadcn theme
  (`--primary`, `--muted`, etc.) — never hardcode hex/rgb values.
- **Styling**: Tailwind utility classes first; Svelte scoped `<style>` only
  where Tailwind cannot express the rule.
- **Typography**: define global classes (e.g. `.text-body`, `.text-heading`)
  and use them consistently — don't set font size/weight ad-hoc with Tailwind.
- **Icons**: Lucide (shadcn/svelte default) only — don't introduce a second
  icon library.
- **No inline styles**: `style="..."` attributes are banned. Use Tailwind or
  scoped CSS.
- **No arbitrary Tailwind values** (e.g. `w-[37px]`) unless no standard value
  fits; prefer CSS variables for custom sizes.
- **Responsive**: mobile-first using Tailwind breakpoint prefixes.
- **Dark mode**: handled entirely through shadcn CSS variables — don't add
  `dark:` class overrides that hardcode colors. Theme switching goes through
  the `Theme` hook (`apps/web/src/lib/hooks/theme.svelte.ts`, singleton
  `theme`) and the `ThemeToggle` component
  (`apps/web/src/lib/components/ThemeToggle.svelte`) — don't manipulate the
  `.dark` class or `theme-preference` localStorage key anywhere else (the
  one exception: the pre-hydration script in `app.html`).

## Database conventions

The canonical schema is the **Drizzle schema in `packages/db`**. DB entity
types are inferred from it (`$inferSelect` / `$inferInsert`) — do not
hand-write parallel TypeScript interfaces for DB entities in `packages/shared`.

- **Migrations are append-only.** Never edit an existing drizzle-kit migration
  file — only generate new forward migrations with `drizzle-kit generate`.
- **No raw SQL and no direct DB access outside `packages/db`.** All queries go
  through the helpers exported from that package.
- **Every table gets** `createdAt` and `updatedAt` timestamp columns
  (`timestamptz NOT NULL DEFAULT now()`), defined in the Drizzle schema.
- **Primary keys are UUIDs** (`gen_random_uuid()`), not serial integers.
  Serial IDs leak record counts — a security concern for subscriber and
  revenue data.
- **Soft deletes** (`deletedAt timestamptz`) on any table whose records have
  legal or compliance value: `users`, `subscriptions`, `posts`, `assets`.
- **Every foreign key column must have an index.**

## Networking conventions

All SvelteKit → Hono communication uses **Hono's typed RPC client**
(`hono/client`). This is the single, consistent communication layer — do not
introduce plain REST fetch calls, GraphQL, or tRPC alongside it. The Hono
route definitions are the source of truth for API types; the SvelteKit client
derives its types directly from them.

- Request and response bodies are validated with Zod **at the Hono handler
  boundary** — not in SvelteKit, not in the DB layer.
- All error responses use a consistent envelope:
  `{ error: string, code: string, status: number }`.
- `apps/web` never accesses the database directly — always proxied through
  Hono.

## Environment and config

- All configuration comes from environment variables — nothing sensitive is
  hardcoded.
- Env vars are validated with Zod at application startup; the process exits
  immediately if required vars are missing.
- Secrets are never logged, even at debug level.

## Error handling

- Define a shared `AppError` class (or discriminated union) in
  `packages/shared` — don't throw raw `Error` objects from business logic.
- Errors that reach the client get generic user-facing messages; full detail
  is logged server-side only.
- Never expose stack traces or internal error messages in API responses.

## Svelte state conventions

- Component-local state: Svelte 5 runes (`$state`, `$derived`, `$effect`).
- Cross-component shared state: Svelte stores or rune-based context
  (`setContext`/`getContext`).
- No prop-drilling more than 2 levels — use context or a store instead.
- **Form field validation is blur-gated**: errors only surface after the user
  leaves a field, not on every keystroke. Use the `ValidatedField` class hook
  (`apps/web/src/lib/hooks/validated-field.svelte.ts`) instead of hand-rolled
  per-field `xTouched`/`xBlurred` state — it tracks `touched` and exposes
  `showError` (`touched && invalid`).

## Deployment

Render-based deploys (`render.yaml` blueprint), dev/staging VPS provisioned
via `infra/bootstrap-server.sh`. See `docs/deployment.md` for Cloudflare
setup, environment variables, and Codeberg → Render deploy hook wiring.
