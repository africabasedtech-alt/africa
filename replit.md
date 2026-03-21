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
- **Color Scheme:** Primary colors are `--gold:#d4a017`, `--gold-bright:#f5c842`, `--bg:#06090f`, `--card-bg:#0d1520`, `--card-bg2:#111d2e`. Green accents are used for positive indicators.
- **Typography:** Poppins font from Google Fonts.
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
- **AI User Assistant:** A floating chat widget (`js/ai-assistant.js`) on user-facing pages, powered by OpenAI (`/api/chat` endpoint). Greets users by name, introduces itself as "AB Assistant", encourages investing, emphasizes referral/downline importance, and answers all platform questions intelligently. Falls back to a comprehensive local knowledge base if AI is unavailable. XSS-safe rendering with HTML escaping. Rate-limited to 10 requests/min per IP.
- **Custom Toast/Modal System:** `js/toast-modal.js` provides styled toasts (success/error/info) and modals (confirm/alert) replacing all native `alert()` and `confirm()` dialogs across user-facing pages.
- **AI Admin Assistant:** Integrated into all admin pages (`js/admin-ai-nav.js`), this assistant provides live notifications, status dashboards, analytics, how-to guides, troubleshooting, and leverages ChatGPT for complex queries, offering a hybrid intelligence approach.
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
- **Auth:** JWT for users, HTTP-only cookies for admins, super admin access via secret path, invite-based sub-admin creation.
- **Admin Management:** APIs for sub-admin creation, listing, updating, and deletion.
- **Product Display:** Detailed product cards, admin-side estimated return calculator, tracking of `used_units`.
- **Collection History:** Per-investment and overall collection history for users.
- **User Management:** Full CRUD operations for users, including impersonation and balance adjustments.
- **Permissions:** Granular, role-based access for sub-admins across product, deposit, withdraw, user, service, and settings areas.
- **Impersonation:** Read-only access for admins, with clear UI indicators and safeguards against mutating actions.
- **Exchange Codes:** Admin creation and management of various code types, user redemption.
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