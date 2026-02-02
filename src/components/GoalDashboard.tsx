"use client";

import { Goal } from "../types/goals";
import { motion } from "framer-motion";
import { Trash2, Calendar, CheckCircle2, Circle } from "lucide-react";

interface DashboardProps {
    goals: Goal[];
    isLoading?: boolean;
    onDelete: (id: string) => void;
    onClick: (goal: Goal) => void;
}

export default function GoalDashboard({ goals, isLoading, onDelete, onClick }: DashboardProps) {
    if (isLoading) {
        return (
            <div className="mt-12 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-7 w-32 bg-muted rounded-lg animate-pulse" />
                    <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-5">
                            <div className="space-y-2">
                                <div className="h-6 w-2/3 bg-muted rounded-md animate-pulse" />
                                <div className="h-3 w-1/3 bg-muted rounded-md animate-pulse" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-2 w-full bg-muted rounded-full animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-3 w-3/4 bg-muted rounded-md animate-pulse" />
                                    <div className="h-3 w-1/2 bg-muted rounded-md animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (goals.length === 0) {
        return (
            <div className="mt-8 text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
                <p className="text-foreground/40 font-bold">아직 등록된 목표가 없습니다.<br />새로운 목표를 만들어보세요!</p>
            </div>
        );
    }

    return (
        <div className="mt-12 space-y-6 mb-24">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-foreground">내 목표 보드</h2>
                <span className="text-xs font-bold text-foreground/40 bg-muted px-3 py-1 rounded-full">
                    {goals.length} Active
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {goals.map((goal) => (
                    <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => onClick(goal)}
                        className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-lg leading-tight mb-1">{goal.title}</h3>
                                <p className="text-xs text-foreground/40 font-medium line-clamp-1">{goal.description}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm("정말 이 목표를 삭제하시겠습니까? 데이터가 영구적으로 삭제됩니다.")) {
                                        onDelete(goal.id);
                                    }
                                }}
                                className="p-3 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-xl -mr-2 -mt-2 sm:opacity-0 group-hover:opacity-100 touch-manipulation"
                                aria-label="삭제"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Progress Bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-foreground/50">
                                    <span>진척도</span>
                                    <span>{goal.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-secondary transition-all duration-500"
                                        style={{ width: `${goal.progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Milestone Preview */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Next Milestones</p>
                                <div className="space-y-1">
                                    {goal.milestones.slice(0, 2).map(m => (
                                        <div key={m.id} className="flex items-center gap-2 text-xs">
                                            {m.isCompleted ?
                                                <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" /> :
                                                <Circle className="w-3.5 h-3.5 text-foreground/20 shrink-0" />
                                            }
                                            <span className={m.isCompleted ? "text-foreground/40 line-through" : "text-foreground/70"}>
                                                {m.title}
                                            </span>
                                            <span className="ml-auto text-[10px] text-foreground/30">{m.date}</span>
                                        </div>
                                    ))}
                                    {goal.milestones.length > 2 && (
                                        <p className="text-[10px] text-foreground/30 pl-5.5">+ {goal.milestones.length - 2} more steps</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-border/50 text-xs text-foreground/40 font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{goal.startDate} ~ {goal.endDate}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
