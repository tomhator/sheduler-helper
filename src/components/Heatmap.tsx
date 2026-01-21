"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface HeatmapProps {
    data?: { date: string; count: number }[];
}

export default function Heatmap({ data = [] }: HeatmapProps) {
    // Demo data generation for the last 14 weeks (98 days)
    const heatmapData = useMemo(() => {
        const days = 98; // 14 weeks
        const today = new Date();
        const result = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            // Random mock data for demo
            const count = Math.floor(Math.random() * 5);
            result.push({ date: date.toISOString().split('T')[0], count });
        }
        return result;
    }, []);

    const getColor = (count: number) => {
        if (count === 0) return "bg-muted/40";
        if (count === 1) return "bg-primary/20";
        if (count === 2) return "bg-primary/40";
        if (count === 3) return "bg-primary/70";
        return "bg-primary";
    };

    return (
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex flex-col gap-1.5 min-w-max">
                <div className="grid grid-flow-col grid-rows-7 gap-1.5">
                    {heatmapData.map((day, i) => (
                        <motion.div
                            key={day.date}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.005 }}
                            className={`w-3 h-3 rounded-[2px] ${getColor(day.count)} transition-colors duration-300`}
                            title={`${day.date}: ${day.count} tasks`}
                        />
                    ))}
                </div>
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-foreground/40 font-medium px-1">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/40" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/20" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/40" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/70" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-primary" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
