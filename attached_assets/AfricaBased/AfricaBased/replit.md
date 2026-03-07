# AfricaBased Investment Platform

## Overview
A web-based investment platform for African users. Features user authentication, deposits, withdrawals, currency exchange, investment tracking, and an admin panel. Uses Supabase as the backend-as-a-service (BaaS) for PostgreSQL, auth, and real-time features.

## Architecture
- **Frontend:** Static HTML/CSS/JS with vanilla JavaScript and ES modules
- **Backend:** Express.js server (`server.js`) — auth, balance, referral, and admin management APIs
- **Database:** Replit PostgreSQL (managed via `DATABASE_URL`)
- **Package Manager:** npm

## Auth System
- User auth: JWT tokens (`ab_token`/`ab_user` in localStorage) via `/api/auth/*`
- Super admin login: `admin-login.html` served at secret path `/ab-secure` (env: `ADMIN_SECRET_PATH`, default `ab-secure`). Triggered via 5-click logo on login.html and home.html. The old `/admin-login` URL is blocked (redirects to home).
- Sub-admin system: Invite-link based — super admin creates invites in `admin-management.html`, which calls `/api/admin/invite` to store in the `admin_invites` DB table. Sub-admins use the generated link in `admin-login-admin.html` which validates via `/api/admin/login`.
- Admin page protection: All admin HTML pages (`Admin-panel`, `admin-settings`, etc.) require a server-side HTTP-only cookie `_abAdmin` (set via `POST /api/admin/set-page-session` after successful login). Without it, requests redirect to home. Cookie secret in `ADMIN_PAGE_SECRET` env var.
- `POST /api/admin/set-page-session` — validates admin key and sets `_abAdmin` cookie (8h TTL)
- `POST /api/admin/clear-page-session` — clears admin cookie (called on logout)

## Admin Management API
- `POST /api/admin/invite` — create sub-admin (requires `x-admin-key: 1540568e` header)
- `GET /api/admin/invites` — list all sub-admins
- `PUT /api/admin/invite/:id` — update status/privileges
- `DELETE /api/admin/invite/:id` — delete/revoke an admin
- `POST /api/admin/login` — validate sub-admin login with token + email + password + api_key
- `GET /api/admin/my-permissions` — returns current admin's privileges and product_permissions

## Product Permissions (Granular)
- Sub-admins with `product` privilege can have granular product permissions stored in `privilege_limits.product_permissions`
- Available permissions: `product_view`, `product_add`, `product_edit`, `product_delete`, `product_enable`, `product_disable`
- Super admin always has all permissions; sub-admins without `product` privilege get no access
- Empty `product_permissions` array = full product access (backward compatibility for older sub-admins)
- Product endpoints use `requireAnyAdmin` + `requireProductPermission()` middleware
- Toggle endpoint checks `product_enable` or `product_disable` based on current product state
- Admin management page shows sub-permission checkboxes when "Product Management" is checked

## Database Tables
- `users` — user accounts (username, email, phone, password_hash)
- `profiles` — user balances: `account_balance` (earnings, withdrawable) + `wallet_balance` (deposits, investable not withdrawable)
- `admin_invites` — sub-admin credentials (password_hash, api_key, privileges, expires_at, token, exchange_limit)
- `deposits` — deposit records (STK push + manual); approved deposits credit `wallet_balance`
- `withdrawals` — withdrawal records; deducted from `account_balance` only
- `investments` — active investments (product_name, amount, hold_period, daily_earnings)
- `exchange_codes` — admin-created exchange/redemption codes (type, amount, pool_amount, users_count, expiry, etc.)
- `exchange_redemptions` — tracks who redeemed which code and how much

## Balance Rules
- `wallet_balance`: deposited funds — can invest but CANNOT withdraw
- `account_balance`: earnings/income — can both withdraw AND invest
- Investment deducts from `wallet_balance` first, then `account_balance`
- Rejected withdrawal refunds go to `account_balance`
- Exchange code redemptions credit `account_balance`

## Exchange Code System
- Admin creates codes via `admin-exchange.html` → stored in DB via `POST /api/admin/exchange-codes`
- Users redeem codes in `exchange.html` → validated and credited via `POST /api/exchange/redeem`
- Admin views/manages codes (list, delete, toggle) via `GET/DELETE/PATCH /api/admin/exchange-codes`
- Code types: single, bulk (multi single), random (pool split), referral, user-assigned
- Both super admin (key: 1540568e) and sub-admins can create codes
- Sub-admins have configurable exchange limits tracked in `admin_invites.exchange_generated`

## Database Configuration
- The app uses Replit's built-in PostgreSQL.
- Connection: Managed via `DATABASE_URL` environment variable.
- Schema: Defined in `replit_db_setup.sql`.
- API: The backend provides endpoints like `/api/users/count` to interact with the database.
- Integration: The Express server in `server.js` uses the `pg` library.

## Supabase Configuration (Original)
- Project URL: `https://dcbxjekrwgblxpyfhyat.supabase.co`
- Credentials are embedded in `js/supabaseClient.js` (anon key).
- Can be overridden via `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars.

## Development
- Run: `node server.js`
- Server listens on `0.0.0.0:5000`
- Workflow: "Start application" → `node server.js` on port 5000

## Deployment
- Target: autoscale
- Run command: `node server.js`
