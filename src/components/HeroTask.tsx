"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface HeroTaskProps {
    task?: string;
    buttonText?: string;
    isLoading?: boolean;
    onClick?: () => void;
}

export default function HeroTask({
    task = "오늘의 목표를 설정해보세요!",
    buttonText = "완료하기",
    isLoading = false,
    onClick
}: HeroTaskProps) {
    if (isLoading) {
        return (
            <div className="p-8 mx-5 mt-6 rounded-xl bg-muted/50 border border-border flex flex-col gap-4 animate-pulse">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-border" />
                    <div className="h-2 w-20 bg-border rounded" />
                </div>
                <div className="h-8 w-3/4 bg-border rounded-lg" />
                <div className="flex justify-between items-center gap-4 mt-2">
                    <div className="h-3 w-1/2 bg-border rounded" />
                    <div className="h-8 w-20 bg-border rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="p-8 mx-5 mt-6 rounded-xl bg-primary btn-inverse-text shadow-xl shadow-primary/10 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />

            <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Today's Priority</span>
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight mb-6">
                {task}
            </h1>
            <div className="flex justify-between items-center gap-4">
                <p className="text-xs opacity-50 font-medium leading-relaxed max-w-[180px]">
                    이 일만 끝내도 오늘은 성공입니다. 집중하세요!
                </p>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.02 }}
                    className="px-5 py-2.5 bg-background text-foreground rounded-lg text-xs font-black shadow-lg shadow-black/10 shrink-0"
                >
                    {buttonText}
                </motion.button>
            </div>
        </motion.div>
    );
}
