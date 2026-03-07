// biometric.js — WebAuthn/biometric auth client module
// Uses @simplewebauthn/browser from CDN

const SIMPLEWEBAUTHN_CDN = 'https://unpkg.com/@simplewebauthn/browser@13/dist/bundle/index.es5.umd.min.js';

let _lib = null;
async function loadLib() {
  if (_lib) return _lib;
  if (window.SimpleWebAuthnBrowser) { _lib = window.SimpleWebAuthnBrowser; return _lib; }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SIMPLEWEBAUTHN_CDN;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  _lib = window.SimpleWebAuthnBrowser;
  return _lib;
}

export function isBiometricSupported() {
  return !!(window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function');
}

export async function isBiometricAvailable() {
  if (!isBiometricSupported()) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
}

// ─── Register a biometric credential for a logged-in user ────────────────────
export async function registerBiometric(token, deviceName) {
  const lib = await loadLib();
  const beginRes = await fetch('/api/auth/webauthn/register/begin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  });
  const options = await beginRes.json();
  if (!beginRes.ok) {
    throw new Error(options.error || 'Failed to start biometric setup');
  }

  let attResp;
  try {
    attResp = await lib.startRegistration({ optionsJSON: options });
  } catch (e) {
    if (e.name === 'NotAllowedError') throw new Error('Biometric prompt was cancelled or timed out.');
    if (e.name === 'InvalidStateError') throw new Error('This device is already registered.');
    throw new Error('Biometric setup failed: ' + (e.message || e.name));
  }

  const completeRes = await fetch('/api/auth/webauthn/register/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ response: attResp, deviceName: deviceName || 'My Device' }),
  });
  const result = await completeRes.json();
  if (!completeRes.ok) throw new Error(result.error || 'Failed to save biometric credential');
  return result;
}

// ─── Authenticate with biometric (returns { user, token }) ───────────────────
export async function loginWithBiometric(identifier) {
  const lib = await loadLib();

  const body = {};
  if (identifier && identifier.trim()) {
    body.identifier = identifier.trim();
  }

  const beginRes = await fetch('/api/auth/webauthn/auth/begin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const beginData = await beginRes.json();

  // Server pre-checked credentials — surface the error immediately
  if (beginData.hasCredentials === false) {
    throw new Error(beginData.error || 'No biometric login set up for this account.');
  }
  if (!beginRes.ok) {
    throw new Error(beginData.error || 'Failed to start biometric login');
  }

  const { options, challengeKey } = beginData;

  let assertion;
  try {
    assertion = await lib.startAuthentication({ optionsJSON: options });
  } catch (e) {
    if (e.name === 'NotAllowedError') throw new Error('Biometric prompt was cancelled or timed out.');
    if (e.name === 'NotFoundError')   throw new Error('No fingerprint saved on this device. Sign in with your password and you\'ll be prompted to set it up.');
    if (e.name === 'SecurityError')   throw new Error('Biometric login is blocked on this page. Try opening the app in a full browser tab.');
    throw new Error(e.message || 'Biometric login failed');
  }

  const completeRes = await fetch('/api/auth/webauthn/auth/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response: assertion, challengeKey }),
  });
  const result = await completeRes.json();
  if (!completeRes.ok) throw new Error(result.error || 'Biometric login failed');
  return result;
}

// ─── List credentials ─────────────────────────────────────────────────────────
export async function listBiometricCredentials(token) {
  const res = await fetch('/api/auth/webauthn/credentials', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  if (!res.ok) throw new Error('Failed to fetch credentials');
  return (await res.json()).credentials || [];
}

// ─── Remove a credential ──────────────────────────────────────────────────────
export async function removeBiometricCredential(token, id) {
  const res = await fetch(`/api/auth/webauthn/credentials/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token },
  });
  if (!res.ok) throw new Error('Failed to remove credential');
  return true;
}
