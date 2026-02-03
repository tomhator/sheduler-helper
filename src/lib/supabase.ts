import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

export const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'jaksim1year-auth-token',
            flowType: 'pkce',
        },
    }
);
