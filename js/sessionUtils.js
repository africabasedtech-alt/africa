// sessionUtils.js — Currently using Replit database API.
// To switch back to Supabase, restore the supabaseClient.js imports.
import { getSession, getProfile, updateProfile } from './api-auth.js';

export { getSession, getProfile, updateProfile };

export async function updateSettings(settings) {
  return await updateProfile(settings);
}
