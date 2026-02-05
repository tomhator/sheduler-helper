"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { updateLastActive, scheduleNotifications, requestNotificationPermission } from "@/lib/notifications";
import { App } from '@capacitor/app';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: { nickname: string | null } | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string, nickname?: string) => Promise<{ error: any }>;
    signInWithGoogle: () => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateNickname: (nickname: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<{ nickname: string | null } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('nickname')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setProfile(data);
            } else {
                setProfile({ nickname: null });
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setProfile({ nickname: null });
        }
    };

    // 1. Initial Session Check & Auth Listener (Once)
    useEffect(() => {
        let isMounted = true;
        let sessionChecked = false;

        // 세션 체크를 위한 함수
        const checkSession = async () => {
            try {
                console.log("[Auth] Checking session from cookies...");
                // getSession()은 로컬 스토리지/쿠키에서 세션을 즉시 가져옵니다.
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("[Auth] getSession error:", error);
                }

                if (isMounted) {
                    sessionChecked = true;
                    if (initialSession) {
                        console.log("[Auth] ✅ Session found:", initialSession.user.email);
                        setSession(initialSession);
                        setUser(initialSession.user);
                        fetchProfile(initialSession.user.id);
                    } else {
                        console.log("[Auth] ❌ No session found.");
                    }
                    // 세션 체크가 완료된 후에만 loading을 false로
                    setLoading(false);
                }
            } catch (err) {
                console.error("[Auth] Initialization unexpected error:", err);
                if (isMounted) {
                    sessionChecked = true;
                    setLoading(false);
                }
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log(`[Auth] State changed: ${_event}`, session?.user?.email ? `(User: ${session.user.email})` : "(No User)");

            if (isMounted) {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }

                // 세션 체크가 이미 완료된 경우에만 loading 업데이트
                if (sessionChecked) {
                    setLoading(false);
                }

                // 다른 탭에서의 로그아웃 등을 처리
                if (_event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
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

    const signUp = async (email: string, password: string, nickname?: string) => {
        console.log("[Auth] Starting signUp for:", email, "with nickname:", nickname);

        // Use metadata to pass the nickname to the DB trigger
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nickname: nickname || null
                }
            }
        });

        if (error) {
            console.error("[Auth] signUp error:", error);
            return { error };
        }

        console.log("[Auth] signUp success. User ID:", data.user?.id);
        // Note: Profile will be created automatically by DB trigger

        return { error: null };
    };

    const signInWithGoogle = async () => {
        console.log("[Auth] Starting Google Sign-In...");
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) console.error("[Auth] Google Sign-In error:", error);
        return { error };
    };

    const signOut = async () => {
        console.log("[Auth] Signing out...");
        await supabase.auth.signOut();
        setProfile(null);
    };

    const updateNickname = async (nickname: string) => {
        if (!user) {
            console.warn("[Auth] updateNickname called without user");
            return { error: { message: "로그인이 필요합니다." } };
        }

        console.log("[Auth] Updating nickname to:", nickname, "for user:", user.id);

        // Check if profile exists first (should be created by trigger, but just in case)
        const { data: existingProfile, error: fetchError } = await (supabase as any)
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        let result;
        if (!existingProfile) {
            console.log("[Auth] Profile not found, performing upsert...");
            result = await (supabase as any)
                .from('profiles')
                .upsert({ id: user.id, nickname });
        } else {
            result = await (supabase as any)
                .from('profiles')
                .update({ nickname })
                .eq('id', user.id);
        }

        if (result.error) {
            console.error("[Auth] updateNickname error:", result.error);
            return { error: result.error };
        }

        console.log("[Auth] updateNickname success");
        setProfile(prev => prev ? { ...prev, nickname } : { nickname });

        return { error: null };
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                loading,
                signIn,
                signUp,
                signInWithGoogle,
                signOut,
                updateNickname,
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
