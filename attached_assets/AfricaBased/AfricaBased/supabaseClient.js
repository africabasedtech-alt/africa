// js/supabaseClient.js
// This file initializes the Supabase client and attaches it to window.supabase for global access.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// New Supabase project settings (provided)
const FALLBACK_SUPABASE_URL = 'https://dcbxjekrwgblxpyfhyat.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjYnhqZWtyd2dibHhweWZoeWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDk5MjYsImV4cCI6MjA4MTYyNTkyNn0.5Y-REVsT3EzVtiHN6Sjfy8rIts4HRzOK82tHGBu1yyg';

// Prefer environment / injected config in deployment. Fall back to embedded values only as last resort.
const SUPABASE_URL =
	(typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
	(typeof window !== 'undefined' && window.__ENV?.SUPABASE_URL) ||
	FALLBACK_SUPABASE_URL;

const SUPABASE_ANON_KEY =
	(typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
	(typeof window !== 'undefined' && window.__ENV?.SUPABASE_ANON_KEY) ||
	FALLBACK_SUPABASE_ANON_KEY;

// Small helpers to detect obvious misconfiguration
function isValidUrl(url) {
	try {
		const u = new URL(url);
		return u.protocol === 'https:' || u.protocol === 'http:';
	} catch {
		return false;
	}
}

function usingFallbackCredentials() {
	return SUPABASE_URL === FALLBACK_SUPABASE_URL || SUPABASE_ANON_KEY === FALLBACK_SUPABASE_ANON_KEY;
}

if (!isValidUrl(SUPABASE_URL)) {
	/* eslint-disable no-console */
	console.warn('Supabase URL does not appear valid:', SUPABASE_URL);
	/* eslint-enable no-console */
}

// Warn at startup if the file is still using embedded credentials.
// This is intentional in many dev scenarios, but risky for production deployments.
if (usingFallbackCredentials()) {
	/* eslint-disable no-console */
	console.warn(
		'Using embedded Supabase credentials from source. For production deployments, move these values to environment variables or an injected runtime config and call initSupabaseClient at startup to avoid committing keys to source.'
	);
	/* eslint-enable no-console */
}

// Initialize client immediately so existing imports (import { supabase } ...) continue to work.
let supabase = null;
let internalSupabase = null;

// Decide whether it's safe to auto-initialize.
// - Only auto-init in the browser (window available).
// - Do NOT auto-init in production when using embedded fallback credentials to avoid leaking keys in bundles.
const isBrowser = typeof window !== 'undefined';
const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
const safeToAutoInit = isBrowser && !(isProduction && usingFallbackCredentials());

function isSupabaseInitialized() {
		return !!internalSupabase;
}

try {
	if (safeToAutoInit) {
		// attempt default initialization; protect against runtime errors (SSR/bundlers)
		supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
		if (isBrowser) window.supabase = supabase;
		internalSupabase = supabase;
	} else {
		/* eslint-disable no-console */
		console.info(
			'Supabase client auto-initialization skipped. Call initSupabaseClient(url, anonKey) at runtime to initialize the client.'
		);
		/* eslint-enable no-console */
	}
} catch (err) {
	// don't throw during module import — surface the issue to console for debugging
	// consumers can call initSupabaseClient(...) at runtime to recover
	/* eslint-disable no-console */
	console.error('Supabase default initialization failed:', err);
	/* eslint-enable no-console */
}

/**
 * Initialize the Supabase client at runtime with provided credentials.
 * Calling this after the default initialization will be a no-op unless force=true.
 */
export function initSupabaseClient(url, anonKey, options = {}) {
	const { force = false } = options || {};
	if (!url || !anonKey) throw new Error('url and anonKey required');
	if (internalSupabase && !force) return internalSupabase;
	try {
		internalSupabase = createClient(url, anonKey);
		if (typeof window !== 'undefined') window.supabase = internalSupabase;
		// keep named default-export compatibility: update supabase reference too
		supabase = internalSupabase;
		return internalSupabase;
	} catch (err) {
		/* eslint-disable no-console */
		console.error('Failed to initialize Supabase client at runtime:', err);
		/* eslint-enable no-console */
		throw err;
	}
}

/**
 * Return the initialized Supabase client.
 */
export function getSupabaseClient() {
		if (!internalSupabase) throw new Error('Supabase client not initialized. Call initSupabaseClient first.');
		return internalSupabase;
}

// Named export for compatibility with existing modules that import { supabase }
export { supabase, isSupabaseInitialized };
export default supabase;

/**
 * Validate a remember-me token stored in a cookie or elsewhere.
 * Returns the remembered_logins row if valid and not expired, otherwise null.
 */
export async function validateRememberToken(token) {
	if (!internalSupabase) throw new Error('Supabase client not initialized.');
	if (!token) return null;
	const { data, error } = await internalSupabase
		.from('remembered_logins')
		.select('*')
		.eq('token', token)
		.limit(1)
		.maybeSingle();
	if (error) {
		console.warn('validateRememberToken error', error);
		return null;
	}
	if (!data) return null;
	const expiresAt = new Date(data.expires_at).getTime();
	if (Date.now() > expiresAt) return null;
	return data;
}

/**
 * Optional maintenance: remove expired remember tokens
 */
export async function clearExpiredRememberedLogins() {
	if (!internalSupabase) throw new Error('Supabase client not initialized.');
	const { data, error } = await internalSupabase
		.from('remembered_logins')
		.delete()
		.lt('expires_at', new Date().toISOString());
	if (error) console.warn('clearExpiredRememberedLogins error', error);
	return { data, error };
}

/** Read remember_token cookie value (if any) */
export function getRememberTokenFromCookie(){
	if (typeof document === 'undefined') return null;
	const m = document.cookie.match(/(?:^|; )remember_token=([^;]+)/);
	return m ? decodeURIComponent(m[1]) : null;
}
