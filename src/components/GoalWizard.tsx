"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Calendar, Target, GripVertical } from "lucide-react";
import { GoalData, Milestone } from "../types/goals";

interface WizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goalData: any) => void;
}

export default function GoalWizard({ isOpen, onClose, onSave }: WizardProps) {
    const [step, setStep] = useState(1);
    const [goalData, setGoalData] = useState<{
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        milestones: {
            id: string;
            title: string;
            date: string;
            checklists: string[];
        }[];
    }>({
        title: "",
        description: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        milestones: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
    const [showResumeDialog, setShowResumeDialog] = useState(false);

    // Load Draft on Open
    useEffect(() => {
        if (isOpen) {
            const savedDraft = localStorage.getItem("goal_wizard_draft");
            if (savedDraft) {
                setShowResumeDialog(true);
            }
        }
    }, [isOpen]);

    // Save Draft on Change
    useEffect(() => {
        if (isOpen && !showResumeDialog && step > 0) { // Don't save if dialog is open
            const timeout = setTimeout(() => {
                localStorage.setItem("goal_wizard_draft", JSON.stringify({ step, goalData }));
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [goalData, step, isOpen, showResumeDialog]);

    const handleResume = () => {
        const savedDraft = localStorage.getItem("goal_wizard_draft");
        if (savedDraft) {
            const { step: savedStep, goalData: savedData } = JSON.parse(savedDraft);
            setStep(savedStep);
            setGoalData(savedData);
        }
        setShowResumeDialog(false);
    };

    const handleStartNew = () => {
        localStorage.removeItem("goal_wizard_draft");
        resetState();
        setShowResumeDialog(false);
    };

    const resetState = () => {
        setStep(1);
        setGoalData({
            title: "",
            description: "",
            startDate: "",
            endDate: "",
            milestones: [],
        });
    };

    const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
    const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

    const handleComplete = () => {
        const today = new Date().toISOString().split('T')[0];
        const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

        const finalGoal = {
            ...goalData,
            startDate: goalData.startDate || today,
            endDate: goalData.endDate || nextYear,
            milestones: goalData.milestones.map(m => ({
                ...m,
                date: m.date || today, // Default milestones date to today if empty
                isCompleted: false,
                checklists: m.checklists.map((text, idx) => ({
                    id: Date.now() + "-" + idx,
                    text: text || "내용 없음", // Default text if empty
                    isCompleted: false
                }))
            }))
        };
        onSave(finalGoal);
        localStorage.removeItem("goal_wizard_draft");
        resetState();
        onClose();
    };

    const getApiUrl = (path: string) => {
        let baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // If we are in a browser and no baseUrl is provided, use relative path
        if (typeof window !== 'undefined' && !baseUrl) {
            console.log(`[Frontend] Using relative path for API: ${path}`);
            return path;
        }

        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.slice(0, -1);
        }
        const finalUrl = `${baseUrl}${path}`;
        console.log(`[Frontend] Full API URL: ${finalUrl}`);
        return finalUrl;
    };

    const generateMilestones = async () => {
        if (!goalData.title.trim()) {
            alert("목표 이름을 먼저 입력해주세요!");
            return;
        }

        console.log("Generating milestones...", { title: goalData.title });
        setIsLoading(true);
        try {
            const res = await fetch(getApiUrl("/api/generate-tasks"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "milestones",
                    goalTitle: goalData.title,
                    goalDescription: goalData.description,
                    startDate: goalData.startDate,
                    endDate: goalData.endDate
                })
            });

            const text = await res.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON response:", text);
                throw new Error(`서버 응답이 올바르지 않습니다 (Status: ${res.status}). Vercel 타임아웃이거나 환경 변수 설정 문제일 수 있습니다.`);
            }

            if (!res.ok) {
                console.error("API Error:", res.status, json);
                throw new Error(json.error || json.details || `API Error: ${res.status}`);
            }

            console.log("API Response:", json);

            const { data } = json;
            if (!data || !Array.isArray(data)) {
                throw new Error("올바른 형식의 데이터를 받지 못했습니다.");
            }

            const newMilestones = data.map((m: any, idx: number) => ({
                id: Date.now().toString() + idx,
                title: m.title || "새로운 단계",
                date: m.date || new Date().toISOString().split('T')[0],
                checklists: []
            }));
            setGoalData(prev => ({ ...prev, milestones: newMilestones }));
        } catch (e: any) {
            console.error("Critical error in generateMilestones:", e);
            alert(`AI 추천을 가져오는데 실패했습니다: ${e.message}\n${e.details || ''}`);
        } finally {
            setIsLoading(false);
        }
    };

    const generateChecklist = async (milestoneId: string, milestoneTitle: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(getApiUrl("/api/generate-tasks"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "checklist",
                    goalTitle: goalData.title,
                    milestoneTitle: milestoneTitle
                })
            });

            const text = await res.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON response (Checklist):", text);
                throw new Error(`체크리스트 서버 응답이 올바르지 않습니다 (Status: ${res.status}).`);
            }

            if (!res.ok) {
                console.error("API Error (Checklist):", res.status, json);
                throw new Error(json.error || json.details || `API Error: ${res.status}`);
            }

            const { data } = json;

            if (!data || !Array.isArray(data)) {
                throw new Error("올바른 형식의 체크리스트를 받지 못했습니다.");
            }

            setGoalData(prev => ({
                ...prev,
                milestones: prev.milestones.map(m =>
                    m.id === milestoneId ? { ...m, checklists: [...m.checklists, ...data] } : m
                )
            }));
            setExpandedMilestone(milestoneId);
        } catch (e: any) {
            console.error(e);
            alert(`체크리스트 추천에 실패했습니다: ${e.message}\n${e.details || ''}`);
        } finally {
            setIsLoading(false);
        }
    };

    const addMilestone = () => {
        setGoalData(prev => ({
            ...prev,
            milestones: [...prev.milestones, {
                id: Date.now().toString(),
                title: "새로운 단계",
                date: "",
                checklists: []
            }]
        }));
    };

    const removeMilestone = (id: string) => {
        setGoalData(prev => ({
            ...prev,
            milestones: prev.milestones.filter(m => m.id !== id)
        }));
    };

    const updateMilestone = (id: string, field: string, value: string) => {
        setGoalData(prev => ({
            ...prev,
            milestones: prev.milestones.map(m =>
                m.id === id ? { ...m, [field]: value } : m
            )
        }));
    };

    const addChecklist = (milestoneId: string) => {
        setGoalData(prev => ({
            ...prev,
            milestones: prev.milestones.map(m =>
                m.id === milestoneId ? { ...m, checklists: [...m.checklists, ""] } : m
            )
        }));
    };

    const updateChecklist = (milestoneId: string, index: number, value: string) => {
        setGoalData(prev => ({
            ...prev,
            milestones: prev.milestones.map(m =>
                m.id === milestoneId ? {
                    ...m,
                    checklists: m.checklists.map((c, i) => i === index ? value : c)
                } : m
            )
        }));
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                    {/* Resume Dialog */}
                    {showResumeDialog && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-card p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-border mx-4"
                            >
                                <h3 className="text-xl font-bold mb-2">작성하던 목표가 있습니다</h3>
                                <p className="text-foreground/60 mb-6 text-sm">이전에 작성하던 내용을 이어서 작성하시겠습니까?</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleStartNew}
                                        className="flex-1 py-3 bg-muted text-foreground/70 font-bold rounded-xl hover:bg-muted/80 transition-colors"
                                    >
                                        새로 만들기
                                    </button>
                                    <button
                                        onClick={handleResume}
                                        className="flex-1 py-3 bg-primary btn-inverse-text font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
                                    >
                                        이어쓰기
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card z-10">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((s) => (
                                        <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
                                    ))}
                                </div>
                                <span className="text-sm font-bold text-foreground/60 ml-2">
                                    Step {step} of 3
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-xl transition-colors text-foreground/50 hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 relative">
                            <AnimatePresence mode="wait" custom={step}>
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        custom={step}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-black text-primary">목표 설정하기</h2>
                                            <p className="text-foreground/60">이루고 싶은 목표의 기본 정보를 입력해주세요.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-foreground/70">목표 이름</label>
                                                <input
                                                    value={goalData.title}
                                                    onChange={(e) => setGoalData({ ...goalData, title: e.target.value })}
                                                    placeholder="예: 3개월 안에 풀스택 개발자 되기"
                                                    className="w-full p-4 bg-muted/30 border border-border rounded-xl focus:border-primary/50 outline-none transition-all font-medium text-lg text-foreground placeholder:text-foreground/40"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-foreground/70">상세 설명</label>
                                                <textarea
                                                    value={goalData.description}
                                                    onChange={(e) => setGoalData({ ...goalData, description: e.target.value })}
                                                    placeholder="어떤 동기로 시작하게 되었나요? 구체적으로 적을수록 좋아요."
                                                    className="w-full p-4 h-32 bg-muted/30 border border-border rounded-xl focus:border-primary/50 outline-none transition-all resize-none text-foreground placeholder:text-foreground/40"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-foreground/70">시작일</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                                        <input
                                                            type="date"
                                                            value={goalData.startDate}
                                                            onChange={(e) => setGoalData({ ...goalData, startDate: e.target.value })}
                                                            className="w-full p-4 pl-10 bg-muted/30 border border-border rounded-xl focus:border-primary/50 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-foreground/70">종료일</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                                        <input
                                                            type="date"
                                                            value={goalData.endDate}
                                                            onChange={(e) => setGoalData({ ...goalData, endDate: e.target.value })}
                                                            className="w-full p-4 pl-10 bg-muted/30 border border-border rounded-xl focus:border-primary/50 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        custom={step}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="space-y-6"
                                    >
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                                            <div className="space-y-2">
                                                <h2 className="text-2xl font-black text-primary">단계 나누기</h2>
                                                <p className="text-foreground/60">목표를 달성하기 위한 중간 단계(Milestone)를 설정합니다.</p>
                                            </div>
                                            <div className="flex gap-2 self-start md:self-auto">
                                                <button
                                                    onClick={addMilestone}
                                                    className="px-4 py-2 bg-muted text-foreground/70 rounded-xl text-sm font-bold hover:bg-muted/80 transition-colors shrink-0 whitespace-nowrap"
                                                >
                                                    + 직접 추가
                                                </button>
                                                <button
                                                    onClick={generateMilestones}
                                                    disabled={isLoading}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    {isLoading ? "생성 중..." : "AI 추천받기"}
                                                </button>
                                            </div>
                                        </div>

                                        <Reorder.Group
                                            axis="y"
                                            values={goalData.milestones}
                                            onReorder={(newOrder) => setGoalData({ ...goalData, milestones: newOrder })}
                                            className="space-y-4"
                                        >
                                            {goalData.milestones.length === 0 ? (
                                                <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl text-foreground/40">
                                                    <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    <p>아직 설정된 단계가 없습니다.<br />직접 추가하거나 AI의 추천을 받아보세요.</p>
                                                </div>
                                            ) : (
                                                goalData.milestones.map((milestone, idx) => (
                                                    <Reorder.Item
                                                        key={milestone.id}
                                                        value={milestone}
                                                        className="p-4 bg-muted/30 border border-border rounded-xl flex items-start gap-4"
                                                    >
                                                        <div className="flex items-center self-stretch pr-2 cursor-grab active:cursor-grabbing text-foreground/20 hover:text-foreground/40 transition-colors">
                                                            <GripVertical className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex gap-4 flex-1">
                                                            <div className="flex flex-col gap-2 pt-2">
                                                                <div className="w-6 h-6 bg-primary btn-inverse-text rounded-lg flex items-center justify-center text-xs font-bold">
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="w-0.5 h-full bg-border mx-auto" />
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <textarea
                                                                    value={milestone.title}
                                                                    onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                                                                    className="w-full bg-transparent font-bold text-lg outline-none placeholder:text-foreground/30 resize-none break-words"
                                                                    placeholder="단계 이름 (예: 자료 조사)"
                                                                    rows={1}
                                                                    onInput={(e) => {
                                                                        const target = e.target as HTMLTextAreaElement;
                                                                        target.style.height = 'auto';
                                                                        target.style.height = target.scrollHeight + 'px';
                                                                    }}
                                                                />
                                                                <input
                                                                    type="date"
                                                                    value={milestone.date}
                                                                    onChange={(e) => updateMilestone(milestone.id, 'date', e.target.value)}
                                                                    className="text-sm text-foreground/60 bg-transparent outline-none"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => removeMilestone(milestone.id)}
                                                                className="text-foreground/30 hover:text-red-500 transition-colors self-start"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </Reorder.Item>
                                                ))
                                            )}
                                        </Reorder.Group>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        custom={step}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-black text-primary">체크리스트</h2>
                                            <p className="text-foreground/60">각 단계별로 실행할 구체적인 행동을 정의합니다.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {goalData.milestones.map((milestone, idx) => (
                                                <div key={milestone.id} className="p-6 bg-muted/30 rounded-xl border border-border overflow-hidden">
                                                    <div
                                                        onClick={() => setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}
                                                        className="flex items-center gap-3 cursor-pointer group"
                                                    >
                                                        <div className="bg-primary btn-inverse-text w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold">
                                                            {idx + 1}
                                                        </div>
                                                        <h3 className="font-bold flex-1">{milestone.title}</h3>
                                                        <ChevronRight className={`w-4 h-4 text-foreground/40 transition-transform ${expandedMilestone === milestone.id ? 'rotate-90' : ''}`} />
                                                    </div>

                                                    <AnimatePresence>
                                                        {expandedMilestone === milestone.id && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="pl-9 pt-4 space-y-3">
                                                                    {milestone.checklists.map((item, cIdx) => (
                                                                        <div key={cIdx} className="flex items-center gap-2">
                                                                            <div className="w-4 h-4 rounded border-2 border-border" />
                                                                            <input
                                                                                value={item}
                                                                                onChange={(e) => updateChecklist(milestone.id, cIdx, e.target.value)}
                                                                                className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-border transition-colors"
                                                                                placeholder="할 일 입력..."
                                                                            />
                                                                        </div>
                                                                    ))}

                                                                    <div className="flex gap-3 mt-4">
                                                                        <button
                                                                            onClick={() => addChecklist(milestone.id)}
                                                                            className="text-xs font-bold text-foreground/50 hover:text-foreground transition-colors"
                                                                        >
                                                                            + 할 일 추가
                                                                        </button>
                                                                        <button
                                                                            onClick={() => generateChecklist(milestone.id, milestone.title)}
                                                                            disabled={isLoading}
                                                                            className="flex items-center gap-1 text-xs text-primary font-bold hover:opacity-70 transition-opacity disabled:opacity-50"
                                                                        >
                                                                            <Sparkles className="w-3 h-3" />
                                                                            {isLoading ? "추천 중..." : "AI로 할 일 추천받기"}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border bg-card z-10 flex justify-between">
                            {step > 1 ? (
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-3 rounded-xl font-bold text-foreground/60 hover:bg-muted transition-colors flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    이전
                                </button>
                            ) : (
                                <div />
                            )}

                            <button
                                onClick={step === 3 ? handleComplete : handleNext}
                                className="px-8 py-3 bg-primary btn-inverse-text rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {step === 3 ? '완료하기' : '다음'}
                                {step < 3 && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
