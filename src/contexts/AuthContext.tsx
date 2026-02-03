"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { updateLastActive, scheduleNotifications, requestNotificationPermission } from "@/lib/notifications";
import { App } from '@capacitor/app';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signInWithGoogle: () => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Initial Session Check & Auth Listener (Once)
    useEffect(() => {
        let isMounted = true;

        // 세션 체크를 위한 함수
        const checkSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                if (isMounted) {
                    if (initialSession) {
                        setSession(initialSession);
                        setUser(initialSession.user);
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.error("[Auth] Session check failed:", error);
                if (isMounted) setLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log(`[Auth] Event: ${_event}`, session?.user?.email ? `(User: ${session.user.email})` : "(No User)");
            
            if (isMounted) {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                // 세션이 만료되었거나 로그아웃된 경우 처리
                if (_event === 'SIGNED_OUT' || _event === 'USER_UPDATED') {
                    if (!session) {
                        setSession(null);
                        setUser(null);
                    }
                }
                
                // 토큰 갱신 실패 등의 에러 상황 처리
                if (_event === 'TOKEN_REFRESHED') {
                    console.log("[Auth] Token refreshed successfully");
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // 2. Activity Tracking & Notifications (When user changes)
    useEffect(() => {
        if (user) {
            updateLastActive(user.id).catch(console.error);
            requestNotificationPermission().catch(console.error);
            scheduleNotifications(user.id).catch(console.error);
        }
    }, [user?.id]);

    // 3. App State Listeners (Once)
    useEffect(() => {
        const setupAppStateListener = async () => {
            const listener = await App.addListener('appStateChange', (state) => {
                // Get latest user from local closure isn't safe, but inside this effect 
                // we'll check it conditionally or use a ref. 
                // For simplicity, we just use a simpler check or move it to a ref.
            });
            return listener;
        };

        const listenerPromise = setupAppStateListener();

        return () => {
            listenerPromise.then(l => l.remove());
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { error };
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signIn,
                signUp,
                signInWithGoogle,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
