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
