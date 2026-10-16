/**
 * SHAMS HEALTH CARE - OPERATIONAL ACCESS CONFIGURATION
 * 
 * IMPORTANT SECURITY NOTE:
 * These credentials and PINs serve as UI OPERATIONAL PRIVACY LOCKS for single-workstation
 * clinic workflows (preventing walk-in patients or casual observers from viewing financial 
 * collections and sensitive history over the counter). They are NOT cryptographic security
 * boundaries. True data security for cloud synchronization is enforced at the database level 
 * via Supabase Row-Level Security (RLS) policies.
 */

export const STAFF_USERNAME = 'staff124';
export const STAFF_PASSWORD = 'admin124';
export const AUTH_SESSION_KEY = 'shc_auth_session';

export const INVENTORYUPDATE_PASSWORD = '9211';
export const COLLECTION_PASSWORD = 'admin1';

