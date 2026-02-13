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
      attendance_requests: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          request_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          request_date: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          request_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_members: {
        Row: {
          added_at: string
          batch_id: string
          enrollment_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          batch_id: string
          enrollment_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          batch_id?: string
          enrollment_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_members_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_members_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          capacity: number
          course_id: string
          created_at: string
          id: string
          level: string
          status: string
        }
        Insert: {
          capacity?: number
          course_id: string
          created_at?: string
          id?: string
          level?: string
          status?: string
        }
        Update: {
          capacity?: number
          course_id?: string
          created_at?: string
          id?: string
          level?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          article_type: string
          author: string
          content: string
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string
          hero_alt: string | null
          hero_caption: string | null
          hero_image: string | null
          id: string
          keywords: string[] | null
          lang: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          article_type?: string
          author?: string
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string
          hero_alt?: string | null
          hero_caption?: string | null
          hero_image?: string | null
          id?: string
          keywords?: string[] | null
          lang?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          article_type?: string
          author?: string
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string
          hero_alt?: string | null
          hero_caption?: string | null
          hero_image?: string | null
          id?: string
          keywords?: string[] | null
          lang?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          currency: string
          id: string
          level: string
          price_amount: number
          sessions_included: number
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          level?: string
          price_amount?: number
          sessions_included?: number
          title: string
          type: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          level?: string
          price_amount?: number
          sessions_included?: number
          title?: string
          type?: string
        }
        Relationships: []
      }
      egp_prices: {
        Row: {
          amount_egp: number
          duration: number
          plan_type: string
        }
        Insert: {
          amount_egp: number
          duration: number
          plan_type: string
        }
        Update: {
          amount_egp?: number
          duration?: number
          plan_type?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          admin_review_required: boolean
          amount: number
          approval_status: string
          classes_included: number
          created_at: string
          currency: string
          due_at: string | null
          duration: number
          id: string
          matched_at: string | null
          matched_batch_id: string | null
          payment_date: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string
          plan_type: string
          preferred_days: string[] | null
          preferred_start: string | null
          preferred_time: string | null
          receipt_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          sessions_remaining: number
          sessions_total: number
          status: string
          stripe_payment_intent_id: string | null
          timezone: string | null
          tx_ref: string
          unit_price: number
          user_id: string
        }
        Insert: {
          admin_review_required?: boolean
          amount: number
          approval_status?: string
          classes_included: number
          created_at?: string
          currency?: string
          due_at?: string | null
          duration: number
          id?: string
          matched_at?: string | null
          matched_batch_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type: string
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_remaining?: number
          sessions_total?: number
          status?: string
          stripe_payment_intent_id?: string | null
          timezone?: string | null
          tx_ref: string
          unit_price: number
          user_id: string
        }
        Update: {
          admin_review_required?: boolean
          amount?: number
          approval_status?: string
          classes_included?: number
          created_at?: string
          currency?: string
          due_at?: string | null
          duration?: number
          id?: string
          matched_at?: string | null
          matched_batch_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type?: string
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_remaining?: number
          sessions_total?: number
          status?: string
          stripe_payment_intent_id?: string | null
          timezone?: string | null
          tx_ref?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_enrollments_matched_batch"
            columns: ["matched_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          country: string | null
          created_at: string
          duration: string | null
          email: string
          goal: string | null
          id: string
          level: string | null
          name: string
          plan_type: string | null
          schedule: string | null
          source: string | null
          status: string
          timezone: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          duration?: string | null
          email: string
          goal?: string | null
          id?: string
          level?: string | null
          name: string
          plan_type?: string | null
          schedule?: string | null
          source?: string | null
          status?: string
          timezone?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          duration?: string | null
          email?: string
          goal?: string | null
          id?: string
          level?: string | null
          name?: string
          plan_type?: string | null
          schedule?: string | null
          source?: string | null
          status?: string
          timezone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string
          created_at: string
          credits: number
          email: string
          id: string
          level: string
          name: string
          status: string
          user_id: string
        }
        Insert: {
          country?: string
          created_at?: string
          credits?: number
          email: string
          id?: string
          level?: string
          name: string
          status?: string
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          credits?: number
          email?: string
          id?: string
          level?: string
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      approve_attendance_request: {
        Args: { _request_id: string }
        Returns: number
      }
      create_egypt_order: {
        Args: { _duration: number; _plan_type: string }
        Returns: string
      }
      deduct_credit: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_attendance_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      revert_enrollment: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
      submit_egypt_payment: {
        Args: {
          _enrollment_id: string
          _payment_date: string
          _payment_method: string
          _receipt_url: string
          _tx_ref?: string
        }
        Returns: undefined
      }
      submit_manual_enrollment:
        | {
            Args: {
              _amount: number
              _duration: number
              _plan_type: string
              _receipt_url: string
              _tx_ref: string
            }
            Returns: string
          }
        | {
            Args: {
              _amount: number
              _duration: number
              _payment_method?: string
              _plan_type: string
              _receipt_url: string
              _tx_ref: string
            }
            Returns: string
          }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
