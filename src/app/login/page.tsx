"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Sparkles, LogIn } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { signIn, signUp, signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { error } = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password);

            if (error) {
                setError(error.message);
            } else {
                if (isSignUp) {
                    setError("회원가입이 완료되었습니다! 이메일을 확인해주세요.");
                } else {
                    router.push("/");
                }
            }
        } catch (err: any) {
            setError(err.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);

        try {
            const { error } = await signInWithGoogle();
            if (error) {
                setError(error.message);
                setLoading(false);
            }
            // Google OAuth will redirect, so we don't set loading to false
        } catch (err: any) {
            setError(err.message || "Google 로그인 중 오류가 발생했습니다.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/20"
                    >
                        <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-foreground mb-2">작심일년</h1>
                    <p className="text-foreground/60 text-sm">작심삼일을 작심일년으로</p>
                </div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-2xl shadow-2xl p-8"
                >
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setIsSignUp(false)}
                            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${!isSignUp
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-muted/50 text-foreground/50 hover:text-foreground"
                                }`}
                        >
                            로그인
                        </button>
                        <button
                            onClick={() => setIsSignUp(true)}
                            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${isSignUp
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-muted/50 text-foreground/50 hover:text-foreground"
                                }`}
                        >
                            회원가입
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/70">이메일</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-muted/30 border border-border rounded-xl focus:border-primary/50 outline-none transition-all text-foreground placeholder:text-foreground/40"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/70">비밀번호</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-3.5 bg-muted/30 border border-border rounded-xl focus:border-primary/50 outline-none transition-all text-foreground placeholder:text-foreground/40"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 rounded-lg text-sm font-medium ${error.includes("완료")
                                        ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                        : "bg-red-500/10 text-red-600 border border-red-500/20"
                                    }`}
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    {isSignUp ? "회원가입" : "로그인"}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-card text-foreground/50 font-medium">또는</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full py-3.5 bg-white border-2 border-border rounded-xl font-bold hover:bg-muted/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-3 text-foreground"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Google로 계속하기
                    </button>
                </motion.div>

                <p className="text-center text-xs text-foreground/40 mt-6">
                    계정을 생성하면 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.
                </p>
            </motion.div>
        </div>
    );
}
