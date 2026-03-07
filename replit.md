# AfricaBased Investment Platform

## Overview
A web-based investment platform for African users. Features user authentication, deposits, withdrawals, currency exchange, investment tracking, and an admin panel.

## Architecture
- **Frontend:** Static HTML/CSS/JS with vanilla JavaScript and ES modules
- **Backend:** Express.js server (`server.js`) — auth, balance, referral, and admin management APIs
- **Database:** Replit PostgreSQL (managed via `DATABASE_URL`)
- **Package Manager:** npm

## Running the App
- Workflow: "Start application" → `node server.js` on port 5000

## Auth System
- User auth: JWT tokens (`ab_token`/`ab_user` in localStorage) via `/api/auth/*`
- Super admin login: served at `/ab-secure` (env: `ADMIN_SECRET_PATH`, default `ab-secure`). Triggered via 5-click logo on login.html.
- Sub-admin system: Invite-link based

## Database Tables
- `users` — user accounts (username, email, phone, password_hash)
- `profiles` — user balances: `account_balance` + `wallet_balance`
- `sessions` — auth sessions with JWT tokens
- `admin_invites` — sub-admin credentials
- `deposits` — deposit records
- `withdrawals` — withdrawal records
- `investments` — active investments
- `products` — investment products
- `exchange_codes` — admin-created exchange/redemption codes
- `exchange_redemptions` — tracks code redemptions
- `system_settings` — key/value config store
- `webauthn_credentials` — biometric/passkey credentials

## Balance Rules
- `wallet_balance`: deposited funds — can invest but CANNOT withdraw
- `account_balance`: earnings/income — can both withdraw AND invest
- Investment deducts from `wallet_balance` first, then `account_balance`

## Key Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-set)
- `JWT_SECRET` — for signing auth tokens
- `GMAIL_APP_PASSWORD` — for sending emails via Gmail
- `INTASEND_API_KEY` / `INTASEND_SECRET` — for M-Pesa STK push
- `ADMIN_SECRET_PATH` — URL path to admin login (default: `ab-secure`)
- `ADMIN_PAGE_SECRET` — cookie secret for admin sessions
