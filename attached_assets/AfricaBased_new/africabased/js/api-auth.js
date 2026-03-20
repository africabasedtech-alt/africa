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

// ─── Device Fingerprint ───────────────────────────────────────────────────────
export async function getDeviceFingerprint() {
  try {
    const parts = [
      navigator.userAgent,
      screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
      navigator.hardwareConcurrency || 0,
      navigator.platform || '',
    ];
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('AfricaBased🌍', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('AfricaBased🌍', 4, 17);
      parts.push(canvas.toDataURL().slice(-50));
    } catch (_) {}
    const raw = parts.join('|');
    let h = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  } catch (_) {
    return null;
  }
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────
export async function sendRegistrationOtp(username, email, password) {
  const res = await apiFetch('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (!res.ok) return { error: { message: data.error } };
  return { data };
}

export async function signUp(username, phone, email, password, otp, referral_code, fingerprint) {
  const body = { username, phone, email, password, otp };
  if (referral_code) body.referral_code = referral_code;
  if (fingerprint)   body.fingerprint   = fingerprint;
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) return { error: { message: data.error } };
  setToken(data.token);
  setUser(data.user);
  startIdleGuard();
  return { data };
}

// ─── Sign In ─────────────────────────────────────────────────────────────────
export async function signIn(identifier, password, fingerprint, remember) {
  const body = { identifier, password };
  if (fingerprint) body.fingerprint = fingerprint;
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) return { error: { message: data.error } };
  setToken(data.token);
  setUser(data.user);
  startIdleGuard();
  return { data };
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
    getProfile, updateProfile, getToken, getDeviceFingerprint, startIdleGuard, stopIdleGuard,
    sendRegistrationOtp };
}
