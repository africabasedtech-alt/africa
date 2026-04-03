# AfricaBased Investment Platform

## Overview
AfricaBased is a web-based investment platform designed for African users, offering features like user authentication, deposits, withdrawals, currency exchange, and investment tracking. The platform aims to provide a secure and accessible investment environment, contributing to financial inclusion and wealth creation across Africa. It includes a comprehensive admin panel for platform management. The application is built as a Progressive Web App (PWA), ensuring an installable, offline-capable, and engaging user experience.

## User Preferences
I prefer simple language.
I want iterative development.
Ask before making major changes.
I want detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform utilizes a modern web architecture with a focus on performance, scalability, and user experience.

### UI/UX Decisions
The user-facing pages feature a premium gold/dark theme with a unified aesthetic.
- **Color Scheme:** Primary colors are `--gold:#d4a017`, `--gold-bright:#f5c842`, `--bg:#06090f`, `--card-bg:#0d1520`, `--card-bg2:#111d2e`. Green accents are used for positive indicators. Deposit pages use a fully green M-Pesa-inspired theme (`#4CAF50`, `#2e7d32`, `#81c784`).
- **Typography:** Plus Jakarta Sans font from Google Fonts (weights 400–800). Modern geometric sans-serif with premium fintech aesthetic.
- **Navigation:** A fixed 72px gold bottom tab bar on all authenticated pages (Home, Invest, Holdings, Wallet, Profile).
- **Landing Page:** Professional fintech layout with feature lists, payment methods grid, and styled testimonials.
- **Modals:** Animated modals for login success and account creation.
- **PWA Integration:** Full PWA support with `manifest.json`, service worker (`sw.js`) for caching strategies (cache-first for static assets, network-first with cache fallback for APIs), and `offline.html` for branded offline experience.

### Technical Implementations
- **Frontend:** Built with vanilla JavaScript, HTML, and CSS, leveraging ES modules for modularity.
- **Backend:** An Express.js server (`server.js`) handles API endpoints for authentication, balance management, referrals, and administrative functions.
- **Database:** Primarily uses Supabase PostgreSQL for data storage, authentication, and real-time capabilities. It connects via `SUPABASE_DATABASE_URL` (pooler connection) and falls back to `DATABASE_URL` (Replit DB) if not set. SSL is enabled for Supabase connections.
- **Auth System:** JWT-based user authentication stored in localStorage. Admin authentication uses server-side HTTP-only cookies and a robust session management system with granular sub-admin permissions.
- **Admin Session System:** Admin session data is stored in the `admin_sessions` table in Supabase, linked to an HTTP-only cookie `_abAdminSession`.
- **Granular Sub-Admin Permissions:** A detailed permission system allows super admins to assign specific privileges (e.g., product, deposit, user management) and sub-permissions to sub-admins, ensuring role-based access control.
- **Impersonation (Read-Only):** Admins can impersonate users for support purposes, but all mutating user actions are blocked, ensuring data integrity. Impersonated sessions are clearly indicated to the admin and the user (via a "VIEW-ONLY MODE" banner).
- **AI User Assistant:** A floating draggable chat widget (`js/ai-assistant.js`) on user-facing pages, powered by OpenAI (`/api/chat` endpoint). Custom purple SVG icon, draggable bubble that snaps to nearest screen edge. Greets users by name, introduces itself as "AB Assistant", encourages investing, emphasizes referral/downline importance, and answers all platform questions intelligently. Falls back to a comprehensive local knowledge base if AI is unavailable. XSS-safe rendering with HTML escaping. Rate-limited to 10 requests/min per IP.
- **Product Cards:** Investment products displayed in modern cards with image wrapper, gradient overlay, title, sector badge, description (3-line clamp), 2x2 detail grid (Price, Daily, Duration, ROI), and full-width Invest button. No view-details button.
- **Holdings Value Toggle:** My-products page has a show/hide toggle for financial values, persisted in localStorage. Masks summary card values and individual investment card amounts.
- **Custom Toast/Modal System:** `js/toast-modal.js` provides styled toasts (success/error/info) and modals (confirm/alert) replacing all native `alert()` and `confirm()` dialogs across user-facing pages.
- **AI Admin Assistant:** Integrated into all admin pages (`js/admin-ai-nav.js`), this assistant provides live notifications, status dashboards, analytics, how-to guides, troubleshooting, and leverages ChatGPT for complex queries, offering a hybrid intelligence approach.
- **Payment Channels System:** Admin-managed payment channels (M-Pesa numbers, Till numbers, Paybill numbers, Bank transfers, Other) stored in `payment_channels` table. Admin CRUD at `/api/admin/payment-channels` (requires `x-admin-key` header). When deposit mode is manual, `/api/deposit/config` randomly selects an active channel and auto-generates step-by-step instructions based on channel type. Admin page at `admin-payment-channels.html`, linked from Admin Panel.
- **Admin Secret Access:** Profile page membership badge has a 7-tap easter egg that navigates to the admin login page (`/ab-secure`). Admin panel includes a PWA Install App button.
- **About Page:** `about-africabased.html` — comprehensive informational page about AfricaBased Technologies, linked from profile page. Covers mission, vision, core values, key features, platform highlights, how-it-works guide, and financial empowerment messaging.
- **Balance Logic:** Differentiates between `wallet_balance` (deposits, investable, non-withdrawable) and `account_balance` (earnings, withdrawable, investable). Investments prioritize `wallet_balance`.
- **Product Management:** Product cards display investment details. Admin product forms include live estimated return previews.
- **Investment Tracking:** `collection_logs` table records income collections, and `investments.total_collected` tracks overall earnings per investment.
- **User Management:** Admin panel includes comprehensive user management features like search, filter, export, and actions such as editing, crediting/debiting balances, and locking accounts.
- **Exchange Code System:** Admins can create various types of exchange/redemption codes (single, bulk, random, referral, user-assigned) for users to redeem.
- **Announcement Ticker:** Admin-enabled announcements displayed as a scrolling marquee on `home.html`.
- **Email Broadcast:** Super admins can send broadcast emails to all users.
- **OTP System:** Auto-verification for OTPs and email verification links with auto-fill functionality.

### Feature Specifications
- **PWA:** Installable, offline functionality for static pages, network-first with cache fallback for dynamic content.
- **Auth:** JWT for users, HTTP-only cookies for admins, super admin access via secret path, invite-based sub-admin creation. WebAuthn/biometric login (fingerprint/Face ID) via `@simplewebauthn/server` + browser. Users enable from Profile toggle; login page shows "Sign in with Biometrics" button and auto-prompts returning users. Identifier stored in `ab_bio_identifier` localStorage key.
- **Admin Management:** APIs for sub-admin creation, listing, updating, and deletion.
- **Product Display:** Detailed product cards, admin-side estimated return calculator, tracking of `used_units`.
- **Collection History:** Per-investment and overall collection history for users.
- **User Management:** Full CRUD operations for users, including impersonation and balance adjustments.
- **Permissions:** Granular, role-based access for sub-admins across product, deposit, withdraw, user, service, and settings areas.
- **Impersonation:** Read-only access for admins, with clear UI indicators and safeguards against mutating actions.
- **Exchange Codes:** Admin creation and management of various code types, user redemption.
- **Admin PDF Manuals:** Downloadable branded PDF manuals generated on-the-fly via `pdfkit`. Four manuals: Product & Investment, Referral & Commission, Deposit & Withdrawal, Platform Operations Guide. Individual PDF download or bulk ZIP download (via `archiver`). Admin-only endpoints at `/api/admin/manuals`, `/api/admin/manuals/:id`, `/api/admin/manuals-all`. Manual generator module at `js/admin-manuals.js`. Admin page at `admin-manuals.html`, linked from Admin Panel nav grid.
- **AI Assistants:** Context-aware, keyword-based FAQ, live notifications, status dashboards, analytics, and ChatGPT integration for comprehensive support.
- **Balance Rules:** Specific logic for `wallet_balance` vs. `account_balance`, investment deductions, and withdrawal refunds.
- **Investment Rules:** Enforced 24-hour collection rule and weekend collection blocking.

## External Dependencies
- **Supabase:** Used as the primary Backend-as-a-Service (BaaS), providing PostgreSQL database, authentication, and real-time capabilities.
- **Express.js:** Web application framework for Node.js, used for building the backend API.
- **npm:** Package manager for JavaScript.
- **pg:** PostgreSQL client for Node.js.
- **Google Fonts (Poppins):** For consistent typography.
- **OpenAI (gpt-5-mini):** Integrated via Replit AI Integrations for the AI Admin Assistant's advanced conversational capabilities.