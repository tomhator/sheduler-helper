"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Lock, Save, LogOut, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const { user, profile, updateNickname, signOut } = useAuth();
    const router = useRouter();

    const [nickname, setNickname] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (profile?.nickname) {
            setNickname(profile.nickname);
        }
    }, [profile]);

    const handleUpdateNickname = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        const { error } = await updateNickname(nickname);

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "닉네임이 성공적으로 변경되었습니다!" });
        }
        setLoading(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "비밀번호가 일치하지 않습니다." });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "비밀번호가 성공적으로 변경되었습니다!" });
            setNewPassword("");
            setConfirmPassword("");
        }
        setLoading(false);
    };

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background text-foreground pb-20">
                {/* Header */}
                <header className="px-6 pt-12 pb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/50">
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-2xl font-black tracking-tight">정보 관리</h1>
                    </div>
                    <p className="text-foreground/60 text-sm">나의 정보를 안전하게 관리하세요.</p>
                </header>

                <main className="p-6 max-w-lg mx-auto space-y-8">
                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
                                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                : "bg-red-500/10 text-red-600 border border-red-500/20"
                                }`}
                        >
                            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </motion.div>
                    )}

                    {/* Account Info */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" /> 계정 정보
                        </h2>
                        <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
                            <div>
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">이메일</label>
                                <p className="font-medium">{user?.email}</p>
                            </div>
                        </div>
                    </section>

                    {/* Nickname Form */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" /> 닉네임 변경
                        </h2>
                        <form onSubmit={handleUpdateNickname} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="새 닉네임을 입력하세요"
                                    className="w-full px-4 py-3.5 bg-muted/30 border border-border rounded-xl focus:border-primary/50 outline-none transition-all text-foreground"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || nickname === profile?.nickname}
                                className="w-full py-3.5 bg-primary btn-inverse-text rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all"
                            >
                                <Save className="w-5 h-5" />
                                <span>닉네임 저장</span>
                            </button>
                        </form>
                    </section>

                    {/* Password Form */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" /> 비밀번호 변경
                        </h2>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-3">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="새 비밀번호 (6자 이상)"
                                    minLength={6}
                                    className="w-full px-4 py-3.5 bg-muted/30 border border-border rounded-xl focus:border-primary/50 outline-none transition-all text-foreground"
                                />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="비밀번호 확인"
                                    className="w-full px-4 py-3.5 bg-muted/30 border border-border rounded-xl focus:border-primary/50 outline-none transition-all text-foreground"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !newPassword}
                                className="w-full py-3.5 bg-card border border-border rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-muted/50 transition-all disabled:opacity-50"
                            >
                                <Lock className="w-5 h-5" />
                                <span>비밀번호 변경</span>
                            </button>
                        </form>
                    </section>

                    {/* Danger Zone */}
                    <section className="pt-8 border-t border-border/50">
                        <button
                            onClick={handleSignOut}
                            className="w-full py-4 text-red-500 font-bold hover:bg-red-500/5 rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/20"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>로그아웃</span>
                        </button>
                    </section>
                </main>
            </div>
        </ProtectedRoute>
    );
}
