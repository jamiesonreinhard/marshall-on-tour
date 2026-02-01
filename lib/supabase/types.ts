export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atp_calendar: {
        Row: {
          category: string | null
          created_at: string
          end_date: string
          id: string
          last_synced_at: string | null
          location: Json
          name: string
          prize_money: string | null
          start_date: string
          surface: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          end_date: string
          id?: string
          last_synced_at?: string | null
          location: Json
          name: string
          prize_money?: string | null
          start_date: string
          surface?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          end_date?: string
          id?: string
          last_synced_at?: string | null
          location?: Json
          name?: string
          prize_money?: string | null
          start_date?: string
          surface?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_calendar: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          atp_tournament_id: string | null
          attitude: string | null
          blog_schedule: Json | null
          category: string | null
          content_brief: string
          created_at: string
          events: string[] | null
          focus_keyword: string | null
          generated_at: string | null
          generated_post_id: string | null
          id: string
          instagram_schedule: Json | null
          notes: string | null
          post_type: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          timezone: string | null
          tone_notes: string | null
          updated_at: string
          x_schedule: Json | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          atp_tournament_id?: string | null
          attitude?: string | null
          blog_schedule?: Json | null
          category?: string | null
          content_brief: string
          created_at?: string
          events?: string[] | null
          focus_keyword?: string | null
          generated_at?: string | null
          generated_post_id?: string | null
          id?: string
          instagram_schedule?: Json | null
          notes?: string | null
          post_type?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          timezone?: string | null
          tone_notes?: string | null
          updated_at?: string
          x_schedule?: Json | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          atp_tournament_id?: string | null
          attitude?: string | null
          blog_schedule?: Json | null
          category?: string | null
          content_brief?: string
          created_at?: string
          events?: string[] | null
          focus_keyword?: string | null
          generated_at?: string | null
          generated_post_id?: string | null
          id?: string
          instagram_schedule?: Json | null
          notes?: string | null
          post_type?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          timezone?: string | null
          tone_notes?: string | null
          updated_at?: string
          x_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_atp_tournament_id_fkey"
            columns: ["atp_tournament_id"]
            isOneToOne: false
            referencedRelation: "atp_calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_generated_post_id_fkey"
            columns: ["generated_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          affiliate_links: Json | null
          author_image: string | null
          author_name: string
          category: string
          content: string
          created_at: string
          excerpt: string
          featured_image: string
          focus_keyword: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          published: boolean
          published_at: string | null
          reading_time: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          affiliate_links?: Json | null
          author_image?: string | null
          author_name?: string
          category: string
          content: string
          created_at?: string
          excerpt: string
          featured_image: string
          focus_keyword?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          reading_time?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          affiliate_links?: Json | null
          author_image?: string | null
          author_name?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          featured_image?: string
          focus_keyword?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          reading_time?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
