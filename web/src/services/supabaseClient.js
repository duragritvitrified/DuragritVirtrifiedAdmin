import { createClient } from '@supabase/supabase-js';

// =====================================================================
// DuraGrit Vitrified - Supabase Client & Full Realtime Sync Factory
// =====================================================================

const DEFAULT_SUPABASE_URL = 'https://fykxjzvdslvxablmjlfw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5a3hqenZkc2x2eGFibG1qbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NDczMTcsImV4cCI6MjEwOTAyMzMxN30.bmMUQ6vcRZorX_b2YOuvgrtfWCWYwRxxlaQTj5QhQxY';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.includes('.supabase.co') &&
    !SUPABASE_ANON_KEY.includes('YOUR_ANON') &&
    !SUPABASE_ANON_KEY.includes('placeholder')
  );
};

const supabaseUrl = SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'duragrit_supabase_auth_v3',
    storage: window.localStorage,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
  global: {
    headers: {
      'x-duragrit-client': 'ERP-Portal-v3.0',
    },
  },
});

export const subscribeToCashbackQueue = (onUpdate) => {
  return supabase
    .channel('cashback-moderation-queue')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cashback_requests' }, (payload) => onUpdate(payload))
    .subscribe();
};

export const subscribeToQRBatches = (onUpdate) => {
  return supabase
    .channel('qr-batch-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'qr_batches' }, (payload) => onUpdate(payload))
    .subscribe();
};

export const subscribeToProfileUpdates = (onUpdate) => {
  return supabase
    .channel('user-profile-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => onUpdate(payload))
    .subscribe();
};

/**
 * Unified Realtime Channel across all 6 operational tables
 */
export const subscribeToAllRealtimeTables = (onAnyChange) => {
  const channelName = `duragrit-live-sync-${Math.random().toString(36).slice(2, 8)}`;
  return supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (p) => onAnyChange('products', p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (p) => onAnyChange('profiles', p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, (p) => onAnyChange('vendors', p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'qr_batches' }, (p) => onAnyChange('qr_batches', p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'qr_tokens' }, (p) => onAnyChange('qr_tokens', p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cashback_requests' }, (p) => onAnyChange('cashback_requests', p))
    .subscribe();
};
