# Almaluxe Packers & Movers website plan

## Product scope

Build a responsive public website and a secure lead-management dashboard for
Almaluxe Packers & Movers. Exclude the separate Export LLP brand and all
food-export content. Use only facts in the supplied packers-and-movers flyer;
mark any unconfirmed services or routes as subject to confirmation.

## Pages and workflows

1. **Home** — company introduction, moving-service highlights, process, FAQs,
   and clear quote/contact actions.
2. **About Us** — concise company information without invented history or
   credentials.
3. **Moving Services** — household shifting, office relocation, packing and
   unpacking, loading and unloading, and local/long-distance enquiries, with
   availability confirmed before booking.
4. **Service Areas** — Thrissur as the stated primary area, explicitly subject
   to confirmation; visitors can ask about other routes.
5. **Request a Quote** — validated name, phone, optional email, pickup,
   destination, date, property type, service selections, and additional details.
6. **Contact Us** — supplied business contact details and address.
7. **Privacy Policy** — explain enquiry collection and use without unsupported
   retention or compliance claims.
8. **Admin** — Clerk sign-in, server-enforced administrator authorization,
   searchable enquiries, lead source/status, internal notes, summary, and CSV
   export.

## Implementation stages

1. **Application contract and design** — define typed request/response schemas,
   public and admin routes, and the public-site/admin visual system.
2. **Enquiry backend** — add MongoDB persistence, server-side validation,
   rate limiting, spam honeypot, protected lead queries and updates, and CSV
   export. Do not enable writes until MongoDB is configured.
3. **Authentication and authorization** — use Replit-managed Clerk; verify
   admin role on the server for every lead-management operation.
4. **Responsive website** — implement all public pages and the complete quote
   request flow, plus the authenticated admin dashboard.
5. **Integration modules** — scaffold Google Sheets, WhatsApp Business, and
   Meta lead-form adapters; keep them disabled until separately configured.
6. **Verification and handoff** — typecheck/build the app, inspect the public
   preview, document setup, running, deployment, structure, and next steps.

## Setup dependencies

- Add `MONGODB_URI` as a Replit Secret to persist enquiries. MongoDB has no
  connected workspace integration; use a direct server-side connection.
- Grant `publicMetadata.role = "admin"` to an administrator account in Clerk.
- Authorize/configure each optional Google Sheets, WhatsApp Business, or Meta
  integration before enabling data transfer.
