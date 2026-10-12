export const SUPABASE_CONFIG = {
  url: 'https://ufiquhjvlcqvfamdhxin.supabase.co',
  anonKey: 'sb_publishable_UJnX0-JZIlGfKMpwT2Q5_Q_tiTzL6Yd'
};

let _client = null;

export function getSupabaseClient() {
  if (!_client && typeof window !== 'undefined' && window.supabase && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    try {
      _client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    } catch (e) {
      console.warn('Supabase initialization failed:', e);
    }
  }
  return _client;
}

/**
 * Check if active authenticated Supabase session exists.
 * Returns null in local offline mode or if unauthenticated.
 */
export async function getCloudAuthSession() {
  const client = getSupabaseClient();
  if (!client || !client.auth) return null;
  try {
    const { data } = await client.auth.getSession();
    return data ? data.session : null;
  } catch (e) {
    return null;
  }
}

/**
 * Authenticate staff with Supabase for cloud sync mode under tightened RLS.
 */
export async function signInCloudStaff(email, password) {
  const client = getSupabaseClient();
  if (!client || !client.auth) return { success: false, error: 'Supabase client not available' };
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, session: data.session };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

/**
 * Sign out from cloud sync session, reverting to local-only offline mode.
 */
export async function signOutCloudStaff() {
  const client = getSupabaseClient();
  if (!client || !client.auth) return;
  try {
    await client.auth.signOut();
  } catch (e) {
    console.warn('Error signing out from Supabase:', e);
  }
}

