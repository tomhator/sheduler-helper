import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Helper functions for cookie management in browser
function parseCookies(): Record<string, string> {
    return document.cookie.split(';').reduce((acc, cookie) => {
        const trimmed = cookie.trim();
        const firstEquals = trimmed.indexOf('=');
        if (firstEquals > 0) {
            const key = trimmed.substring(0, firstEquals);
            const value = trimmed.substring(firstEquals + 1);
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, string>);
}

function setCookie(name: string, value: string, options: { maxAge?: number; path?: string } = {}) {
    const maxAge = options.maxAge || 60 * 60 * 24 * 365; // 1 year default
    const path = options.path || '/';
    document.cookie = `${name}=${value}; max-age=${maxAge}; path=${path}; SameSite=Lax`;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; max-age=0; path=/`;
}

export const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
            getAll() {
                const cookies = parseCookies();
                return Object.keys(cookies).map(name => ({ name, value: cookies[name] }));
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    setCookie(name, value, options);
                });
            },
        },
    }
);
