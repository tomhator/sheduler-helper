"use client";

import { useState, useMemo } from "react";
import HeroTask from "@/components/HeroTask";
import GoalWizard from "@/components/GoalWizard";
import GoalDashboard from "@/components/GoalDashboard";
import GoalDetailModal from "@/components/GoalDetailModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useGoals } from "@/hooks/useGoals";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Goal } from "@/types/goals";
import Link from "next/link";
import { Trophy, LogOut, User, Menu, X, ChevronRight, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { migrateLocalStorageToSupabase } from "@/lib/migration";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const { goals, addGoal, deleteGoal, toggleCheckItem, updateGoal, isLoading } = useGoals();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      migrateLocalStorageToSupabase(user.id);
    }
  }, [user]);

  const activeGoals = useMemo(() => goals.filter(g => g.progress < 100), [goals]);
  const activeGoalData = useMemo(() => {
    return goals.find(g => g.id === selectedGoal?.id) || null;
  }, [goals, selectedGoal]);

  const currentPriority = useMemo(() => {
    if (activeGoals.length === 0) return "새로운 목표를 설정해보세요!";
    const activeGoal = activeGoals[0];
    const activeMilestone = activeGoal.milestones.find(m => !m.isCompleted);
    return activeMilestone ? `${activeGoal.title} - ${activeMilestone.title}` : activeGoal.title;
  }, [activeGoals]);

  const displayName = profile?.nickname || user?.email?.split('@')[0] || '친구';

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 h-full pb-32">
        {/* Header */}
        <header className="px-6 pt-12 pb-2 flex justify-between items-start relative z-50">
          <div className="space-y-1">
            <h2 className="text-[26px] font-black tracking-tight text-foreground leading-[1.2]">
              천천히 하나씩<br />
              이뤄내봐요, <span className="text-primary">{displayName}님!</span> ✨
            </h2>
            <p className="text-foreground/40 text-[13px] font-medium tracking-tight">작심삼일을 작심일년으로.</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Loading Indicator */}
            <div className="w-5 h-5 flex items-center justify-center relative">
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.5, scale: 1, rotate: 360 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                      opacity: { duration: 0.2 }
                    }}
                    className="absolute w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-3 rounded-2xl transition-all duration-300 ${isMenuOpen ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted/50 text-foreground/60 hover:bg-muted hover:text-foreground'
                  }`}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    {/* Backdrop to close menu */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsMenuOpen(false)}
                      className="fixed inset-0 z-[-1]"
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
                      className="absolute right-0 mt-3 w-56 bg-card border border-border rounded-[24px] shadow-2xl overflow-hidden py-2 z-50 origin-top-right"
                    >
                      <Link
                        href="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">내 정보</p>
                          <p className="text-[10px] text-foreground/40 font-medium tracking-tight">계정 및 프로필 설정</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground/20" />
                      </Link>

                      <Link
                        href="/completed"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">명예의 전당</p>
                          <p className="text-[10px] text-foreground/40 font-medium tracking-tight">완료된 목표들</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground/20" />
                      </Link>

                      <div className="px-2 pt-2 mt-2 border-t border-border/50">
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-500/5 transition-colors group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <LogOut className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-bold">로그아웃</p>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Hero Task Segment */}
        <HeroTask
          task={currentPriority}
          isLoading={isLoading}
          buttonText={activeGoals.length === 0 ? "새 목표 추가" : "자세히 보기"}
          onClick={() => {
            if (activeGoals.length === 0) {
              setIsChatOpen(true);
            } else {
              const activeGoal = activeGoals[0];
              if (activeGoal) setSelectedGoal(activeGoal);
            }
          }}
        />

        {/* Goal Dashboard */}
        <section className="px-5">
          <GoalDashboard goals={activeGoals} isLoading={isLoading} onDelete={deleteGoal} onClick={setSelectedGoal} />
        </section>

        {/* Floating Action / Bot Nav Space */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-40">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -2 }}
            onClick={() => setIsChatOpen(true)}
            className="w-full bg-primary btn-inverse-text py-4.5 rounded-xl font-bold shadow-lg shadow-black/5 flex items-center justify-center gap-2 border border-white/10"
          >
            <span>AI와 함께 목표 설정하기</span>
          </motion.button>
        </div>

        <GoalWizard
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onSave={addGoal}
        />

        <GoalDetailModal
          goal={activeGoalData}
          onClose={() => setSelectedGoal(null)}
          onToggleCheck={toggleCheckItem}
          onUpdate={updateGoal}
        />
      </div>
    </ProtectedRoute>
  );
}
