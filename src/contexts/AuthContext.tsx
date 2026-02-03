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

        const initAuth = async () => {
            try {
                console.log("[Auth] Checking initial session...");
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("[Auth] getSession error:", error);
                }

                if (isMounted) {
                    if (initialSession) {
                        console.log("[Auth] Initial session found for:", initialSession.user.email);
                        setSession(initialSession);
                        setUser(initialSession.user);
                    } else {
                        console.log("[Auth] No initial session found.");
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error("[Auth] Initialization unexpected error:", err);
                if (isMounted) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log(`[Auth] State changed: ${_event}`, session?.user?.email ? `(User: ${session.user.email})` : "(No User)");
            if (isMounted) {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
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
