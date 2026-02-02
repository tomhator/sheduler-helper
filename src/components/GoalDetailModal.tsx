"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, CheckCircle2, Circle, Trophy, Edit2, Save, Trash2, Plus } from "lucide-react";
import { Goal, Milestone, CheckItem } from "../types/goals";
import { useState, useEffect, useRef } from "react";
import { triggerCelebration } from "./Celebration";

interface GoalDetailModalProps {
    goal: Goal | null;
    onClose: () => void;
    onToggleCheck: (goalId: string, milestoneId: string, checkItemId: string) => void;
    onUpdate: (id: string, updates: Partial<Goal>) => void;
}

export default function GoalDetailModal({ goal, onClose, onToggleCheck, onUpdate }: GoalDetailModalProps) {
    const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Goal | null>(null);
    const prevProgressRef = useRef<number>(0);

    useEffect(() => {
        if (goal) {
            setEditData(goal);
            // Trigger celebration if progress hits 100% (and wasn't 100% before)
            if (goal.progress === 100 && prevProgressRef.current < 100) {
                triggerCelebration();
            }
            prevProgressRef.current = goal.progress;
        }
    }, [goal]);

    if (!goal) return null;

    const handleSave = () => {
        if (editData) {
            onUpdate(goal.id, editData);
            setIsEditing(false);
        }
    };

    const updateMilestone = (mId: string, field: string, val: string) => {
        if (!editData) return;
        setEditData({
            ...editData,
            milestones: editData.milestones.map(m => m.id === mId ? { ...m, [field]: val } : m)
        });
    };

    const addMilestone = () => {
        if (!editData) return;
        setEditData({
            ...editData,
            milestones: [...editData.milestones, {
                id: Date.now().toString(),
                title: "새 단계",
                date: "",
                isCompleted: false,
                checklists: []
            }]
        });
    };

    const deleteMilestone = (mId: string) => {
        if (!editData) return;
        setEditData({
            ...editData,
            milestones: editData.milestones.filter(m => m.id !== mId)
        });
    };

    const addCheckItem = (mId: string) => {
        if (!editData) return;
        setEditData({
            ...editData,
            milestones: editData.milestones.map(m => m.id === mId ? {
                ...m,
                checklists: [...m.checklists, { id: Date.now().toString(), text: "할 일", isCompleted: false }]
            } : m)
        });
    };

    const deleteCheckItem = (mId: string, cId: string) => {
        if (!editData) return;
        setEditData({
            ...editData,
            milestones: editData.milestones.map(m => m.id === mId ? {
                ...m,
                checklists: m.checklists.filter(c => c.id !== cId)
            } : m)
        });
    };

    const updateCheckItem = (mId: string, cId: string, text: string) => {
        if (!editData) return;
        setEditData({
            ...editData,
            milestones: editData.milestones.map(m => m.id === mId ? {
                ...m,
                checklists: m.checklists.map(c => c.id === cId ? { ...c, text } : c)
            } : m)
        });
    };

    return (
        <AnimatePresence>
            {goal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="relative h-32 bg-primary flex items-end p-6 shrink-0 transition-colors duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    className="p-2 bg-black/10 hover:bg-black/20 text-primary-foreground rounded-full transition-colors backdrop-blur-md"
                                >
                                    {isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-black/10 hover:bg-black/20 text-primary-foreground rounded-full transition-colors backdrop-blur-md"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="relative z-10 w-full">
                                {isEditing && editData ? (
                                    <input
                                        value={editData.title}
                                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                        className="w-full bg-transparent text-2xl font-black text-primary-foreground outline-none border-b border-white/20 focus:border-white mb-1"
                                    />
                                ) : (
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-primary-foreground/60 text-xs font-bold tracking-widest uppercase mb-1 block">Goal Detail</span>
                                            <h2 className="text-2xl font-black text-primary-foreground leading-tight">{goal.title}</h2>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-3xl font-black text-secondary">{goal.progress}%</span>
                                            <span className="text-[10px] text-primary-foreground/40 font-bold uppercase">Achieved</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Description & Date */}
                            <div className="space-y-4">
                                {isEditing && editData ? (
                                    <>
                                        <textarea
                                            value={editData.description}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            className="w-full p-3 bg-muted/50 rounded-lg text-foreground text-sm outline-none border border-transparent focus:border-primary resize-none h-24"
                                        />
                                        <div className="flex gap-2">
                                            <input type="date" value={editData.startDate} onChange={e => setEditData({ ...editData, startDate: e.target.value })} className="bg-muted p-2 rounded text-xs" />
                                            <input type="date" value={editData.endDate} onChange={e => setEditData({ ...editData, endDate: e.target.value })} className="bg-muted p-2 rounded text-xs" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-foreground/70 leading-relaxed">{goal.description}</p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-foreground/40 bg-muted inline-flex px-3 py-1.5 rounded-lg">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{goal.startDate} ~ {goal.endDate}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Milestones */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-accent" />
                                        Milestones
                                    </h3>
                                    {isEditing && (
                                        <button onClick={addMilestone} className="text-xs font-bold text-primary flex items-center gap-1">+ 단계 추가</button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {(isEditing && editData ? editData.milestones : goal.milestones).map((milestone, idx) => (
                                        <div key={milestone.id} className="border border-border rounded-xl overflow-hidden bg-muted/10">
                                            {/* Milestone Header */}
                                            <div
                                                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${milestone.isCompleted ? 'bg-secondary text-white' : 'bg-muted text-foreground/50'}`}>
                                                    {idx + 1}
                                                </div>

                                                <div className="flex-1 min-w-0" onClick={() => !isEditing && setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}>
                                                    {isEditing ? (
                                                        <div className="flex flex-col gap-1">
                                                            <input
                                                                value={milestone.title}
                                                                onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                                                                className="bg-transparent border-b border-transparent focus:border-primary/50 outline-none font-bold w-full"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={milestone.date}
                                                                onChange={(e) => updateMilestone(milestone.id, 'date', e.target.value)}
                                                                className="bg-transparent text-xs text-foreground/50 outline-none"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <h4 className={`font-bold truncate ${milestone.isCompleted ? 'text-foreground/50 line-through' : 'text-foreground'}`}>
                                                                {milestone.title}
                                                            </h4>
                                                            <p className="text-xs text-foreground/40">{milestone.date}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {isEditing ? (
                                                    <button onClick={() => deleteMilestone(milestone.id)} className="text-foreground/20 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <CheckCircle2 className={`w-5 h-5 ${milestone.isCompleted ? 'text-secondary' : 'text-border'}`} />
                                                )}
                                            </div>

                                            {/* Checklist Area (Always Visible in Edit, Accordion in View) */}
                                            <AnimatePresence>
                                                {(isEditing || expandedMilestone === milestone.id) && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: "auto" }}
                                                        exit={{ height: 0 }}
                                                        className="overflow-hidden bg-muted/20"
                                                    >
                                                        <div className="px-4 pb-4 pt-1 space-y-2 pl-14">
                                                            {milestone.checklists.map((item) => (
                                                                <div key={item.id} className="flex items-center gap-2 group">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-border" />
                                                                            <input
                                                                                value={item.text}
                                                                                onChange={(e) => updateCheckItem(milestone.id, item.id, e.target.value)}
                                                                                className="flex-1 bg-transparent text-sm border-b border-transparent focus:border-primary/30 outline-none py-1"
                                                                            />
                                                                            <button onClick={() => deleteCheckItem(milestone.id, item.id)} className="text-foreground/10 hover:text-red-500">
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <div
                                                                            onClick={() => onToggleCheck(goal.id, milestone.id, item.id)}
                                                                            className="flex items-start gap-3 w-full p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                                                                        >
                                                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${item.isCompleted ? 'bg-secondary border-secondary' : 'border-border group-hover:border-primary/50'}`}>
                                                                                {item.isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                                            </div>
                                                                            <span className={`text-sm ${item.isCompleted ? 'text-foreground/40 line-through' : 'text-foreground/80'}`}>
                                                                                {item.text}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {isEditing && (
                                                                <button onClick={() => addCheckItem(milestone.id)} className="text-xs text-foreground/40 hover:text-primary flex items-center gap-1 mt-2">
                                                                    <Plus className="w-3 h-3" /> 할 일 추가
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
