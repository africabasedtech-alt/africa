Deployment checklist and instructions

This project is a static site that uses the Supabase JavaScript client (supabase-js) from a module at `supabaseClient.js`.

Quick summary
- Serve the site over HTTP(S) (do NOT open pages with file://). Use a simple static server in development.
- Do NOT embed production keys into source. Use runtime injection via `window.__ENV` or call `initSupabaseClient(url, anonKey)` early in your app start-up.

Local dev (quick)
1. From the project root run a simple server (Python built-in server):

```powershell
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

2. Ensure `supabaseClient.js` is reachable at the root URL: http://localhost:8000/supabaseClient.js

Runtime configuration options
1) Inject `window.__ENV` before importing `supabaseClient.js`.
   - Copy `env.example.js` to `env.js`, fill in your project URL and anon key, and include it in your HTML before `supabaseClient.js`:

```html
<script src="env.js"></script>
<script type="module" src="supabaseClient.js"></script>
```

2) Or call `initSupabaseClient(url, anonKey)` explicitly from your bootstrap script before other modules that call `getSupabaseClient()`.

Security and production notes
- The project currently contains fallback values in `supabaseClient.js` for convenience during development. Remove or override these in production builds.
- Anon keys allow unauthenticated requests according to your DB policies — for secure ops use row-level security, policies, and server-side service-role endpoints for privileged actions.
- Never commit your service-role key or other secrets to source control.

Database notes
- Ensure required tables exist (`profiles`, `users`, any application-specific tables) and adjust RLS policies so authenticated users can write/read only appropriate rows.

What I changed to help prepare for deployment
- Normalized `supabaseClient.js` import paths in HTML to be relative (no leading `/`).
- Removed a duplicate `register.js` and consolidated the canonical `js/register.js` implementation.
- Added `env.example.js` to show how to inject runtime config.

Next steps (suggested)
- Run the app via local server and try the registration/login flows. Capture any console/network errors and fix as needed.
- If you want, I can add a small `bootstrap.js` that calls `initSupabaseClient(...)` using values from `env.js` and ensure it's included early in your HTML.
