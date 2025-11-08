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
            users: {
                Row: {
                    clerk_user_id: string
                    email: string
                    full_name: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    clerk_user_id: string
                    email: string
                    full_name?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    clerk_user_id?: string
                    email?: string
                    full_name?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            user_medical_info: {
                Row: {
                    id: string
                    user_id: string
                    age: number | null
                    gender: string | null
                    weight: number | null
                    height: number | null
                    medical_conditions: string[] | null
                    medications: string[] | null
                    allergies: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    age?: number | null
                    gender?: string | null
                    weight?: number | null
                    height?: number | null
                    medical_conditions?: string[] | null
                    medications?: string[] | null
                    allergies?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    age?: number | null
                    gender?: string | null
                    weight?: number | null
                    height?: number | null
                    medical_conditions?: string[] | null
                    medications?: string[] | null
                    allergies?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            diagnostics: {
                Row: {
                    id: string
                    user_id: string
                    diagnosis_type: string
                    result: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    diagnosis_type: string
                    result?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    diagnosis_type?: string
                    result?: Json | null
                    created_at?: string
                }
            }
            appointments: {
                Row: {
                    id: string
                    user_id: string
                    diagnostic_id: string
                    appointment_date: string | null
                    appointment_time: string | null
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    diagnostic_id: string
                    appointment_date?: string | null
                    appointment_time?: string | null
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    diagnostic_id?: string
                    appointment_date?: string | null
                    appointment_time?: string | null
                    status?: string
                    created_at?: string
                }
            }
            chat_messages: {
                Row: {
                    id: string
                    user_id: string
                    message: string
                    is_bot: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    message: string
                    is_bot?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    message?: string
                    is_bot?: boolean
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}