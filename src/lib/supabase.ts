import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 브라우저 환경에서 환경 변수가 없는 경우 경고 출력
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    console.error('Supabase environment variables are missing! Check your .env.local file.');
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
            // 명시적 storage 지정은 유지하되 안정적인 클라이언트 측 localStorage를 활용
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
    }
);
