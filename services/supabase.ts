import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL = (import.meta as any).env?.VITE_SUPABASE_URL || (window as any).__SUPABASE_URL__ || '';
const KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (window as any).__SUPABASE_ANON_KEY__ || '';

export const supabase: SupabaseClient | null = (URL && KEY) ? createClient(URL, KEY) : null;

export async function getAppState() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('app_state').select('data').eq('id', 'main').maybeSingle();
    if (error) throw error;
    return data?.data ?? null;
  } catch (e) {
    console.warn('supabase getAppState failed', e);
    return null;
  }
}

export async function saveAppState(payload: any) {
  if (!supabase) return false;
  try {
    const row = { id: 'main', data: payload };
    const { error } = await supabase.from('app_state').upsert(row, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('supabase saveAppState failed', e);
    return false;
  }
}
