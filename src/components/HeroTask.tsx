"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface HeroTaskProps {
    task?: string;
}

export default function HeroTask({ task = "오늘의 목표를 설정해보세요!" }: HeroTaskProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 mx-4 mt-8 rounded-3xl bg-primary/10 border border-primary/20 backdrop-blur-sm shadow-sm"
        >
            <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-primary fill-primary/20" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Most Important Thing</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
                {task}
            </h1>
            <div className="mt-4 flex justify-between items-end">
                <p className="text-sm text-foreground/60">
                    이 일만 끝내도 오늘은 성공입니다.
                </p>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/30"
                >
                    완료하기
                </motion.button>
            </div>
        </motion.div>
    );
}
