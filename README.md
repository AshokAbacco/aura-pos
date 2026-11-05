# Aura POS — multi-tenant Salon & Spa POS

React (JSX, Vite, Tailwind) + Express 5 + PostgreSQL/Prisma 7 + Razorpay.
Rebuilt from the `profit_loss_ledger_with_graphs (1).html` prototype (kept at `docs/reference-prototype.html`).

The project is two separate apps:

- **`server/`** is the API.
- **`client/`** is the website and the salon app.

Each one has its own `package.json`, `.env` and `node_modules`.

## Run it (two terminals)

You need **Node 22+** and **PostgreSQL 16**. Create the database once:

```bash
createdb aura_dev          # also `createdb aura_test` if you will run the tests
```

**Terminal 1 — server (API on http://localhost:4000)**

```bash
cd server
npm install
npm run setup      # first time only: creates .env, migrates the database, loads demo data
npm run dev
```

**Terminal 2 — client (website + app on http://localhost:5173)**

```bash
cd client
npm install
npm run setup      # first time only: creates .env from .env.example
npm run dev
```

Open **http://localhost:5173**. Demo logins:

| Who | Where | Login |
|---|---|---|
| Salon owner | `/login` | `owner@auraluxe.demo` / `DemoOwner-2026!` |
| Front desk | `/login` | `frontdesk@auraluxe.demo` / `DemoDesk-2026!` |
| Platform admin | `/platform` | `admin@aura.local` / `ChangeMe-Admin-2026!` |

How the two apps connect:

| File | Setting |
|---|---|
| `client/.env` | `VITE_API_BASE_URL=http://localhost:4000/api/v1` |
| `server/.env` | `PORT=4000`, `DATABASE_URL=postgresql://…/aura_dev`, `CLIENT_ORIGIN=http://localhost:5173` |

If `npm run setup` stops, it prints the step that failed. Usually PostgreSQL is not running, or `DATABASE_URL` in `server/.env` is wrong.

### Other commands

| Where | Command | What it does |
|---|---|---|
| `server/` | `npm test` | 97 tests: unit tests, plus integration tests against the `aura_test` database |
| `server/` | `npm run db:migrate` / `npm run db:seed` | Run migrations or load demo data on their own |
| `server/` | `npm run jobs` | Send renewal reminders and low-stock alerts once (for cron) |
| `client/` | `npm run build` | Production build into `client/dist` |
| repo root | `npm install` then `npm run dev` | *Optional:* install both folders and start both in **one** terminal |
| repo root | `npm start` | *Optional:* build the client and serve the website, app and API from **one port** (4000) |

## Folder structure

There is one rule:

- Code that only one feature uses stays inside that feature's folder.
- Code that two or more features use goes in a shared folder.

```
aura-pos/
│
├── client/                         # React + Vite + Tailwind
│   ├── public/                     favicon
│   ├── e2e/screens.mjs             browser smoke run with screenshots
│   ├── src/
│   │   ├── main.jsx                entry point
│   │   ├── app/
│   │   │   ├── App.jsx
│   │   │   ├── router.jsx          puts together every feature's routes
│   │   │   ├── providers.jsx       router, auth, toasts
│   │   │   ├── RequireAuth.jsx
│   │   │   └── NotFoundPage.jsx
│   │   │
│   │   ├── features/               # all feature-specific frontend code
│   │   │   ├── auth/               login, register, forgot/reset password, verify email, accept invite
│   │   │   ├── dashboard/
│   │   │   ├── pos/                billing counter
│   │   │   ├── appointments/       queue & chairs
│   │   │   ├── clients/
│   │   │   ├── catalog/            price list
│   │   │   ├── inventory/
│   │   │   ├── staff/
│   │   │   ├── memberships/
│   │   │   ├── expenses/
│   │   │   ├── invoices/
│   │   │   ├── pnl/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   ├── subscription/
│   │   │   ├── platform-admin/     /platform: separate Super Admin login
│   │   │   └── website/            public marketing pages
│   │   │
│   │   ├── components/             # reusable UI
│   │   │   ├── ui/                 Button, Badge, PageHeader, Skeleton, Empty, ErrorNote
│   │   │   ├── forms/              Field
│   │   │   ├── tables/             DataTable
│   │   │   ├── charts/             ChartCard, chart colours
│   │   │   ├── modals/             Modal, ConfirmDialog
│   │   │   └── receipt/            80 mm / A4 receipt
│   │   │
│   │   ├── layouts/
│   │   │   ├── app/                logged-in shell: sidebar (navItems.js), top bar, subscription banner
│   │   │   └── site/               website header + footer
│   │   │
│   │   ├── hooks/                  useApi, useAuth
│   │   ├── contexts/               AuthContext, ToastContext
│   │   ├── lib/                    api.js (Axios client, token refresh)
│   │   ├── utils/                  format (₹, dates), download (CSV), cx
│   │   ├── assets/                 logo
│   │   └── styles/                 index.css (Tailwind + theme)
│   │
│   ├── .env                        (created by npm run setup, not committed)
│   ├── .env.example
│   ├── .env.single                 used only by the one-port build (root npm start)
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── server/                         # Express + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── sql/constraints.sql     no double-booking, no negative stock / wallet
│   │   └── seed.js                 demo data
│   │
│   ├── scripts/                    setup.js, migrate.js, build-migration.js
│   ├── src/
│   │   ├── app.js                  middleware + registers every feature's routes (start reading here)
│   │   ├── server.js               starts HTTP server (+ jobs when RUN_JOBS=true)
│   │   │
│   │   ├── features/               # all feature-specific backend code
│   │   │   ├── auth/
│   │   │   ├── users/              team members, roles, permissions
│   │   │   ├── platform-admin/
│   │   │   ├── pos/
│   │   │   ├── appointments/
│   │   │   ├── clients/
│   │   │   ├── catalog/
│   │   │   ├── inventory/
│   │   │   ├── staff/
│   │   │   ├── memberships/
│   │   │   ├── expenses/
│   │   │   ├── invoices/
│   │   │   ├── pnl/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   ├── subscription/
│   │   │   └── public/             pricing plans + contact form for the website
│   │   │
│   │   ├── core/                   # shared backend code
│   │   │   ├── middleware/         auth, permissions, subscription checks, request ids, errors
│   │   │   ├── errors/
│   │   │   ├── utils/              http helpers, audit log, branch, time, tokens
│   │   │   ├── logger/
│   │   │   ├── database/           Prisma client
│   │   │   ├── mail/
│   │   │   └── money/              exact decimal money maths
│   │   │
│   │   ├── integrations/
│   │   │   └── razorpay/           orders, signature checks, webhooks
│   │   ├── config/                 env.js (validated settings)
│   │   └── jobs/                   renewal reminders, low-stock alerts, scheduler
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── helpers/
│   │
│   ├── .env                        (created by npm run setup, not committed)
│   ├── .env.example
│   ├── package.json
│   └── prisma.config.ts
│
├── docs/
├── .gitignore
├── package.json                    optional: run both from one terminal
└── README.md
```

### Inside one feature: POS

**Frontend: `client/src/features/pos/`**

```
FloorPage.jsx               /app/pos — chairs by floor; View bill / Bill on each chair
ChairPage.jsx               /app/pos/chairs/:id — add or remove items for the client in that chair
QuickSalePage.jsx           /app/pos/quick — bill without a chair (retail, memberships, appointments)
pos.routes.jsx              the three routes
index.js                    what other features may import from POS
hooks/usePosCart.js         live totals from the server, payments, checkout
hooks/useChairTicket.js     a chair's open ticket: auto-save, version check
hooks/useFloor.js           floor plan data, refreshed every 20 s
components/floor/           FloorSummary, FloorTabs, ChairCard, BillDrawer, MoveChairModal
components/chair/           TicketPanel, BookingBanner, SaveStatus
components/                 CatalogPanel, CartPanel, CartLine, CartTotals, PaymentPicker, ClientPicker, …
utils/                      posDraft.js, pos.constants.js, floor.js
```

**Backend: `server/src/features/pos/`**

| File | Job |
|---|---|
| `pos.routes.js` | API endpoints and who may call them |
| `pos.controller.js` | Reads the request and sends the response |
| `pos.service.js` | Business logic and database work |
| `pos.validation.js` | Rules for incoming data (zod) |
| `pos.pricing.js` | GST, discounts and totals (pure, unit-tested) |
| `pos.chairs.js` | Floor plan and chair tickets (open, save, move, clear) |

Every other feature follows the same pattern:

- frontend: `<Name>Page.jsx`, `<name>.routes.jsx`, `index.js`, plus `components/`, `hooks/` and `utils/` where needed;
- backend: `<name>.routes.js`, `.controller.js`, `.service.js` and `.validation.js`.

When one feature needs something from another, it imports it through that feature's `index.js`. For example, the Price list page uses `RestockModal` from `features/inventory`.

**Finding things:**

- `/api/v1/pos/checkout` is handled in `server/src/features/pos/`.
- `/app/pos` is the screen in `client/src/features/pos/`.

### Adding a new page

1. Create `client/src/features/<name>/<Name>Page.jsx` and `<name>.routes.jsx`.
2. Export the route from `features/<name>/index.js`.
3. Add it to `app/router.jsx`.
4. Add a menu entry in `layouts/app/navItems.js`.

On the server:

1. Create `server/src/features/<name>/` with the four files.
2. Mount its router in `src/app.js`.

## Documentation

- `docs/STATUS.md` — what works, what's left, and what's needed to launch (**start here**)
- `docs/01-source-audit.md` — everything in the prototype, including 27 defects that were fixed
- `docs/02-architecture.md` — decisions, money rules, subscription states, the checkout transaction
- `docs/03-traceability-matrix.md` — each prototype feature mapped to its screen, API, model and test
- `docs/04-operations.md` — env vars, deployment, Razorpay, backups, monitoring
- `docs/05-security.md` — security controls, both implemented and outstanding