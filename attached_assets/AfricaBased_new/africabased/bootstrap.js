// bootstrap.js
// Auth is currently handled by Replit database API (js/api-auth.js).
// To re-enable Supabase, uncomment the lines below and remove the api-auth import.
//
// import { initSupabaseClient, isSupabaseInitialized } from './supabaseClient.js';
// const env = (typeof window !== 'undefined' && window.__ENV) ? window.__ENV : null;
// if (env && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
//   initSupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
// }

import './js/api-auth.js';
console.info('AfricaBased: auth using Replit database.');
