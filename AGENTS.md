# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router SaaS dashboard for multi-channel commerce and WMS workflows. App routes live in `app/`, with protected dashboard pages under `app/(dashboard)/` and Clerk auth pages under `app/sign-in/` and `app/sign-up/`. Server actions live in `app/actions/`.

Shared UI and feature components live in `components/`: layout shell components in `components/layout/`, shadcn/Radix-style primitives in `components/ui/`, settings UI in `components/settings/`, and the warehouse zone layout editor in `components/warehouse-layout/`. Shared utilities and Prisma tenant helpers live in `lib/`. Prisma schema and SQL migrations live in `prisma/`.

## Build, Test, and Development Commands

- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production build and run type validation.
- `npm run start`: serve the production build.
- `npm run lint`: run Next.js ESLint checks.
- `npx prisma generate`: regenerate Prisma Client after schema changes.
- `npx prisma migrate deploy`: apply committed migrations to the configured database.
- `npx prisma validate`: validate `prisma/schema.prisma`.

## Coding Style & Naming Conventions

Use TypeScript, React Server Components by default, and client components only when state, effects, or browser APIs are required. Keep components small and feature-scoped. Use PascalCase for components, camelCase for functions and variables, and kebab-case for route folders. Prefer Tailwind utilities and existing UI primitives from `components/ui/`. Keep server-side database access in server components, server actions, or `lib/` helpers.

## Testing Guidelines

No dedicated test framework is currently configured. Before submitting changes, run `npm run lint`, `npm run build`, and `npx prisma validate` when schema code is touched. For interactive UI changes, manually verify dashboard navigation, Clerk sign-in, personal workspace mode, organization switching, settings, and the warehouse layout editor.

## Commit & Pull Request Guidelines

This workspace has no accessible Git history. Use concise imperative commits such as `Add tenant-scoped warehouse actions` or `Fix zone layout selection`. Pull requests should include a short summary, affected pages/components, database or environment changes, verification commands, and screenshots for UI changes.

## Security & Configuration Tips

Do not commit `.env` or secret keys. Clerk keys and Supabase connection strings must stay in environment variables. All tenant-owned data should be scoped through `getTenantContext()` or explicit `companyId` filters.
