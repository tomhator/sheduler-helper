import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only throw error during runtime, but allow build to proceed if variables are missing
// (Next.js will attempt to prerender pages which might import this file)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn('Supabase environment variables are missing');
}

if (typeof window !== 'undefined') {
    console.log(`[Supabase] Connecting to: ${supabaseUrl?.substring(0, 20)}...`);
}

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'jaksim1year-auth-token',
        },
    }
);
