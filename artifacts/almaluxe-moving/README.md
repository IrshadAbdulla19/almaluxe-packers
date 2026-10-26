# Almaluxe Packers & Movers

Responsive moving-services website with a quote form and private enquiry
dashboard. The site is only for Almaluxe Packers & Movers; it intentionally
excludes the separate export business and food-export products.

## Run locally in Replit

The project has two managed services:

- Website: `pnpm --filter @workspace/almaluxe-moving run dev`
- API: `pnpm --filter @workspace/api-server run dev`

For the quote form to save enquiries, add `MONGODB_URI` in Replit Secrets. The
app returns an explicit unavailable message while MongoDB is unconfigured; it
does not silently save customer details to memory or another database.

Clerk keys are provisioned by Replit. Authentication alone does not grant
dashboard access. Grant `publicMetadata.role = "admin"` to the intended user in
both the Development and Production Clerk environments.

## Pages

- `/` — home
- `/about` — about the moving business
- `/services` — available/requestable moving services
- `/areas` — service-area information; coverage must be confirmed
- `/quote` — quote request form
- `/contact` — contact details from the supplied moving-company flyer
- `/privacy` — enquiry privacy notice
- `/admin` — Clerk-protected enquiry management
- `/sign-in` — administrator sign-in

## Data flow

1. A visitor submits the quote form.
2. Express validates the request, applies a per-IP rate limit and a honeypot
   check, then stores the enquiry in MongoDB.
3. The private admin routes validate the Clerk session and fetch the account
   from Clerk. The server requires `publicMetadata.role` to equal `admin`.
4. Administrators can search/filter records, update status, add internal notes,
   review summary counts, and stream a CSV export.

The OpenAPI file in `lib/api-spec/openapi.yaml` defines the request/response
contract. Generated React Query hooks and Zod schemas live in `lib/`. Run
`pnpm --filter @workspace/api-spec run codegen` after changing the contract.

## Project map for learning MERN

This project uses the typical MERN responsibilities, organized in the Replit
workspace:

- `artifacts/almaluxe-moving/src/` — React pages, components, forms, routing,
  styles, and browser-side API usage.
- `artifacts/api-server/src/models/` — Mongoose document schemas, equivalent
  to the MongoDB model layer.
- `artifacts/api-server/src/routes/` — Express endpoints; each route validates
  inputs and calls the model.
- `artifacts/api-server/src/middlewares/` — Clerk admin authorization, same-
  origin mutation checks, and quote-form rate limiting.
- `artifacts/api-server/src/integrations/` — optional provider adapters.
- `lib/api-spec/openapi.yaml` — shared API contract used to generate typed
  client hooks and server validation schemas.

Useful change loop:

1. Change the API contract in `lib/api-spec/openapi.yaml`.
2. Regenerate with `pnpm --filter @workspace/api-spec run codegen`.
3. Implement the matching Express route and Mongoose persistence.
4. Build the React page using the generated hook.
5. Run `pnpm --filter @workspace/api-server run typecheck`,
   `pnpm --filter @workspace/almaluxe-moving run typecheck`, and
   `pnpm run typecheck`.

## Optional integrations

Provider helpers are present for Google Sheets, WhatsApp Business, and Meta
lead forms. They are not called automatically, so no customer information is
sent outside MongoDB by default.

- **Google Sheets:** set `GOOGLE_SHEETS_SPREADSHEET_ID`,
  `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`; optionally set `GOOGLE_SHEETS_RANGE`.
- **WhatsApp Business:** set `WHATSAPP_PHONE_NUMBER_ID`,
  `WHATSAPP_ACCESS_TOKEN`, and `META_GRAPH_VERSION`. The sending helper is
  intended only for approved templates after recipient opt-in.
- **Facebook/Instagram lead forms:** set `META_LEAD_ACCESS_TOKEN`,
  `META_APP_SECRET`, `META_GRAPH_VERSION`, `META_WEBHOOK_VERIFY_TOKEN`, and
  `META_PAGE_ID`. Webhook route registration and Meta app configuration are
  still required before importing live leads.

Keep all credentials in Replit Secrets. Never put them in React code, commit
them, or log them.

## Business details and claims

The supplied moving-company flyer provides the contact details displayed on
the site. Service availability and routes are described as subject to
confirmation. No prices, reviews, certifications, insurance coverage, or
service guarantees are asserted.
