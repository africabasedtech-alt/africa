// api-client.js — Shared HTTP helper for AfricaBased pages
// Loaded as a regular (non-module) script. Exposes window.apiClient with:
//   - apiFetch(path, options) → raw Response (adds Bearer token + JSON header)
//   - safeRequest(path, options) → { ok, status, data, error }
//
// `safeRequest` never throws. On a network outage it returns a friendly
// "Cannot reach the server..." message. On non-2xx responses it surfaces the
// server's `error` field when available, falling back to a status-aware
// message. This is the same helper used by js/api-auth.js for auth flows.

(function () {
  function getToken() {
    try {
      return localStorage.getItem('ab_token') || sessionStorage.getItem('ab_token') || '';
    } catch (_) {
      return '';
    }
  }

  async function apiFetch(path, options) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {});
    var hasBody = options.body != null && !(options.body instanceof FormData);
    if (hasBody && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    var token = getToken();
    if (token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    return fetch(path, Object.assign({}, options, { headers: headers }));
  }

  async function safeRequest(path, options) {
    var res;
    try {
      res = await apiFetch(path, options);
    } catch (err) {
      try { console.error('[api] Network error calling', path, err); } catch (_) {}
      return {
        ok: false,
        status: 0,
        data: null,
        error: 'Cannot reach the server. Please check your internet connection and try again.'
      };
    }
    var data = null;
    var parseFailed = false;
    try {
      var text = await res.text();
      if (text) data = JSON.parse(text);
    } catch (err) {
      parseFailed = true;
      try { console.error('[api] Non-JSON response from', path, 'status', res.status, err); } catch (_) {}
    }
    if (!res.ok) {
      var msg = (data && (data.error || data.message))
        || (parseFailed
          ? 'Server error (' + res.status + '). Please try again in a moment.'
          : 'Request failed (' + res.status + ').');
      return { ok: false, status: res.status, data: data, error: msg };
    }
    if (parseFailed) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'The server returned an unexpected response. Please try again in a moment.'
      };
    }
    return { ok: true, status: res.status, data: data, error: null };
  }

  if (typeof window !== 'undefined') {
    window.apiClient = { apiFetch: apiFetch, safeRequest: safeRequest, getToken: getToken };
    window.safeRequest = safeRequest;
    window.apiFetch = apiFetch;
  }
})();
