"use client";

import { useState } from "react";
import HeroTask from "@/components/HeroTask";
import Heatmap from "@/components/Heatmap";
import GoalChat from "@/components/GoalChat";
import { motion } from "framer-motion";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <header className="px-6 pt-12 pb-2">
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Hello, <span className="text-primary">User</span> 👋
        </h2>
        <p className="text-foreground/60 mt-1">작심삼일을 작심일년으로.</p>
      </header>

      {/* Hero Task Segment */}
      <HeroTask task="Figma 디자인을 실제 코드로 구현하기" />

      {/* Status Overview / Heatmap */}
      <section className="px-4">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">나의 성장 기록</h3>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              Level 12
            </span>
          </div>
          <Heatmap />
          <p className="text-[11px] text-foreground/40 mt-4 leading-relaxed">
            꾸준함이 최고의 재능입니다. <br />지난 14주간의 성장을 확인해보세요.
          </p>
        </div>
      </section>

      {/* Floating Action / Bot Nav Space */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="w-full bg-foreground text-background py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2"
        >
          <span>AI와 대화하며 목표 정하기</span>
        </motion.button>
      </div>

      <GoalChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
