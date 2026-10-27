# Almaluxe Packers & Movers

A public moving-services website and private enquiry dashboard for Almaluxe Packers & Movers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `PORT=25706 BASE_PATH=/ pnpm --filter @workspace/almaluxe-moving run build` — build the website artifact
- `pnpm --filter @workspace/api-server run build` — build the API artifact
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env for quote storage: `MONGODB_URI` — MongoDB connection string, stored in Replit Secrets

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Website: React 19 + Vite
- API: Express 5
- DB: MongoDB + Mongoose
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/almaluxe-moving/` — public website and admin interface
- `artifacts/api-server/` — Express API and integrations
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `artifacts/api-server/src/models/` — MongoDB/Mongoose models

## Architecture decisions

- Enquiries use MongoDB, as explicitly requested; do not migrate them to the workspace PostgreSQL database.
- The public website is only for Almaluxe Packers & Movers. Do not include Almaluxe Export LLP branding or food-export products.
- Admin routes must check the account's server-verified Clerk public metadata role; authentication alone is not admin access.
- External lead integrations remain disabled until the business configures and authorizes them.

## Product

Visitors can explore services and request a moving quote. Verified administrators can review, search, update, annotate, and export enquiries.

## User preferences

- Do not invent contact details, prices, reviews, credentials, coverage, insurance, or service guarantees.
- Treat route and service availability as subject to confirmation before booking.

## Gotchas

- `MONGODB_URI` is required for lead persistence; the app must fail clearly rather than silently fall back to in-memory or PostgreSQL storage.
- Clerk public metadata role `admin` is required for lead dashboard access.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
