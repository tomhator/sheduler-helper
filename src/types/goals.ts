export interface CheckItem {
    id: string;
    text: string;
    isCompleted: boolean;
}

export interface Milestone {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    description?: string;
    checklists: CheckItem[];
    isCompleted: boolean;
}

export interface Goal {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    milestones: Milestone[];
    createdAt: number;
    progress: number; // 0-100
    isCompleted: boolean;
    imageUrl?: string;
}

// Type used for Goal Creation (Wizard State)
// Note: In Wizard, checklists are string[] initially, but we will convert them before saving.
// So let's define a specific type for Wizard if needed, or just use GoalData as the final input.
export type GoalInput = Omit<Goal, "id" | "createdAt" | "progress" | "isCompleted">;

export interface GoalData {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    milestones: {
        id: string;
        title: string;
        date: string;
        checklists: string[]; // Wizard uses string[] for simplicity
    }[];
}
