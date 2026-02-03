export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            goals: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    description: string | null
                    start_date: string
                    end_date: string
                    progress: number
                    is_completed: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    description?: string | null
                    start_date: string
                    end_date: string
                    progress?: number
                    is_completed?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    start_date?: string
                    end_date?: string
                    progress?: number
                    is_completed?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            milestones: {
                Row: {
                    id: string
                    goal_id: string
                    title: string
                    date: string | null
                    is_completed: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    goal_id: string
                    title: string
                    date?: string | null
                    is_completed?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    goal_id?: string
                    title?: string
                    date?: string | null
                    is_completed?: boolean
                    created_at?: string
                }
            }
            check_items: {
                Row: {
                    id: string
                    milestone_id: string
                    text: string
                    is_completed: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    milestone_id: string
                    text: string
                    is_completed?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    milestone_id?: string
                    text?: string
                    is_completed?: boolean
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    last_active_at: string
                    last_action_at: string
                    nickname: string | null
                    updated_at: string
                }
                Insert: {
                    id: string
                    last_active_at?: string
                    last_action_at?: string
                    nickname?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    last_active_at?: string
                    last_action_at?: string
                    nickname?: string | null
                    updated_at?: string
                }
            }
        }
    }
}
