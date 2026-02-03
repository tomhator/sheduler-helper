"use client";

import { useGoals } from "@/hooks/useGoals";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Calendar, Medal } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CompletedGoalsPage() {
    const { goals } = useGoals();
    const completedGoals = goals.filter(g => g.progress === 100);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background text-foreground pb-20">
                {/* Header */}
                <header className="px-6 pt-12 pb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/50">
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-2xl font-black tracking-tight">명예의 전당</h1>
                    </div>
                    <p className="text-foreground/60 text-sm">당신의 땀과 노력이 만든 눈부신 성과들입니다.</p>
                </header>

                <main className="p-6 grid grid-cols-1 gap-6">
                    {completedGoals.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                                <Trophy className="w-10 h-10 text-foreground/40" />
                            </div>
                            <p className="text-foreground/50 font-medium">아직 완료된 목표가 없습니다.<br />지금 바로 도전해보세요!</p>
                            <Link href="/" className="inline-block px-6 py-3 bg-primary btn-inverse-text rounded-xl font-bold mt-4 shadow-lg shadow-primary/20">
                                목표 세우러 가기
                            </Link>
                        </div>
                    ) : (
                        completedGoals.map((goal, index) => (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group overflow-hidden rounded-2xl bg-card border border-border shadow-xl shadow-black/5 aspect-[4/5] flex flex-col"
                            >
                                {/* Decorative Background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                                <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl -mr-12 -mt-12" />

                                <div className="relative z-10 p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm">
                                            <Medal className="w-8 h-8 text-secondary" />
                                        </div>
                                        <span className="text-[10px] font-black tracking-widest uppercase text-foreground/30 border border-border/50 px-2 py-1 rounded bg-background/50 backdrop-blur-sm">
                                            No. {completedGoals.length - index}
                                        </span>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div>
                                            <h2 className="text-2xl font-black leading-tight mb-2 line-clamp-2">{goal.title}</h2>
                                            <p className="text-sm text-foreground/60 line-clamp-2">{goal.description}</p>
                                        </div>

                                        <div className="pt-4 border-t border-border/50 flex items-center gap-2 text-xs font-bold text-foreground/40">
                                            <Calendar className="w-4 h-4" />
                                            <span>{goal.endDate} 달성</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                            </motion.div>
                        ))
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
