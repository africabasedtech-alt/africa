// api-auth.js — Replaces Supabase auth with our own backend API
// All auth calls go to /api/auth/* on the Express server

const API = '';

// ─── Token storage helpers ────────────────────────────────────────────────────
// Token is always stored in localStorage so every page can find it reliably.
// JWT expiry on the server controls session length; "remember me" only
// controls the token lifetime the server issues (handled in signIn payload).

function getToken() {
  return localStorage.getItem('ab_token') || sessionStorage.getItem('ab_token');
}

function setToken(token) {
  localStorage.setItem('ab_token', token);
  sessionStorage.removeItem('ab_token');
}

function clearToken() {
  localStorage.removeItem('ab_token');
  localStorage.removeItem('ab_user');
  localStorage.removeItem('ab_persist');
  sessionStorage.removeItem('ab_token');
}

function setUser(user) {
  localStorage.setItem('ab_user', JSON.stringify(user));
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('ab_user')); } catch { return null; }
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, { ...options, headers });
  return res;
}

// Safely parses an API response. Always returns { ok, status, data, error }
// where `error` is a user-friendly message string (or null on success).
// Never throws — network failures and non-JSON responses become structured errors.
async function safeRequest(path, options = {}) {
  let res;
  try {
    res = await apiFetch(path, options);
  } catch (err) {
    console.error('[api] Network error calling', path, err);
    return { ok: false, status: 0, data: null,
      error: 'Cannot reach the server. Please check your internet connection and try again.' };
  }
  let data = null;
  let parseFailed = false;
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text);
  } catch (err) {
    parseFailed = true;
    console.error('[api] Non-JSON response from', path, 'status', res.status, err);
  }
  if (!res.ok) {
    const msg = (data && data.error)
      || (parseFailed ? `Server error (${res.status}). Please try again in a moment.`
                      : `Request failed (${res.status}).`);
    return { ok: false, status: res.status, data, error: msg };
  }
  if (parseFailed || data === null) {
    return { ok: false, status: res.status, data: null,
      error: 'The server returned an unexpected response. Please try again in a moment.' };
  }
  return { ok: true, status: res.status, data, error: null };
}

// ─── Idle Timeout ─────────────────────────────────────────────────────────────
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
let _idleTimer = null;

function _resetIdleTimer() {
  if (!getToken()) return;
  clearTimeout(_idleTimer);
  _idleTimer = setTimeout(_idleLogout, IDLE_TIMEOUT_MS);
}

async function _idleLogout() {
  await signOut();
  // Only redirect if we're on a protected page (not already on login/home landing)
  const p = window.location.pathname;
  if (p !== '/' && !p.includes('/login') && !p.includes('index')) {
    window.location.href = '/login?reason=idle';
  }
}

const _IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export function startIdleGuard() {
  if (!getToken()) return;
  _IDLE_EVENTS.forEach(e => window.addEventListener(e, _resetIdleTimer, { passive: true }));
  _resetIdleTimer();
}

export function stopIdleGuard() {
  clearTimeout(_idleTimer);
  _IDLE_EVENTS.forEach(e => window.removeEventListener(e, _resetIdleTimer));
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────
export async function sendRegistrationOtp(username, email, password) {
  const r = await safeRequest('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });
  if (!r.ok) return { error: { message: r.error, status: r.status } };
  return { data: r.data };
}

export async function signUp(username, phone, email, password, otp, referral_code) {
  const body = { username, phone, email, password, otp };
  if (referral_code) body.referral_code = referral_code;
  const r = await safeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  if (!r.ok) return { error: { message: r.error, status: r.status } };
  if (!r.data || !r.data.token || !r.data.user) {
    return { error: { message: 'Sign-up succeeded but the response was incomplete. Please try signing in.', status: r.status } };
  }
  setToken(r.data.token);
  setUser(r.data.user);
  startIdleGuard();
  return { data: r.data };
}

// ─── Sign In ─────────────────────────────────────────────────────────────────
export async function signIn(identifier, password, remember) {
  const r = await safeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  });
  if (!r.ok) return { error: { message: r.error, status: r.status } };
  if (!r.data || !r.data.token || !r.data.user) {
    return { error: { message: 'Sign-in response was incomplete. Please try again.', status: r.status } };
  }
  setToken(r.data.token);
  setUser(r.data.user);
  startIdleGuard();
  return { data: r.data };
}

// ─── Sign Out ────────────────────────────────────────────────────────────────
export async function signOut() {
  stopIdleGuard();
  // Always clear locally first so nothing leaks
  clearToken();
  // Then tell the server (best-effort)
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
}

// ─── Get Current User ─────────────────────────────────────────────────────────
export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) { clearToken(); return null; }
    const data = await res.json();
    setUser(data.user);
    return data.user;
  } catch {
    // Server unreachable — do NOT fall back to stale localStorage; treat as logged-out
    clearToken();
    return null;
  }
}

// ─── Get Session (returns session-like object for compat) ────────────────────
export async function getSession() {
  const token = getToken();
  if (!token) return { session: null };
  try {
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) { clearToken(); return { session: null }; }
    const data = await res.json();
    setUser(data.user);
    return { session: { user: data.user, access_token: token } };
  } catch {
    // Server unreachable — do NOT fall back to stale localStorage; treat as logged-out
    clearToken();
    return { session: null };
  }
}

// ─── Check auth and redirect if not logged in ─────────────────────────────────
export async function checkAuthState() {
  const { session } = await getSession();
  if (!session) {
    const p = window.location.pathname;
    if (!p.includes('/login') && !p.includes('index') && p !== '/') {
      window.location.href = '/login';
      return false;
    }
  } else {
    startIdleGuard();
  }
  return true;
}

// ─── Get profile ──────────────────────────────────────────────────────────────
export async function getProfile() {
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) return null;
  const data = await res.json();
  return data.profile || data.user;
}

// ─── Update profile ───────────────────────────────────────────────────────────
export async function updateProfile(fields) {
  const res = await apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(fields)
  });
  if (!res.ok) return { error: 'Failed to update profile' };
  return await res.json();
}

// ─── Expose on window for non-module scripts ─────────────────────────────────
if (typeof window !== 'undefined') {
  window.apiAuth = { signUp, signIn, signOut, getCurrentUser, getSession, checkAuthState,
    getProfile, updateProfile, getToken, startIdleGuard, stopIdleGuard,
    sendRegistrationOtp };
}
