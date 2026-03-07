// auth.js — Currently using Replit database API for auth.
// To switch back to Supabase, replace these exports with the supabaseClient.js versions.
export { signUp, signIn, signOut, getCurrentUser, getSession, checkAuthState,
  getProfile, updateProfile, startIdleGuard, stopIdleGuard } from './api-auth.js';

export function redirectToLogin() {
  const currentPage = window.location.pathname.split('/').pop() || '';
  if (!currentPage.includes('login.html') && !currentPage.includes('register.html')) {
    window.location.href = '/login.html';
  }
}
