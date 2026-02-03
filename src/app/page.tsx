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
import { Trophy, LogOut, User } from "lucide-react";
import { useEffect } from "react";
import { migrateLocalStorageToSupabase } from "@/lib/migration";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
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
        <header className="px-6 pt-12 pb-2 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground leading-tight">
              천천히 하나씩 이뤄내봐요!<br />
              <span className="text-primary">{displayName}님!</span> ✨
            </h2>
            <p className="text-foreground/60 mt-1">작심삼일을 작심일년으로.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="p-2 bg-muted/50 rounded-full hover:bg-muted transition-colors">
              <User className="w-5 h-5 text-foreground/60" />
            </Link>
            <div className="w-4 h-4 flex items-center justify-center relative">
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
            <Link href="/completed" className="p-3 bg-muted/50 rounded-full hover:bg-muted transition-colors text-foreground/50 hover:text-secondary group">
              <Trophy className="w-6 h-6" />
            </Link>
            <button onClick={() => signOut()} className="p-3 bg-muted/50 rounded-full hover:bg-red-500/10 transition-colors text-foreground/50 hover:text-red-500 group">
              <LogOut className="w-6 h-6" />
            </button>
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
