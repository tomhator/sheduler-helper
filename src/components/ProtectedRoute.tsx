"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // loading이 false가 되고 나서도 user가 진짜 없는지 한 번 더 확인하는 방어 로직
        const checkAuth = async () => {
            if (!loading && !user) {
                // 모바일 환경에서 찰나의 순간에 튕기는 것을 방지하기 위한 아주 짧은 유예 시간
                await new Promise(resolve => setTimeout(resolve, 300));

                // 다시 한번 체크 후 여전히 없으면 그때 리다이렉트
                if (!user) {
                    console.log("[ProtectedRoute] No user found after grace period, redirecting to login.");
                    router.push("/login");
                }
            }
        };

        checkAuth();
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
