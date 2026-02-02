import { supabase } from "./supabase";
import { Goal } from "../types/goals";

const STORAGE_KEY = "jaksim_goals";

export async function migrateLocalStorageToSupabase(userId: string) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
        const localGoals: Goal[] = JSON.parse(stored);
        if (localGoals.length === 0) return;

        console.log(`Migrating ${localGoals.length} goals to Supabase...`);

        for (const goal of localGoals) {
            // 1. Insert Goal
            const { data: goalData, error: goalError } = await (supabase as any)
                .from("goals")
                .insert({
                    user_id: userId,
                    title: goal.title,
                    description: goal.description,
                    start_date: goal.startDate,
                    end_date: goal.endDate,
                    progress: goal.progress,
                    is_completed: goal.isCompleted,
                    image_url: (goal as any).imageUrl || null
                })
                .select()
                .single();

            if (goalError) {
                console.error("Error migrating goal:", goalError);
                continue;
            }

            // 2. Insert Milestones
            for (const milestone of goal.milestones) {
                const { data: milestoneData, error: milestoneError } = await (supabase as any)
                    .from("milestones")
                    .insert({
                        goal_id: goalData.id,
                        title: milestone.title,
                        date: milestone.date,
                        is_completed: milestone.isCompleted
                    })
                    .select()
                    .single();

                if (milestoneError) {
                    console.error("Error migrating milestone:", milestoneError);
                    continue;
                }

                // 3. Insert Check Items
                if (milestone.checklists && milestone.checklists.length > 0) {
                    const checkItems = milestone.checklists.map(item => ({
                        milestone_id: milestoneData.id,
                        text: item.text,
                        is_completed: item.isCompleted
                    }));

                    const { error: checkError } = await (supabase as any)
                        .from("check_items")
                        .insert(checkItems);

                    if (checkError) {
                        console.error("Error migrating check items:", checkError);
                    }
                }
            }
        }

        // Success! Clear local storage
        localStorage.removeItem(STORAGE_KEY);
        console.log("Migration completed successfully and localStorage cleared.");
        return true;
    } catch (e) {
        console.error("Failed to migrate goals", e);
        return false;
    }
}
