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
      admin_attendance_log: {
        Row: {
          created_at: string
          created_by: string
          enrollment_id: string
          id: string
          session_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          enrollment_id: string
          id?: string
          session_date: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          enrollment_id?: string
          id?: string
          session_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_attendance_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "admin_attendance_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          enrollment_id: string | null
          field: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          enrollment_id?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          enrollment_id?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_group_id: string | null
          related_user_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_group_id?: string | null
          related_user_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_group_id?: string | null
          related_user_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_related_group_id_fkey"
            columns: ["related_group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_log: {
        Row: {
          id: string
          marked_at: string
          marked_by: string
          notes: string | null
          package_id: string | null
          session_date: string | null
          student_id: string
        }
        Insert: {
          id?: string
          marked_at?: string
          marked_by: string
          notes?: string | null
          package_id?: string | null
          session_date?: string | null
          student_id: string
        }
        Update: {
          id?: string
          marked_at?: string
          marked_by?: string
          notes?: string | null
          package_id?: string | null
          session_date?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_log_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "student_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
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
          member_status: string
          user_id: string
        }
        Insert: {
          added_at?: string
          batch_id: string
          enrollment_id: string
          id?: string
          member_status?: string
          user_id: string
        }
        Update: {
          added_at?: string
          batch_id?: string
          enrollment_id?: string
          id?: string
          member_status?: string
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
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
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
          hero_alt_2: string | null
          hero_caption: string | null
          hero_caption_2: string | null
          hero_image: string | null
          hero_image_2: string | null
          id: string
          keywords: string[] | null
          lang: string
          published: boolean
          published_at: string | null
          seo_score: number | null
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
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string
          keywords?: string[] | null
          lang?: string
          published?: boolean
          published_at?: string | null
          seo_score?: number | null
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
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string
          keywords?: string[] | null
          lang?: string
          published?: boolean
          published_at?: string | null
          seo_score?: number | null
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
      email_campaigns: {
        Row: {
          created_at: string
          created_by: string
          html_body: string
          id: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          created_by: string
          html_body: string
          id?: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          created_by?: string
          html_body?: string
          id?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          attempts: number
          campaign_id: string
          created_at: string
          email: string
          error: string | null
          id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          attempts?: number
          campaign_id: string
          created_at?: string
          email: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          attempts?: number
          campaign_id?: string
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
          last_reminder_at: string | null
          matched_at: string | null
          matched_batch_id: string | null
          negative_since: string | null
          payment_date: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string
          plan_type: string
          preferred_days: string[] | null
          preferred_start: string | null
          preferred_time: string | null
          receipt_url: string
          reminder_count: number
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
          last_reminder_at?: string | null
          matched_at?: string | null
          matched_batch_id?: string | null
          negative_since?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type: string
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_url: string
          reminder_count?: number
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
          last_reminder_at?: string | null
          matched_at?: string | null
          matched_batch_id?: string | null
          negative_since?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type?: string
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_url?: string
          reminder_count?: number
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
      group_attendance: {
        Row: {
          admin_approved: boolean
          created_at: string
          id: string
          session_id: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          admin_approved?: boolean
          created_at?: string
          id?: string
          session_id: string
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_approved?: boolean
          created_at?: string
          id?: string
          session_id?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      group_sessions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          session_date: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          session_date: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          session_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
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
      level_slot_config: {
        Row: {
          created_at: string | null
          id: string
          level: string
          slot_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          slot_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          slot_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "level_slot_config_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_slots: {
        Row: {
          course_level: string
          created_at: string
          current_count: number
          day: string
          id: string
          max_students: number
          min_students: number
          status: string
          time: string
          timezone: string
        }
        Insert: {
          course_level?: string
          created_at?: string
          current_count?: number
          day: string
          id?: string
          max_students?: number
          min_students?: number
          status?: string
          time: string
          timezone?: string
        }
        Update: {
          course_level?: string
          created_at?: string
          current_count?: number
          day?: string
          id?: string
          max_students?: number
          min_students?: number
          status?: string
          time?: string
          timezone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
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
          avatar_url?: string | null
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
          avatar_url?: string | null
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
      schedule_options: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      student_groups: {
        Row: {
          capacity: number | null
          course_type: string | null
          created_at: string
          id: string
          level: string | null
          name: string
          schedule_day: string | null
          schedule_time: string | null
          schedule_timezone: string | null
        }
        Insert: {
          capacity?: number | null
          course_type?: string | null
          created_at?: string
          id?: string
          level?: string | null
          name: string
          schedule_day?: string | null
          schedule_time?: string | null
          schedule_timezone?: string | null
        }
        Update: {
          capacity?: number | null
          course_type?: string | null
          created_at?: string
          id?: string
          level?: string | null
          name?: string
          schedule_day?: string | null
          schedule_time?: string | null
          schedule_timezone?: string | null
        }
        Relationships: []
      }
      student_packages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          package_name: string
          payment_status: string
          price_per_class: number
          student_id: string
          total_classes: number
          total_paid: number
          used_classes: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          package_name?: string
          payment_status?: string
          price_per_class?: number
          student_id: string
          total_classes?: number
          total_paid?: number
          used_classes?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          package_name?: string
          payment_status?: string
          price_per_class?: number
          student_id?: string
          total_classes?: number
          total_paid?: number
          used_classes?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_packages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_schedule_preferences: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_schedule_preferences_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      student_slot_preferences: {
        Row: {
          assigned_slot_id: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          match_status: string
          selected_level: string
          slot_1_id: string | null
          slot_2_id: string | null
          slot_3_id: string | null
          user_id: string
        }
        Insert: {
          assigned_slot_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          match_status?: string
          selected_level?: string
          slot_1_id?: string | null
          slot_2_id?: string | null
          slot_3_id?: string | null
          user_id: string
        }
        Update: {
          assigned_slot_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          match_status?: string
          selected_level?: string
          slot_1_id?: string | null
          slot_2_id?: string | null
          slot_3_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_slot_preferences_assigned_slot_id_fkey"
            columns: ["assigned_slot_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "student_slot_preferences_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_1_id_fkey"
            columns: ["slot_1_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_2_id_fkey"
            columns: ["slot_2_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_3_id_fkey"
            columns: ["slot_3_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          country: string | null
          course_type: string | null
          created_at: string
          email: string
          full_name: string
          group_name: string | null
          id: string
          notes: string | null
          package_name: string | null
          payment_status: string
          phone: string | null
          price_per_class: number
          remaining_classes: number | null
          status: string
          total_classes: number
          total_paid: number
          updated_at: string
          used_classes: number
        }
        Insert: {
          country?: string | null
          course_type?: string | null
          created_at?: string
          email: string
          full_name: string
          group_name?: string | null
          id?: string
          notes?: string | null
          package_name?: string | null
          payment_status?: string
          phone?: string | null
          price_per_class?: number
          remaining_classes?: number | null
          status?: string
          total_classes?: number
          total_paid?: number
          updated_at?: string
          used_classes?: number
        }
        Update: {
          country?: string | null
          course_type?: string | null
          created_at?: string
          email?: string
          full_name?: string
          group_name?: string | null
          id?: string
          notes?: string | null
          package_name?: string | null
          payment_status?: string
          phone?: string | null
          price_per_class?: number
          remaining_classes?: number | null
          status?: string
          total_classes?: number
          total_paid?: number
          updated_at?: string
          used_classes?: number
        }
        Relationships: []
      }
      system_reset_log: {
        Row: {
          admin_id: string
          created_at: string
          details: string | null
          id: string
          reset_type: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          details?: string | null
          id?: string
          reset_type?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reset_type?: string
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
      admin_student_overview: {
        Row: {
          amount: number | null
          amount_due: number | null
          approval_status: string | null
          country: string | null
          currency: string | null
          derived_status: string | null
          duration: number | null
          email: string | null
          enrollment_created_at: string | null
          enrollment_id: string | null
          joined_at: string | null
          level: string | null
          name: string | null
          negative_sessions: number | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string | null
          plan_type: string | null
          sessions_remaining: number | null
          sessions_total: number | null
          source_label: string | null
          unit_price: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      admin_add_attendance: {
        Args: {
          p_enrollment_id: string
          p_note?: string
          p_session_date: string
        }
        Returns: number
      }
      admin_remove_attendance: {
        Args: { p_enrollment_id: string; p_session_date: string }
        Returns: number
      }
      approve_attendance_request: {
        Args: { _request_id: string }
        Returns: number
      }
      approve_group_attendance: {
        Args: { _attendance_id: string }
        Returns: undefined
      }
      auto_match_student: { Args: { _preference_id: string }; Returns: string }
      create_egypt_order: {
        Args: { _duration: number; _plan_type: string }
        Returns: string
      }
      deduct_credit: { Args: { _user_id: string }; Returns: number }
      get_auth_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_student_attendance: {
        Args: { _notes?: string; _student_id: string }
        Returns: number
      }
      match_enrollment_to_slot: {
        Args: { _enrollment_id: string }
        Returns: string
      }
      reassign_student_slot: {
        Args: { _enrollment_id: string; _new_slot_id: string }
        Returns: undefined
      }
      reject_attendance_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      reset_platform_data: {
        Args: { _reset_password: string }
        Returns: string
      }
      revert_attendance_request: {
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
      unmatch_student_slot: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
      update_student_preferences: {
        Args: {
          _enrollment_id: string
          _preferred_days: string[]
          _timezone: string
        }
        Returns: undefined
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
