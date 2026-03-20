# AfricaBased Investment Platform

## Overview
A web-based investment platform for African users. Features user authentication, deposits, withdrawals, currency exchange, investment tracking, and an admin panel. Uses Supabase as the backend-as-a-service (BaaS) for PostgreSQL, auth, and real-time features.

## PWA (Progressive Web App)
The app is a fully installable PWA — users can add it to their phone home screen and use it offline.
- **manifest.json** — app metadata (name, icons, theme, shortcuts to Dashboard/Deposit/Products)
- **sw.js** — service worker with two cache strategies:
  - Static pages/assets: cache-first (fast load, offline capable)
  - API calls: network-first with cache fallback (live data when online, cached when offline)
- **offline.html** — branded offline fallback page; auto-detects reconnection and reloads
- **js/pwa.js** — registers the SW and shows a native-style "Install AfricaBased" banner using `beforeinstallprompt`
- All main user pages include the manifest link, Apple PWA meta tags, and pwa.js

## Architecture
- **Frontend:** Static HTML/CSS/JS with vanilla JavaScript and ES modules
- **Backend:** Express.js server (`server.js`) — auth, balance, referral, and admin management APIs
- **Database:** Supabase PostgreSQL (via `SUPABASE_DATABASE_URL` env var, pooler connection). Falls back to `DATABASE_URL` (Replit DB) if Supabase URL not set.
- **Package Manager:** npm

## Auth System
- User auth: JWT tokens (`ab_token`/`ab_user` in localStorage) via `/api/auth/*`
- Super admin login: `admin-login.html` served at secret path `/ab-secure` (env: `ADMIN_SECRET_PATH`, default `ab-secure`). Triggered via 5-click logo on login.html and home.html. The old `/admin-login` URL is blocked (redirects to home).
- Sub-admin system: Invite-link based — super admin creates invites in `admin-management.html`, which calls `/api/admin/invite` to store in the `admin_invites` DB table. Sub-admins use the generated link in `admin-login-admin.html` which validates via `/api/admin/login`.
- Admin page protection: All admin HTML pages (`Admin-panel`, `admin-settings`, etc.) require a server-side HTTP-only cookie `_abAdmin` (set via `POST /api/admin/set-page-session` after successful login). Without it, requests redirect to home. Cookie secret in `ADMIN_PAGE_SECRET` env var.
- `POST /api/admin/set-page-session` — validates admin key and sets `_abAdmin` cookie (8h TTL)
- `POST /api/admin/clear-page-session` — clears admin cookie + admin session row (called on logout)

## Admin Session System (Server-Side)
- All admin session data stored in `admin_sessions` table (Supabase), NOT in localStorage
- `_abAdminSession` httpOnly cookie (8h TTL) holds session token
- `POST /api/admin/super-login` — creates session for super admin, sets cookie
- `POST /api/admin/login` — creates session for sub-admin, sets cookie
- `GET /api/admin/me` — reads cookie, returns admin data (enriched with live privileges from admin_invites for sub-admins). Returns `{ admin: {..., isSubAdmin}, isSuper }`.
- `js/admin-pin.js` — fetches `/api/admin/me` on load, caches to `window.__abAdminKey`, `window.__abAdminData`, `window.__abIsSuper`, `window.__abIsSubAdmin`. Exposes `window.__abAdminReady` promise for scripts that need to await key hydration.
- All admin pages use `/api/admin/me` for auth guards and sub-admin redirect logic (no localStorage for adminData, superAdmin, ab_admin_key, ab_sub_admin, adminPrivileges)

## Admin Management API
- `POST /api/admin/invite` — create sub-admin (requires `x-admin-key: 1540568e` header)
- `GET /api/admin/invites` — list all sub-admins
- `PUT /api/admin/invite/:id` — update status/privileges
- `DELETE /api/admin/invite/:id` — delete/revoke an admin
- `POST /api/admin/login` — validate sub-admin login with token + email + password + api_key
- `GET /api/admin/my-permissions` — returns current admin's privileges and product_permissions

## Product Display & Investment
- Product cards on `products.html` show: Investment Required, Daily Returns, Duration, and Total Units
- Admin product form (`admin-product.html`) includes a live Estimated Return Preview panel showing Total Return, Net Profit, ROI, and warnings for unreasonable values (ROI > 200% or negative returns)
- Admin product ID comparisons use loose equality (`==`) since API returns numeric IDs but HTML onclick passes strings
- `products.used_units` column: tracks how many units have been used/sold. Auto-increments when users invest. Admins with product edit permission can manually edit this value via the product edit form.
- Active products API returns `units_sold` as `GREATEST(used_units, computed_from_investments)` to ensure consistency

## Collection History & Tracking
- `collection_logs` table: Records every income collection with investment_id, user_id, product_name, amount, collected_at
- `investments.total_collected` column: Running total of all collected income per investment
- `GET /api/investments/collections/:id`: Returns collection history for a specific investment (auth-scoped)
- `GET /api/investments`: Returns `total_collected` and `collection_count` per investment
- My-products page (`My-products.html`): Shows per-investment total collected vs expected, collection count, and expandable collection history log. Summary shows grand total collected across all investments.

## Admin User Management
- Admin user management page (`admin-user.html`) supports: viewing users, search/filter, sort, export (CSV/PDF), and actions (impersonate, edit profile, credit/debit balance, lock/unlock, reset password, delete)
- **Add User**: Admins can create new users via the "Add User" button. Endpoint: `POST /api/admin/users` (requires `user_edit` permission). Creates user + profile atomically in a DB transaction with duplicate checks for username, email, and phone.

## Granular Sub-Admin Permission System
All admin endpoints use `requireAnyAdmin` + `requirePrivilege(privilegeName, subPermission)` middleware. Super admins bypass all permission checks. Sub-admins need the privilege in their `privileges` array AND the specific sub-permission in `privilege_limits.<area>_permissions`.

### Permission Areas:
- **Product** (`product_permissions`): `product_view`, `product_add`, `product_edit`, `product_delete`, `product_enable`, `product_disable`
- **Deposit** (`deposit_permissions`): `deposit_view`, `deposit_approve`, `deposit_reject`
- **Withdraw** (`withdraw_permissions`): `withdraw_view`, `withdraw_approve`, `withdraw_reject`
- **User** (`user_permissions`): `user_view`, `user_edit`, `user_balance`, `user_lock`, `user_password`, `user_delete`
- **Service** (`service_permissions`): `service_view`, `service_add`, `service_edit`, `service_delete`
- **Settings** (`settings_permissions`): `settings_view`, `settings_edit`
- **Impersonate** (`impersonate_permissions`): `impersonate_view_only` (view only, no changes), `impersonate_full_access` (act as user with full permissions). Super admin always gets full access. Legacy `impersonate_user` treated as view-only.

### Key Details:
- Empty permissions array = full access (backward compatibility for older sub-admins)
- `GET /api/admin/my-permissions` returns all permission sets for current admin
- Admin management page (`admin-management.html`) shows sub-permission checkboxes for each area
- Admin list cards display colored tags showing assigned sub-permissions
- Amount limits (withdraw, deposit, manual_deposit, exchange) are separate from sub-permissions

## Impersonation (Read-Only)
- When a sub-admin impersonates a user via `POST /api/admin/users/:id/impersonate`, the JWT token includes `impersonated_by: 'admin'`
- `requireAuth` middleware sets `req.isImpersonated = true` for impersonated sessions
- `rejectIfImpersonated` middleware blocks all mutating user endpoints (POST/PUT/DELETE on deposits, withdrawals, investments, profile, exchange redeem, etc.) with a 403 error
- `GET /api/auth/me` returns `isImpersonated: true` for impersonated sessions
- `js/impersonation-guard.js` is included on all user-facing pages: shows a fixed red "VIEW-ONLY MODE" banner at the top, disables action buttons (invest, deposit, withdraw, etc.), and provides an "Exit" button to end the session
- The impersonated admin can view balances, investments, deposits, withdrawals, referrals, and profile data but cannot modify anything

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
- The app uses Supabase PostgreSQL as the primary database.
- Connection: Managed via `SUPABASE_DATABASE_URL` environment variable (pooler connection). Falls back to `DATABASE_URL` (Replit DB) if not set.
- SSL is enabled automatically for Supabase connections (supabase.co/supabase.com hosts).
- The Express server in `server.js` uses the `pg` library.

## AI User Assistant
- `js/ai-assistant.js` + `css/ai-assistant.css` — floating chat widget on all user-facing pages
- Appears as a teal robot bubble in bottom-right corner with notification badge
- Opens into a chat panel with context-aware welcome messages per page
- Smart keyword-based FAQ covering: registration, login, investing, deposits, withdrawals, referrals, commissions, exchange codes, profile, statistics, security, support
- Suggestion buttons adapt to the current page context
- Included on: index.html, login.html, home.html, products.html, My-products.html, deposit.html, auto-deposit.html, manual-deposit.html, withdraw.html, referrals.html, exchange.html, profile.html, statistics.html, Services.html, forgot-password.html

## AI Admin Assistant
- `js/admin-ai-nav.js` — injected on all 14 admin pages. Floating robot FAB in bottom-right.
- **Live notifications**: Fetches `GET /api/admin/ai-nav-summary` on load and every 60s. Shows alert banners for pending deposits/withdrawals + new users. FAB badge shows total pending count.
- **Status dashboard**: Type "status" to see grid with pending deposits, pending withdrawals, total users, active sub-admins, active products, active investments. Follow-up links to analytics and today's activity.
- **Analytics**: Type "analytics" for full financial overview — total deposited, total withdrawn, net flow, active invested, platform wallet/earnings pools, 24h activity (new users, deposits, withdrawals), platform stats (active products, investments, exchange codes).
- **Today's activity**: Type "today" for focused 24h report.
- **Sub-admin tracking** (super admin only): Type "show sub-admins" to see list of all sub-admins with name, email, status, last login, exchange usage.
- **42 how-to guides**: Covers every admin task — products (add/edit/disable/free), deposits (approve/reject/history), withdrawals (approve/reject/refund), sub-admins (create/edit/delete/track/permissions), announcements, exchange codes (generate/manage/types), settings, services, referrals, impersonation, balances, investments, maintenance.
- **10 troubleshooting guides**: Deposit not showing, can't withdraw, login issues, investment not collecting, exchange code errors, sub-admin access problems, sold-out products, balance discrepancies, fraud handling, giving bonus funds.
- **ChatGPT-powered AI**: When the built-in KB can't answer a question, the assistant calls `POST /api/admin/ai-chat` which uses OpenAI (gpt-5-mini via Replit AI Integrations) with a comprehensive system prompt about the entire platform. The AI has full knowledge of all admin pages, balance rules, investment lifecycle, permissions, troubleshooting, and live platform stats injected into each query. Rate limited to 20 requests/minute.
- **Hybrid intelligence**: Local KB handles exact matches instantly (status, analytics, navigation, how-to guides), ChatGPT handles open-ended questions, complex troubleshooting, strategy advice, and anything the KB doesn't cover. Shows "Thinking..." animation while waiting for AI.
- **Conversational chat UI**: Messages appear as user/bot chat bubbles. Session history preserved while panel is open. AI responses show a purple "AI-Powered Response" badge.
- **Contextual suggestions**: Every response includes relevant follow-up suggestion buttons.
- **Smart search**: Keyword + token matching across pages, actions, and troubleshooting KB. Shows best match + related pages.
- **Role-gated results**: Super-admin-only pages/actions filtered for sub-admins.
- **Privilege-respecting backend**: Summary endpoint returns 15+ data points gated by admin privileges.
- **XSS-safe**: User input in unknown-query display is HTML-escaped. Chat user messages rendered via textContent.
- **Close behavior**: Escape key, click outside, or click X to close.
- **Auto-refresh**: Panel content updates when pending counts change while panel is open.

## Premium Gold/Dark Theme
All user-facing pages use a unified premium gold/dark theme:
- **Colors:** `--gold:#d4a017`, `--gold-bright:#f5c842`, `--bg:#06090f`, `--card-bg:#0d1520`, `--card-bg2:#111d2e`
- **Font:** Poppins (Google Fonts)
- **Bottom Tab Bar:** Fixed 72px gold tab bar on all authenticated pages (Home/Invest/Holdings/Wallet/Profile)
- **Green accents** reserved for positive/success indicators (income, progress bars, invest buttons)
- **Service Worker:** `africabased-v4` cache version in sw.js
- **Pages themed:** index.html, login.html, home.html, profile.html, products.html, My-products.html, deposit.html, withdraw.html, exchange.html, statistics.html, referrals.html, forgot-password.html, reset-password.html, terms.html, offline.html, manual-deposit.html, auto-deposit.html, progress.html, apply-promotion.html

## Recent Feature Additions
- **Announcement ticker**: Admin-enabled announcements display as a scrolling marquee on home.html (fetched from `/api/homepage`, colour-coded by type: info/warning/success)
- **Broadcast email**: Admin-panel.html has "Broadcast Email to All Users" section → `POST /api/admin/broadcast-email` (super admin only). Sends styled HTML email to all users with email addresses.
- **Install App (PWA)**: profile.html shows "Install App" button (PWA install prompt) instead of APK download; APK removed
- **Profile Account dropdown**: Services (Deposit, Withdraw, Exchange, Statistics) moved into the Account section on profile.html alongside My Profile
- **Weekend collection block**: Investments and referral commission cannot be collected on Saturday OR Sunday (previously only Sunday)
- **24h collection rule**: Investment collection enforces 24 hours since last collection (or since investment start for first collection), instead of calendar-day comparison
- **Free product active status fix**: Only paid investments (products.price > 0) count toward has_investment / active status / commission eligibility
- **Investment opportunity price removed**: Admin settings no longer shows a price field for homepage investment opportunities
- **Login success modal**: login.html shows animated "Welcome Back! Hi {username}" modal with progress bar instead of plain text alert
- **Account created modal**: After phone step (save or skip), animated "Account Created!" modal with pulsing icon before redirect
- **OTP auto-verify**: All 6 OTP digits entered → verification auto-triggers (no button click needed)
- **Email verification link**: OTP email now includes a "Verify My Account" button linking to `/?otp=CODE&email=EMAIL`. Page load detects these params, auto-fills the OTP digits
- **OTP sessionStorage persistence**: `_pendingReg` saved to sessionStorage when OTP is sent; restored on page return so modal re-opens
- **Phone modal payment hints**: 40 African countries each have payment method name shown dynamically when country is selected; digit count validation per country
- **Landing page redesign**: Professional fintech layout — feature list rows (Instant Deposits, Daily Returns, Referrals, Security), clean payment methods grid, styled left-border testimonials, second CTA at bottom. No emoji-heavy "cartoonish" elements.

## Development
- Run: `node server.js`
- Server listens on `0.0.0.0:5000`
- Workflow: "Start application" → `node server.js` on port 5000

## Deployment
- Target: autoscale
- Run command: `node server.js`
