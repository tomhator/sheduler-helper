"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthDebugPage() {
    const [debugInfo, setDebugInfo] = useState<any>({});

    useEffect(() => {
        const checkAuth = async () => {
            // 1. Check session
            const { data: { session }, error } = await supabase.auth.getSession();

            // 2. Check cookies
            const cookies = document.cookie.split(';').map(c => c.trim());

            // 3. Check localStorage
            const localStorageKeys = Object.keys(localStorage);
            const supabaseKeys = localStorageKeys.filter(k => k.includes('supabase') || k.includes('sb-'));

            setDebugInfo({
                session: session ? {
                    user: session.user.email,
                    expiresAt: session.expires_at,
                    accessToken: session.access_token?.substring(0, 20) + '...'
                } : null,
                error: error?.message,
                cookies: cookies,
                supabaseCookies: cookies.filter(c => c.includes('sb-')),
                localStorage: supabaseKeys.map(k => ({
                    key: k,
                    value: localStorage.getItem(k)?.substring(0, 50) + '...'
                })),
                envVars: {
                    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                }
            });
        };

        checkAuth();
    }, []);

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">🔍 Auth Debug Info</h1>

                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-xl font-bold mb-2">Session Status</h2>
                        <pre className="bg-muted p-4 rounded overflow-auto text-xs">
                            {JSON.stringify(debugInfo.session, null, 2)}
                        </pre>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-xl font-bold mb-2">All Cookies ({debugInfo.cookies?.length || 0})</h2>
                        <pre className="bg-muted p-4 rounded overflow-auto text-xs">
                            {JSON.stringify(debugInfo.cookies, null, 2)}
                        </pre>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-xl font-bold mb-2">Supabase Cookies ({debugInfo.supabaseCookies?.length || 0})</h2>
                        <pre className="bg-muted p-4 rounded overflow-auto text-xs">
                            {JSON.stringify(debugInfo.supabaseCookies, null, 2)}
                        </pre>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-xl font-bold mb-2">LocalStorage</h2>
                        <pre className="bg-muted p-4 rounded overflow-auto text-xs">
                            {JSON.stringify(debugInfo.localStorage, null, 2)}
                        </pre>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-xl font-bold mb-2">Environment</h2>
                        <pre className="bg-muted p-4 rounded overflow-auto text-xs">
                            {JSON.stringify(debugInfo.envVars, null, 2)}
                        </pre>
                    </div>

                    {debugInfo.error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <h2 className="text-xl font-bold mb-2 text-red-600">Error</h2>
                            <p className="text-red-600">{debugInfo.error}</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h3 className="font-bold mb-2">📋 Instructions</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>로그인한 상태에서 이 페이지를 새로고침하세요</li>
                        <li>Session Status가 null이면 세션이 유실된 것입니다</li>
                        <li>Supabase Cookies가 비어있으면 쿠키가 저장되지 않은 것입니다</li>
                        <li>이 정보를 스크린샷으로 공유해주세요</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
