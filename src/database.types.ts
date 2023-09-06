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
      Messages: {
        Row: {
          content: string | null
          created_at: string
          id: number
          role: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          role?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          role?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
