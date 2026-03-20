// supabaseClient.js (ESM - browser-ready)
// Loads the supabase-js ESM build from jsdelivr and exposes helpers.
// NOTE: anon keys are safe to include on public clients. Do NOT put service_role keys here.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.34.0/dist/supabase.min.js';

const supabaseUrl = 'https://xkygvyzlamrmmuixcyuc.supabase.co';
const supabaseAnonKey = window.__SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Also expose to window so non-module scripts can access it
window.supabase = supabase;

/*
 Helper wrappers
 - isAuthenticated(): returns true if there's an active session
 - getCurrentUser(): returns the user object or null
 - signUp(email, password): returns { data, error }
 - signIn(email, password): returns { data, error }
 - signOut(): returns { error }
*/

export const isAuthenticated = async () => {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('getSession error', error);
    return false;
  }
  return !!(sessionData && sessionData.session);
};

export const getCurrentUser = async () => {
  const { data: userData, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('getUser error', error);
    return null;
  }
  return userData ? userData.user : null;
};

export const signUp = async (email, password) => {
  return await supabase.auth.signUp({ email, password });
};

export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Optional: listen for auth state changes and re-expose on window
supabase.auth.onAuthStateChange((event, session) => {
  // simple global hook — you can replace with event dispatching
  window.__SUPABASE_AUTH_EVENT = { event, session };
  console.info('Auth event', event);
});

// ─── DUAL-WRITE PROXY ─────────────────────────────────────────────────────────
// Transparently mirrors every Supabase write to Replit's PostgreSQL database.
// No changes needed in any page — this hooks at the client level.

function _mirrorToReplit(table, operation, data) {
  fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, operation, data })
  }).catch(() => {});
}

function _patchBuilder(builder, table, operation, data) {
  const origThen = builder.then.bind(builder);
  builder.then = function (onfulfilled, onrejected) {
    return origThen(function (result) {
      if (!result.error) {
        _mirrorToReplit(table, operation, data);
      }
      return onfulfilled ? onfulfilled(result) : result;
    }, onrejected);
  };
  return builder;
}

(function applyDualWriteProxy() {
  const origFrom = supabase.from.bind(supabase);

  supabase.from = function (table) {
    const qb = origFrom(table);

    const origInsert = qb.insert.bind(qb);
    qb.insert = function (data, opts) {
      return _patchBuilder(origInsert(data, opts), table, 'insert', data);
    };

    const origUpsert = qb.upsert.bind(qb);
    qb.upsert = function (data, opts) {
      return _patchBuilder(origUpsert(data, opts), table, 'upsert', data);
    };

    const origUpdate = qb.update.bind(qb);
    qb.update = function (data, opts) {
      return _patchBuilder(origUpdate(data, opts), table, 'update', data);
    };

    return qb;
  };

  console.info('AfricaBased: dual-write proxy active (Supabase → Replit DB)');
})();
