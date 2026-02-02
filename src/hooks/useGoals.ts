"use client";

import { useState, useEffect, useCallback } from "react";
import { Goal, Milestone } from "../types/goals";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { updateLastAction } from "@/lib/notifications";

export function useGoals() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const fetchGoals = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('goals')
                .select(`
                    id,
                    title,
                    description,
                    start_date,
                    end_date,
                    progress,
                    is_completed,
                    image_url,
                    created_at,
                    milestones (
                        id,
                        title,
                        date,
                        is_completed,
                        check_items (
                            id,
                            text,
                            is_completed
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedGoals: Goal[] = (data || []).map((g: any) => ({
                id: g.id,
                title: g.title,
                description: g.description || "",
                startDate: g.start_date,
                endDate: g.end_date,
                progress: g.progress,
                isCompleted: g.is_completed,
                imageUrl: g.image_url,
                createdAt: new Date(g.created_at).getTime(),
                milestones: g.milestones.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    date: m.date || "",
                    isCompleted: m.is_completed,
                    checklists: m.check_items.map((c: any) => ({
                        id: c.id,
                        text: c.text,
                        isCompleted: c.is_completed
                    }))
                }))
            }));

            setGoals(mappedGoals);
        } catch (e: any) {
            console.error("Detailed Error fetching goals:", {
                message: e.message,
                details: e.details,
                hint: e.hint,
                code: e.code,
                error: e
            });
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setGoals([]);
            setIsLoading(false);
            return;
        }

        fetchGoals();

        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'goals',
                    filter: `user_id=eq.${user.id}`
                },
                () => fetchGoals()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'milestones'
                },
                () => fetchGoals()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'check_items'
                },
                () => fetchGoals()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchGoals]);

    const addGoal = async (newGoal: any) => {
        if (!user) return;

        // Optimistic Update: Add to local state with temp ID
        const tempId = "temp-" + Date.now();
        const previousGoals = [...goals];

        const optimisticGoal: Goal = {
            id: tempId,
            title: newGoal.title,
            description: newGoal.description || "",
            startDate: newGoal.startDate,
            endDate: newGoal.endDate,
            progress: 0,
            isCompleted: false,
            createdAt: Date.now(),
            milestones: newGoal.milestones.map((m: any, mIdx: number) => ({
                id: "temp-m-" + mIdx + "-" + Date.now(),
                title: m.title,
                date: m.date || "",
                isCompleted: false,
                checklists: (m.checklists || []).map((c: any, cIdx: number) => ({
                    id: "temp-c-" + mIdx + "-" + cIdx + "-" + Date.now(),
                    text: typeof c === 'string' ? c : c.text,
                    isCompleted: false
                }))
            }))
        };

        setGoals(prev => [optimisticGoal, ...prev]);

        try {
            const { data: goalData, error: goalError } = await (supabase as any)
                .from('goals')
                .insert({
                    user_id: user.id,
                    title: newGoal.title,
                    description: newGoal.description,
                    start_date: newGoal.startDate,
                    end_date: newGoal.endDate,
                    progress: 0,
                    is_completed: false
                })
                .select()
                .single();

            if (goalError) throw goalError;

            // Success: Local state will be updated by real-time subscription or we can manually swap tempId
            // But wait, we need to insert milestones too.
            for (const m of newGoal.milestones) {
                const { data: milestoneData, error: milestoneError } = await (supabase as any)
                    .from('milestones')
                    .insert({
                        goal_id: goalData.id,
                        title: m.title,
                        date: m.date,
                        is_completed: false
                    })
                    .select()
                    .single();

                if (milestoneError) throw milestoneError;

                if (m.checklists && m.checklists.length > 0) {
                    const checkItems = m.checklists.map((c: any) => ({
                        milestone_id: milestoneData.id,
                        text: typeof c === 'string' ? c : c.text,
                        is_completed: false
                    }));

                    const { error: checkError } = await (supabase as any)
                        .from('check_items')
                        .insert(checkItems);

                    if (checkError) throw checkError;
                }
            }

            // Re-fetch to satisfy the real data and icons
            fetchGoals();
            return goalData.id;
        } catch (e) {
            console.error("Error adding goal, rolling back:", e);
            setGoals(previousGoals);
            alert("목표 추가에 실패했습니다.");
        }
    };

    const updateGoal = async (id: string, updates: Partial<Goal>) => {
        try {
            const supabaseUpdates: any = {};
            if (updates.title !== undefined) supabaseUpdates.title = updates.title;
            if (updates.description !== undefined) supabaseUpdates.description = updates.description;
            if (updates.startDate !== undefined) supabaseUpdates.start_date = updates.startDate;
            if (updates.endDate !== undefined) supabaseUpdates.end_date = updates.endDate;
            if (updates.progress !== undefined) supabaseUpdates.progress = updates.progress;
            if (updates.isCompleted !== undefined) supabaseUpdates.is_completed = updates.isCompleted;
            if ((updates as any).imageUrl !== undefined) supabaseUpdates.image_url = (updates as any).imageUrl;

            const { error } = await (supabase as any)
                .from('goals')
                .update(supabaseUpdates)
                .eq('id', id);

            if (error) throw error;
        } catch (e) {
            console.error("Error updating goal:", e);
        }
    };

    const deleteGoal = async (id: string) => {
        // Optimistic Update: Remove from local state immediately
        const previousGoals = [...goals];
        setGoals(prev => prev.filter(g => g.id !== id));

        try {
            const { error } = await (supabase as any)
                .from('goals')
                .delete()
                .eq('id', id);

            if (error) {
                console.error("Supabase error during deletion:", error);
                throw error;
            }
            console.log("Goal deleted successfully from server:", id);
        } catch (e: any) {
            console.error("Error deleting goal, rolling back:", e);
            // Rollback on failure
            setGoals(previousGoals);
            alert(`목표 삭제에 실패했습니다: ${e.message || "알 수 없는 오류"}`);
        }
    };

    const toggleCheckItem = async (goalId: string, milestoneId: string, checkItemId: string) => {
        // Optimistic Update: Calculate new state immediately
        const previousGoals = JSON.parse(JSON.stringify(goals)); // Deep copy for rollback

        let newProgress = 0;
        setGoals(prev => prev.map(g => {
            if (g.id !== goalId) return g;

            const updatedMilestones = g.milestones.map(m => {
                if (m.id !== milestoneId) return m;

                const updatedChecklists = m.checklists.map(c =>
                    c.id === checkItemId ? { ...c, isCompleted: !c.isCompleted } : c
                );

                const allChecked = updatedChecklists.length > 0 && updatedChecklists.every(c => c.isCompleted);
                return { ...m, checklists: updatedChecklists, isCompleted: allChecked };
            });

            let totalItems = 0;
            let completedItems = 0;
            updatedMilestones.forEach(m => {
                m.checklists.forEach(c => {
                    totalItems++;
                    if (c.isCompleted) completedItems++;
                });
            });

            newProgress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
            return { ...g, milestones: updatedMilestones, progress: newProgress, isCompleted: newProgress === 100 };
        }));

        try {
            const goal = goals.find(g => g.id === goalId);
            const milestone = goal?.milestones.find(m => m.id === milestoneId);
            const item = milestone?.checklists.find(c => c.id === checkItemId);

            if (!item) return;

            const newCompleted = !item.isCompleted;

            // 1. Update check item
            const { error: itemError } = await (supabase as any)
                .from('check_items')
                .update({ is_completed: newCompleted })
                .eq('id', checkItemId);

            if (itemError) throw itemError;

            // Update user activity action
            if (user) updateLastAction(user.id);

            // 2. Update milestone & goal (Server will do this, but we call API to ensure consistency if no triggers)
            const updatedChecklists = milestone!.checklists.map(c =>
                c.id === checkItemId ? { ...c, isCompleted: newCompleted } : c
            );
            const allChecked = updatedChecklists.length > 0 && updatedChecklists.every(c => c.isCompleted);

            await (supabase as any)
                .from('milestones')
                .update({ is_completed: allChecked })
                .eq('id', milestoneId);

            await (supabase as any)
                .from('goals')
                .update({ progress: newProgress, is_completed: newProgress === 100 })
                .eq('id', goalId);

        } catch (e) {
            console.error("Error toggling check item, rolling back:", e);
            setGoals(previousGoals);
        }
    };

    return {
        goals,
        isLoading,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleCheckItem
    };
}
