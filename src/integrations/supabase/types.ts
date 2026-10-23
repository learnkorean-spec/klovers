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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievement_milestones: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          id: number
          is_achieved: boolean | null
          milestone_name: string
          milestone_tier: number
          milestone_type: string
          progress_value: number | null
          target_value: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          id?: number
          is_achieved?: boolean | null
          milestone_name: string
          milestone_tier: number
          milestone_type: string
          progress_value?: number | null
          target_value: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          id?: number
          is_achieved?: boolean | null
          milestone_name?: string
          milestone_tier?: number
          milestone_type?: string
          progress_value?: number | null
          target_value?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_accounts_map: {
        Row: {
          detail: string
          id: string
          login: string
          service: string
          sort_order: number
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          detail?: string
          id?: string
          login?: string
          service: string
          sort_order?: number
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          detail?: string
          id?: string
          login?: string
          service?: string
          sort_order?: number
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
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
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
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
      admin_error_log: {
        Row: {
          component_stack: string | null
          created_at: string
          id: number
          message: string
          stack: string | null
          tab: string
          url: string | null
          user_agent: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          id?: number
          message: string
          stack?: string | null
          tab: string
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          id?: number
          message?: string
          stack?: string | null
          tab?: string
          url?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          read: boolean
          related_group_id: string | null
          related_user_id: string | null
          type: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_group_id?: string | null
          related_user_id?: string | null
          type?: string
        }
        Update: {
          category?: string
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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
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
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
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
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
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
          {
            foreignKeyName: "batches_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "batches_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      blog_comments: {
        Row: {
          approved: boolean
          author_name: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          approved?: boolean
          author_name: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          approved?: boolean
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          article_type: string
          author: string
          brand: string
          content: string
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string
          featured: boolean
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
          seo_priority: number
          seo_score: number | null
          slug: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          article_type?: string
          author?: string
          brand?: string
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string
          featured?: boolean
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
          seo_priority?: number
          seo_score?: number | null
          slug: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          article_type?: string
          author?: string
          brand?: string
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string
          featured?: boolean
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
          seo_priority?: number
          seo_score?: number | null
          slug?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      blog_posts_backup_20260927_en: {
        Row: {
          article_type: string | null
          author: string | null
          backed_up_at: string | null
          content: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          featured: boolean | null
          hero_alt: string | null
          hero_alt_2: string | null
          hero_caption: string | null
          hero_caption_2: string | null
          hero_image: string | null
          hero_image_2: string | null
          id: string | null
          keywords: string[] | null
          lang: string | null
          published: boolean | null
          published_at: string | null
          seo_priority: number | null
          seo_score: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          article_type?: string | null
          author?: string | null
          backed_up_at?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          article_type?: string | null
          author?: string | null
          backed_up_at?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      blog_posts_backup_20260927_msa: {
        Row: {
          article_type: string | null
          author: string | null
          backed_up_at: string | null
          content: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          featured: boolean | null
          hero_alt: string | null
          hero_alt_2: string | null
          hero_caption: string | null
          hero_caption_2: string | null
          hero_image: string | null
          hero_image_2: string | null
          id: string | null
          keywords: string[] | null
          lang: string | null
          published: boolean | null
          published_at: string | null
          seo_priority: number | null
          seo_score: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          article_type?: string | null
          author?: string | null
          backed_up_at?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          article_type?: string | null
          author?: string | null
          backed_up_at?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      blog_posts_backup_20260927_restore: {
        Row: {
          article_type: string | null
          author: string | null
          backed_up_at: string | null
          content: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          featured: boolean | null
          hero_alt: string | null
          hero_alt_2: string | null
          hero_caption: string | null
          hero_caption_2: string | null
          hero_image: string | null
          hero_image_2: string | null
          id: string | null
          keywords: string[] | null
          lang: string | null
          published: boolean | null
          published_at: string | null
          seo_priority: number | null
          seo_score: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          article_type?: string | null
          author?: string | null
          backed_up_at?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          article_type?: string | null
          author?: string | null
          backed_up_at?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      blog_posts_backup_20261005_topik1_ar: {
        Row: {
          article_type: string | null
          author: string | null
          content: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          featured: boolean | null
          hero_alt: string | null
          hero_alt_2: string | null
          hero_caption: string | null
          hero_caption_2: string | null
          hero_image: string | null
          hero_image_2: string | null
          id: string | null
          keywords: string[] | null
          lang: string | null
          published: boolean | null
          published_at: string | null
          seo_priority: number | null
          seo_score: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          article_type?: string | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          article_type?: string | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      blog_posts_backup_20261005_topik1_en: {
        Row: {
          article_type: string | null
          author: string | null
          content: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          featured: boolean | null
          hero_alt: string | null
          hero_alt_2: string | null
          hero_caption: string | null
          hero_caption_2: string | null
          hero_image: string | null
          hero_image_2: string | null
          id: string | null
          keywords: string[] | null
          lang: string | null
          published: boolean | null
          published_at: string | null
          seo_priority: number | null
          seo_score: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          article_type?: string | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          article_type?: string | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      blog_posts_backup_20261008_heroes: {
        Row: {
          article_type: string | null
          author: string | null
          content: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          featured: boolean | null
          hero_alt: string | null
          hero_alt_2: string | null
          hero_caption: string | null
          hero_caption_2: string | null
          hero_image: string | null
          hero_image_2: string | null
          id: string | null
          keywords: string[] | null
          lang: string | null
          published: boolean | null
          published_at: string | null
          seo_priority: number | null
          seo_score: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          article_type?: string | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          article_type?: string | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      blog_posts_backup_20261008_streetfood_ar: {
        Row: {
          article_type: string | null
          author: string | null
          content: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          featured: boolean | null
          hero_alt: string | null
          hero_alt_2: string | null
          hero_caption: string | null
          hero_caption_2: string | null
          hero_image: string | null
          hero_image_2: string | null
          id: string | null
          keywords: string[] | null
          lang: string | null
          published: boolean | null
          published_at: string | null
          seo_priority: number | null
          seo_score: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          article_type?: string | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          article_type?: string | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          featured?: boolean | null
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string | null
          keywords?: string[] | null
          lang?: string | null
          published?: boolean | null
          published_at?: string | null
          seo_priority?: number | null
          seo_score?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_arlinks: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_batch4: {
        Row: {
          content: string | null
          description: string | null
          id: string | null
          slug: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          description?: string | null
          id?: string | null
          slug?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          description?: string | null
          id?: string | null
          slug?: string | null
          title?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_batch5: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_claims: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_claims2: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_claims3: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_gender: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_h1: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
          title?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_jaket: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_meta: {
        Row: {
          hero_alt: string | null
          id: string | null
          slug: string | null
          title: string | null
        }
        Insert: {
          hero_alt?: string | null
          id?: string | null
          slug?: string | null
          title?: string | null
        }
        Update: {
          hero_alt?: string | null
          id?: string | null
          slug?: string | null
          title?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_meta2: {
        Row: {
          description: string | null
          id: string | null
          slug: string | null
          title: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          slug?: string | null
          title?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          slug?: string | null
          title?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_qmark: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      blog_posts_backup_20261014_teachers: {
        Row: {
          content: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          content?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      book_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          available_from: string
          book_id: string
          enrollment_id: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          available_from: string
          book_id?: string
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          available_from?: string
          book_id?: string
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_assignments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "book_assignments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "book_assignments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_recovery_emails: {
        Row: {
          clicked_at: string | null
          converted_at: string | null
          created_at: string
          email: string
          error_message: string | null
          id: string
          lead_id: string
          opened_at: string | null
          provider_message_id: string | null
          scheduled_for: string | null
          send_status: string
          sent_at: string | null
          stage: number
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          lead_id: string
          opened_at?: string | null
          provider_message_id?: string | null
          scheduled_for?: string | null
          send_status?: string
          sent_at?: string | null
          stage: number
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          scheduled_for?: string | null
          send_status?: string
          sent_at?: string | null
          stage?: number
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_recovery_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "checkout_recovery_tracker"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "checkout_recovery_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      class_books: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          language: string
          level: string
          notes: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          language?: string
          level: string
          notes?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          language?: string
          level?: string
          notes?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      class_reminder_sends: {
        Row: {
          sent_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          sent_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          sent_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_reminder_sends_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pkg_group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_levels: {
        Row: {
          created_at: string
          display_label: string
          is_active: boolean
          key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_label: string
          is_active?: boolean
          key: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_label?: string
          is_active?: boolean
          key?: string
          sort_order?: number
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
        Relationships: [
          {
            foreignKeyName: "courses_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "courses_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      cron_health: {
        Row: {
          created_at: string
          detail: string | null
          id: number
          job_name: string
          status: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: number
          job_name: string
          status: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: number
          job_name?: string
          status?: string
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
      email_logs: {
        Row: {
          bounced_at: string | null
          complained_at: string | null
          created_at: string | null
          delivered_at: string | null
          enrollment_id: string | null
          error: string | null
          id: string
          resend_id: string | null
          status: string
          template: string
          to_email: string
          to_name: string | null
        }
        Insert: {
          bounced_at?: string | null
          complained_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          enrollment_id?: string | null
          error?: string | null
          id?: string
          resend_id?: string | null
          status: string
          template: string
          to_email: string
          to_name?: string | null
        }
        Update: {
          bounced_at?: string | null
          complained_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          enrollment_id?: string | null
          error?: string | null
          id?: string
          resend_id?: string | null
          status?: string
          template?: string
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "email_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "email_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          attempts: number
          bounced_at: string | null
          campaign_id: string
          claimed_at: string | null
          complained_at: string | null
          created_at: string
          delivered_at: string | null
          email: string
          error: string | null
          id: string
          resend_id: string | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          attempts?: number
          bounced_at?: string | null
          campaign_id: string
          claimed_at?: string | null
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email: string
          error?: string | null
          id?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          attempts?: number
          bounced_at?: string | null
          campaign_id?: string
          claimed_at?: string | null
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email?: string
          error?: string | null
          id?: string
          resend_id?: string | null
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
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "v_campaign_delivery"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      enrollments: {
        Row: {
          acquisition_source: string | null
          admin_notes: string | null
          admin_review_required: boolean
          amount: number
          approval_email_sent_at: string | null
          approval_status: string
          assigned_day: string | null
          assigned_time: string | null
          assigned_timezone: string | null
          class_feedback_sent_at: string | null
          class_link_sent_at: string | null
          classes_included: number
          created_at: string
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          due_at: string | null
          duration: number
          enrollment_status: string
          first_class_date: string | null
          forming_email_sent_at: string | null
          forming_escalation_sent_at: string | null
          id: string
          last_reminder_at: string | null
          level: string | null
          matched_at: string | null
          matched_batch_id: string | null
          negative_since: string | null
          package_id: string | null
          payment_date: string | null
          payment_email_sent_at: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string
          plan_type: string
          pre_class_reminder_sent_at: string | null
          preferred_day: string | null
          preferred_days: string[] | null
          preferred_start: string | null
          preferred_time: string | null
          receipt_nudge_sent_at: string | null
          receipt_url: string | null
          rejection_followup_sent_at: string | null
          reminder_count: number
          reviewed_at: string | null
          reviewed_by: string | null
          sessions_remaining: number
          sessions_total: number
          slot_id: string | null
          slot_rejection_at: string | null
          slot_rejection_reason: string | null
          status: string
          stripe_payment_intent_id: string | null
          timezone: string | null
          trial_booking_id: string | null
          tx_ref: string | null
          unit_price: number
          user_id: string
        }
        Insert: {
          acquisition_source?: string | null
          admin_notes?: string | null
          admin_review_required?: boolean
          amount: number
          approval_email_sent_at?: string | null
          approval_status?: string
          assigned_day?: string | null
          assigned_time?: string | null
          assigned_timezone?: string | null
          class_feedback_sent_at?: string | null
          class_link_sent_at?: string | null
          classes_included: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          due_at?: string | null
          duration: number
          enrollment_status?: string
          first_class_date?: string | null
          forming_email_sent_at?: string | null
          forming_escalation_sent_at?: string | null
          id?: string
          last_reminder_at?: string | null
          level?: string | null
          matched_at?: string | null
          matched_batch_id?: string | null
          negative_since?: string | null
          package_id?: string | null
          payment_date?: string | null
          payment_email_sent_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type: string
          pre_class_reminder_sent_at?: string | null
          preferred_day?: string | null
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_nudge_sent_at?: string | null
          receipt_url?: string | null
          rejection_followup_sent_at?: string | null
          reminder_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_remaining?: number
          sessions_total?: number
          slot_id?: string | null
          slot_rejection_at?: string | null
          slot_rejection_reason?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          timezone?: string | null
          trial_booking_id?: string | null
          tx_ref?: string | null
          unit_price: number
          user_id: string
        }
        Update: {
          acquisition_source?: string | null
          admin_notes?: string | null
          admin_review_required?: boolean
          amount?: number
          approval_email_sent_at?: string | null
          approval_status?: string
          assigned_day?: string | null
          assigned_time?: string | null
          assigned_timezone?: string | null
          class_feedback_sent_at?: string | null
          class_link_sent_at?: string | null
          classes_included?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          due_at?: string | null
          duration?: number
          enrollment_status?: string
          first_class_date?: string | null
          forming_email_sent_at?: string | null
          forming_escalation_sent_at?: string | null
          id?: string
          last_reminder_at?: string | null
          level?: string | null
          matched_at?: string | null
          matched_batch_id?: string | null
          negative_since?: string | null
          package_id?: string | null
          payment_date?: string | null
          payment_email_sent_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type?: string
          pre_class_reminder_sent_at?: string | null
          preferred_day?: string | null
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_nudge_sent_at?: string | null
          receipt_url?: string | null
          rejection_followup_sent_at?: string | null
          reminder_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_remaining?: number
          sessions_total?: number
          slot_id?: string | null
          slot_rejection_at?: string | null
          slot_rejection_reason?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          timezone?: string | null
          trial_booking_id?: string | null
          tx_ref?: string | null
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "enrollments_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "enrollments_trial_booking_id_fkey"
            columns: ["trial_booking_id"]
            isOneToOne: false
            referencedRelation: "trial_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_trial_booking_id_fkey"
            columns: ["trial_booking_id"]
            isOneToOne: false
            referencedRelation: "v_trial_bookings_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollments_matched_batch"
            columns: ["matched_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      game_xp_rules: {
        Row: {
          game_id: string
          is_active: boolean
          max_rounds: number
          xp_per_round: number
        }
        Insert: {
          game_id: string
          is_active?: boolean
          max_rounds: number
          xp_per_round: number
        }
        Update: {
          game_id?: string
          is_active?: boolean
          max_rounds?: number
          xp_per_round?: number
        }
        Relationships: []
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
      interview_training_sessions: {
        Row: {
          created_at: string
          free_used: number
          id: string
          industry: string | null
          job_title: string
          languages_spoken: string[] | null
          paid_purchased: number
          payment_status: string | null
          questions: Json | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          created_at?: string
          free_used?: number
          id?: string
          industry?: string | null
          job_title: string
          languages_spoken?: string[] | null
          paid_purchased?: number
          payment_status?: string | null
          questions?: Json | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          created_at?: string
          free_used?: number
          id?: string
          industry?: string | null
          job_title?: string
          languages_spoken?: string[] | null
          paid_purchased?: number
          payment_status?: string | null
          questions?: Json | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          campaign: string | null
          created_at: string
          cta_label: string | null
          id: string
          metadata: Json | null
          referrer: string | null
          session_id: string
          source_page: string
          source_type: string
          user_id: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          cta_label?: string | null
          id?: string
          metadata?: Json | null
          referrer?: string | null
          session_id: string
          source_page: string
          source_type: string
          user_id?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          campaign?: string | null
          created_at?: string
          cta_label?: string | null
          id?: string
          metadata?: Json | null
          referrer?: string | null
          session_id?: string
          source_page?: string
          source_type?: string
          user_id?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          country: string | null
          created_at: string
          duration: string | null
          email: string
          email_unsubscribed: boolean
          gclid: string | null
          goal: string | null
          id: string
          level: string | null
          name: string
          plan_type: string | null
          schedule: string | null
          source: string | null
          status: string
          timezone: string | null
          unsubscribe_token: string
          unsubscribed_at: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          duration?: string | null
          email: string
          email_unsubscribed?: boolean
          gclid?: string | null
          goal?: string | null
          id?: string
          level?: string | null
          name: string
          plan_type?: string | null
          schedule?: string | null
          source?: string | null
          status?: string
          timezone?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          duration?: string | null
          email?: string
          email_unsubscribed?: boolean
          gclid?: string | null
          goal?: string | null
          id?: string
          level?: string | null
          name?: string
          plan_type?: string | null
          schedule?: string | null
          source?: string | null
          status?: string
          timezone?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "leads_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      legacy_import_batches: {
        Row: {
          commit_result: Json | null
          committed_at: string | null
          committed_by: string | null
          created_at: string
          created_by: string | null
          file_sha256: string
          id: string
          legacy_marker: boolean
          month_year_map: Json
          rolled_back_at: string | null
          rolled_back_by: string | null
          source_file: string
          status: string
          summary: Json
        }
        Insert: {
          commit_result?: Json | null
          committed_at?: string | null
          committed_by?: string | null
          created_at?: string
          created_by?: string | null
          file_sha256: string
          id?: string
          legacy_marker?: boolean
          month_year_map?: Json
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          source_file: string
          status?: string
          summary?: Json
        }
        Update: {
          commit_result?: Json | null
          committed_at?: string | null
          committed_by?: string | null
          created_at?: string
          created_by?: string | null
          file_sha256?: string
          id?: string
          legacy_marker?: boolean
          month_year_map?: Json
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          source_file?: string
          status?: string
          summary?: Json
        }
        Relationships: []
      }
      legacy_import_staging: {
        Row: {
          batch_id: string
          entity: string
          legacy_marker: boolean
          payload: Json
          source_key: string
        }
        Insert: {
          batch_id: string
          entity: string
          legacy_marker?: boolean
          payload: Json
          source_key: string
        }
        Update: {
          batch_id?: string
          entity?: string
          legacy_marker?: boolean
          payload?: Json
          source_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_import_staging_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "legacy_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_issues: {
        Row: {
          category: string
          created_at: string
          dedupe_key: string
          id: string
          import_batch_id: string | null
          legacy_marker: boolean
          legacy_student_id: string | null
          month_label: string | null
          problem: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          source_file: string | null
          source_row: number | null
          source_sheet: string | null
          status: string
          student_label: string | null
          suggested_action: string | null
          year: number | null
        }
        Insert: {
          category: string
          created_at?: string
          dedupe_key: string
          id?: string
          import_batch_id?: string | null
          legacy_marker?: boolean
          legacy_student_id?: string | null
          month_label?: string | null
          problem: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_file?: string | null
          source_row?: number | null
          source_sheet?: string | null
          status?: string
          student_label?: string | null
          suggested_action?: string | null
          year?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          import_batch_id?: string | null
          legacy_marker?: boolean
          legacy_student_id?: string | null
          month_label?: string | null
          problem?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_file?: string | null
          source_row?: number | null
          source_sheet?: string | null
          status?: string
          student_label?: string | null
          suggested_action?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "legacy_issues_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "legacy_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_issues_legacy_student_id_fkey"
            columns: ["legacy_student_id"]
            isOneToOne: false
            referencedRelation: "legacy_student_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_issues_legacy_student_id_fkey"
            columns: ["legacy_student_id"]
            isOneToOne: false
            referencedRelation: "legacy_students"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_monthly_records: {
        Row: {
          currency: string
          exclude_reason: string | null
          excluded: boolean
          id: string
          import_batch_id: string | null
          imported_at: string
          late_count: number
          legacy_marker: boolean
          legacy_student_id: string
          month: number | null
          month_label: string
          origin_file: string | null
          origin_row: number | null
          original_student_name: string | null
          present_count: number | null
          price_per_class: number | null
          price_source: string | null
          raw_statuses: string[]
          record_kind: string
          recorded_paid: number | null
          session_charges: number | null
          source_balance: number | null
          source_file: string | null
          source_key: string
          source_row: number | null
          source_session_charges: number | null
          source_sheet: string | null
          source_type: string
          year: number | null
        }
        Insert: {
          currency?: string
          exclude_reason?: string | null
          excluded?: boolean
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          late_count?: number
          legacy_marker?: boolean
          legacy_student_id: string
          month?: number | null
          month_label: string
          origin_file?: string | null
          origin_row?: number | null
          original_student_name?: string | null
          present_count?: number | null
          price_per_class?: number | null
          price_source?: string | null
          raw_statuses?: string[]
          record_kind: string
          recorded_paid?: number | null
          session_charges?: number | null
          source_balance?: number | null
          source_file?: string | null
          source_key: string
          source_row?: number | null
          source_session_charges?: number | null
          source_sheet?: string | null
          source_type?: string
          year?: number | null
        }
        Update: {
          currency?: string
          exclude_reason?: string | null
          excluded?: boolean
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          late_count?: number
          legacy_marker?: boolean
          legacy_student_id?: string
          month?: number | null
          month_label?: string
          origin_file?: string | null
          origin_row?: number | null
          original_student_name?: string | null
          present_count?: number | null
          price_per_class?: number | null
          price_source?: string | null
          raw_statuses?: string[]
          record_kind?: string
          recorded_paid?: number | null
          session_charges?: number | null
          source_balance?: number | null
          source_file?: string | null
          source_key?: string
          source_row?: number | null
          source_session_charges?: number | null
          source_sheet?: string | null
          source_type?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "legacy_monthly_records_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "legacy_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_monthly_records_legacy_student_id_fkey"
            columns: ["legacy_student_id"]
            isOneToOne: false
            referencedRelation: "legacy_student_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_monthly_records_legacy_student_id_fkey"
            columns: ["legacy_student_id"]
            isOneToOne: false
            referencedRelation: "legacy_students"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_students: {
        Row: {
          auth_user_id: string | null
          created_at: string
          display_name: string
          id: string
          import_batch_id: string | null
          imported_at: string
          legacy_marker: boolean
          linked_at: string | null
          linked_by: string | null
          name_key: string
          note: string | null
          original_names: string[]
          original_student_name: string | null
          source_file: string | null
          source_row: number | null
          source_sheet: string | null
          source_type: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          legacy_marker?: boolean
          linked_at?: string | null
          linked_by?: string | null
          name_key: string
          note?: string | null
          original_names?: string[]
          original_student_name?: string | null
          source_file?: string | null
          source_row?: number | null
          source_sheet?: string | null
          source_type?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          legacy_marker?: boolean
          linked_at?: string | null
          linked_by?: string | null
          name_key?: string
          note?: string | null
          original_names?: string[]
          original_student_name?: string | null
          source_file?: string | null
          source_row?: number | null
          source_sheet?: string | null
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_students_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "legacy_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_year_aggregates: {
        Row: {
          counted_sessions: number
          currency: string
          id: string
          import_batch_id: string | null
          imported_at: string
          kind: string
          late_unresolved: number
          legacy_marker: boolean
          legacy_student_id: string
          price_per_session: number | null
          price_source: string
          recorded_paid: number | null
          session_value: number
          source_file: string | null
          source_key: string
          source_row: number | null
          source_sheet: string | null
          source_type: string
          year: number
        }
        Insert: {
          counted_sessions?: number
          currency?: string
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          kind: string
          late_unresolved?: number
          legacy_marker?: boolean
          legacy_student_id: string
          price_per_session?: number | null
          price_source: string
          recorded_paid?: number | null
          session_value?: number
          source_file?: string | null
          source_key: string
          source_row?: number | null
          source_sheet?: string | null
          source_type?: string
          year: number
        }
        Update: {
          counted_sessions?: number
          currency?: string
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          kind?: string
          late_unresolved?: number
          legacy_marker?: boolean
          legacy_student_id?: string
          price_per_session?: number | null
          price_source?: string
          recorded_paid?: number | null
          session_value?: number
          source_file?: string | null
          source_key?: string
          source_row?: number | null
          source_sheet?: string | null
          source_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "legacy_year_aggregates_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "legacy_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_year_aggregates_legacy_student_id_fkey"
            columns: ["legacy_student_id"]
            isOneToOne: false
            referencedRelation: "legacy_student_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_year_aggregates_legacy_student_id_fkey"
            columns: ["legacy_student_id"]
            isOneToOne: false
            referencedRelation: "legacy_students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_dialogues: {
        Row: {
          english: string
          id: string
          korean: string
          lesson_id: number
          romanization: string
          sort_order: number
          speaker: string
        }
        Insert: {
          english: string
          id?: string
          korean: string
          lesson_id: number
          romanization?: string
          sort_order?: number
          speaker: string
        }
        Update: {
          english?: string
          id?: string
          korean?: string
          lesson_id?: number
          romanization?: string
          sort_order?: number
          speaker?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_dialogues_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_exercises: {
        Row: {
          correct_index: number
          explanation: string
          id: string
          lesson_id: number
          options: Json
          question: string
          sort_order: number
        }
        Insert: {
          correct_index?: number
          explanation?: string
          id?: string
          lesson_id: number
          options?: Json
          question: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          explanation?: string
          id?: string
          lesson_id?: number
          options?: Json
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_grammar: {
        Row: {
          examples: Json
          explanation: string
          id: string
          lesson_id: number
          sort_order: number
          structure: string
          title: string
        }
        Insert: {
          examples?: Json
          explanation?: string
          id?: string
          lesson_id: number
          sort_order?: number
          structure?: string
          title: string
        }
        Update: {
          examples?: Json
          explanation?: string
          id?: string
          lesson_id?: number
          sort_order?: number
          structure?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_grammar_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reading: {
        Row: {
          english_text: string
          id: string
          korean_text: string
          lesson_id: number
          sort_order: number
        }
        Insert: {
          english_text?: string
          id?: string
          korean_text: string
          lesson_id: number
          sort_order?: number
        }
        Update: {
          english_text?: string
          id?: string
          korean_text?: string
          lesson_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reading_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_vocabulary: {
        Row: {
          id: string
          image_url: string | null
          korean: string
          lesson_id: number
          meaning: string
          meaning_ar: string | null
          romanization: string
          sort_order: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          korean: string
          lesson_id: number
          meaning: string
          meaning_ar?: string | null
          romanization?: string
          sort_order?: number
        }
        Update: {
          id?: string
          image_url?: string | null
          korean?: string
          lesson_id?: number
          meaning?: string
          meaning_ar?: string | null
          romanization?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_vocabulary_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      level_group_config: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          level: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          level: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          level?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "level_group_config_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_group_config_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "level_group_config_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
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
            foreignKeyName: "level_slot_config_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "level_slot_config_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "level_slot_config_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_slot_config_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "v_matching_slots_status"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          ad_primary_text: string
          campaign_name: string | null
          caption_text: string
          created_at: string
          description: string
          group_id: string | null
          headline: string
          id: string
          image_url_1x1: string | null
          image_url_4x5: string | null
          image_url_story: string | null
          post_order: number | null
          scheduled_date: string | null
          status: string
          video_url: string | null
        }
        Insert: {
          ad_primary_text?: string
          campaign_name?: string | null
          caption_text?: string
          created_at?: string
          description?: string
          group_id?: string | null
          headline?: string
          id?: string
          image_url_1x1?: string | null
          image_url_4x5?: string | null
          image_url_story?: string | null
          post_order?: number | null
          scheduled_date?: string | null
          status?: string
          video_url?: string | null
        }
        Update: {
          ad_primary_text?: string
          campaign_name?: string | null
          caption_text?: string
          created_at?: string
          description?: string
          group_id?: string | null
          headline?: string
          id?: string
          image_url_1x1?: string | null
          image_url_4x5?: string | null
          image_url_story?: string | null
          post_order?: number | null
          scheduled_date?: string | null
          status?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pkg_groups"
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
          package_id: string | null
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
          package_id?: string | null
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
          package_id?: string | null
          status?: string
          time?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_slots_course_level_fkey_course_levels"
            columns: ["course_level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "matching_slots_course_level_fkey_course_levels"
            columns: ["course_level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "matching_slots_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "schedule_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_trial_bookings: {
        Row: {
          created_at: string
          email: string | null
          id: string
          language: string
          name: string
          notes: string | null
          slot_id: string
          status: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          language: string
          name: string
          notes?: string | null
          slot_id: string
          status?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          language?: string
          name?: string
          notes?: string | null
          slot_id?: string
          status?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_trial_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "personal_trial_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_trial_slots: {
        Row: {
          capacity: number
          created_at: string
          duration_min: number
          id: string
          is_active: boolean
          slot_date: string
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          duration_min?: number
          id?: string
          is_active?: boolean
          slot_date: string
          start_time: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          duration_min?: number
          id?: string
          is_active?: boolean
          slot_date?: string
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      pkg_attendance: {
        Row: {
          admin_approved: boolean
          created_at: string
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          admin_approved?: boolean
          created_at?: string
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          admin_approved?: boolean
          created_at?: string
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pkg_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pkg_group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pkg_class_charges: {
        Row: {
          charge_type: string
          created_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          charge_type?: string
          created_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          charge_type?: string
          created_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pkg_class_charges_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pkg_group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pkg_group_members: {
        Row: {
          class_link_sent_at: string | null
          enrollment_id: string | null
          group_id: string
          joined_at: string
          member_status: string
          user_id: string
          welcome_email_sent_at: string | null
        }
        Insert: {
          class_link_sent_at?: string | null
          enrollment_id?: string | null
          group_id: string
          joined_at?: string
          member_status?: string
          user_id: string
          welcome_email_sent_at?: string | null
        }
        Update: {
          class_link_sent_at?: string | null
          enrollment_id?: string | null
          group_id?: string
          joined_at?: string
          member_status?: string
          user_id?: string
          welcome_email_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pkg_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pkg_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      pkg_group_sessions: {
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
            foreignKeyName: "pkg_group_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pkg_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      pkg_groups: {
        Row: {
          book_url: string | null
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          meeting_url: string | null
          min_to_run: number
          name: string
          package_id: string
          start_date: string | null
        }
        Insert: {
          book_url?: string | null
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          meeting_url?: string | null
          min_to_run?: number
          name: string
          package_id: string
          start_date?: string | null
        }
        Update: {
          book_url?: string | null
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          meeting_url?: string | null
          min_to_run?: number
          name?: string
          package_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pkg_groups_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "schedule_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_tests: {
        Row: {
          created_at: string
          id: string
          level: string
          max_score: number | null
          result_email_sent_at: string | null
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          max_score?: number | null
          result_email_sent_at?: string | null
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          max_score?: number | null
          result_email_sent_at?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_tests_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "placement_tests_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string
          course_level_key: string | null
          created_at: string
          credits: number
          email: string
          email_unsubscribed: boolean
          id: string
          language: string | null
          level: string | null
          name: string
          name_reminder_sent_at: string | null
          phone: string | null
          reset_version: string | null
          status: string
          timezone: string | null
          track: string
          unsubscribe_token: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string
          course_level_key?: string | null
          created_at?: string
          credits?: number
          email: string
          email_unsubscribed?: boolean
          id?: string
          language?: string | null
          level?: string | null
          name: string
          name_reminder_sent_at?: string | null
          phone?: string | null
          reset_version?: string | null
          status?: string
          timezone?: string | null
          track?: string
          unsubscribe_token?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string
          course_level_key?: string | null
          created_at?: string
          credits?: number
          email?: string
          email_unsubscribed?: boolean
          id?: string
          language?: string | null
          level?: string | null
          name?: string
          name_reminder_sent_at?: string | null
          phone?: string | null
          reset_version?: string | null
          status?: string
          timezone?: string | null
          track?: string
          unsubscribe_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_course_level_key_fkey_course_levels"
            columns: ["course_level_key"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profiles_course_level_key_fkey_course_levels"
            columns: ["course_level_key"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profiles_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profiles_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          currency: string | null
          description: string | null
          discount_flat: number | null
          discount_pct: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_flat?: number | null
          discount_pct?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_flat?: number | null
          discount_pct?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          clicked_at: string
          id: string
          referrer_user_id: string
          visitor_fingerprint: string
        }
        Insert: {
          clicked_at?: string
          id?: string
          referrer_user_id: string
          visitor_fingerprint: string
        }
        Update: {
          clicked_at?: string
          id?: string
          referrer_user_id?: string
          visitor_fingerprint?: string
        }
        Relationships: []
      }
      referral_conversions: {
        Row: {
          converted_at: string
          id: string
          referred_email: string
          referrer_user_id: string
          xp_awarded: boolean
        }
        Insert: {
          converted_at?: string
          id?: string
          referred_email: string
          referrer_user_id: string
          xp_awarded?: boolean
        }
        Update: {
          converted_at?: string
          id?: string
          referred_email?: string
          referrer_user_id?: string
          xp_awarded?: boolean
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
      schedule_packages: {
        Row: {
          capacity: number
          class_language: string
          course_type: string
          created_at: string
          day_of_week: number
          duration_min: number
          id: string
          is_active: boolean
          level: string
          start_time: string
          timezone: string
        }
        Insert: {
          capacity?: number
          class_language?: string
          course_type?: string
          created_at?: string
          day_of_week: number
          duration_min?: number
          id?: string
          is_active?: boolean
          level: string
          start_time?: string
          timezone?: string
        }
        Update: {
          capacity?: number
          class_language?: string
          course_type?: string
          created_at?: string
          day_of_week?: number
          duration_min?: number
          id?: string
          is_active?: boolean
          level?: string
          start_time?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_packages_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "schedule_packages_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      schedule_resubmission_requests: {
        Row: {
          created_at: string
          email: string
          enrollment_id: string
          expires_at: string
          id: string
          status: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          enrollment_id: string
          expires_at?: string
          id?: string
          status?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          enrollment_id?: string
          expires_at?: string
          id?: string
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_resubmission_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "schedule_resubmission_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "schedule_resubmission_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_social_posts: {
        Row: {
          attempts: number
          caption: string
          course_title: string
          created_at: string
          created_by: string
          group_id: string | null
          id: string
          image_urls: string[] | null
          last_error: string | null
          media_type: string | null
          meta_result: Json | null
          platforms: string[]
          posted_at: string | null
          registration_url: string | null
          scheduled_at: string
          status: string
        }
        Insert: {
          attempts?: number
          caption?: string
          course_title?: string
          created_at?: string
          created_by: string
          group_id?: string | null
          id?: string
          image_urls?: string[] | null
          last_error?: string | null
          media_type?: string | null
          meta_result?: Json | null
          platforms?: string[]
          posted_at?: string | null
          registration_url?: string | null
          scheduled_at: string
          status?: string
        }
        Update: {
          attempts?: number
          caption?: string
          course_title?: string
          created_at?: string
          created_by?: string
          group_id?: string | null
          id?: string
          image_urls?: string[] | null
          last_error?: string | null
          media_type?: string | null
          meta_result?: Json | null
          platforms?: string[]
          posted_at?: string | null
          registration_url?: string | null
          scheduled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_social_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pkg_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_video_cache: {
        Row: {
          fetched_at: string
          id: string
          post_type: string
          query: string
          results: Json
        }
        Insert: {
          fetched_at?: string
          id?: string
          post_type: string
          query: string
          results: Json
        }
        Update: {
          fetched_at?: string
          id?: string
          post_type?: string
          query?: string
          results?: Json
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          created_at: string
          id: string
          type: string | null
        }
        Insert: {
          created_at?: string
          id: string
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          type?: string | null
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      student_bundle_edits: {
        Row: {
          bundle_id: string
          changes: Json
          edited_at: string
          edited_by: string | null
          id: string
          system_actor: string | null
        }
        Insert: {
          bundle_id: string
          changes: Json
          edited_at?: string
          edited_by?: string | null
          id?: string
          system_actor?: string | null
        }
        Update: {
          bundle_id?: string
          changes?: Json
          edited_at?: string
          edited_by?: string | null
          id?: string
          system_actor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_bundle_edits_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "student_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_bundles: {
        Row: {
          catalog_key: string | null
          coverage_start: string
          coverage_start_confirmed_at: string | null
          created_at: string
          currency: string
          id: string
          label: string
          note: string | null
          paid_note: string | null
          paid_on: string | null
          payment_ask_sent_at: string | null
          payment_confirmation_sent_at: string | null
          purchased_on: string
          source: string
          status: string
          student_id: string
          total_classes: number
          total_price: number
          updated_at: string
          voided_at: string | null
          voided_reason: string | null
        }
        Insert: {
          catalog_key?: string | null
          coverage_start: string
          coverage_start_confirmed_at?: string | null
          created_at?: string
          currency: string
          id?: string
          label: string
          note?: string | null
          paid_note?: string | null
          paid_on?: string | null
          payment_ask_sent_at?: string | null
          payment_confirmation_sent_at?: string | null
          purchased_on?: string
          source?: string
          status?: string
          student_id: string
          total_classes: number
          total_price: number
          updated_at?: string
          voided_at?: string | null
          voided_reason?: string | null
        }
        Update: {
          catalog_key?: string | null
          coverage_start?: string
          coverage_start_confirmed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          label?: string
          note?: string | null
          paid_note?: string | null
          paid_on?: string | null
          payment_ask_sent_at?: string | null
          payment_confirmation_sent_at?: string | null
          purchased_on?: string
          source?: string
          status?: string
          student_id?: string
          total_classes?: number
          total_price?: number
          updated_at?: string
          voided_at?: string | null
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_bundles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "teacher_students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_class_sessions: {
        Row: {
          bundle_id: string
          class_id: string | null
          confirmed_at: string | null
          counted: boolean
          created_at: string
          entry_source: string
          id: string
          note: string | null
          outcome: string
          session_date: string
          start_time: string
          student_confirmed_at: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          bundle_id: string
          class_id?: string | null
          confirmed_at?: string | null
          counted?: boolean
          created_at?: string
          entry_source?: string
          id?: string
          note?: string | null
          outcome?: string
          session_date: string
          start_time: string
          student_confirmed_at?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          bundle_id?: string
          class_id?: string | null
          confirmed_at?: string | null
          counted?: boolean
          created_at?: string
          entry_source?: string
          id?: string
          note?: string | null
          outcome?: string
          session_date?: string
          start_time?: string
          student_confirmed_at?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_class_sessions_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "student_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "teacher_student_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "teacher_students"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "student_groups_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_groups_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      student_lesson_progress: {
        Row: {
          chapter_completed: boolean
          completed_at: string | null
          dialogue_done: boolean
          exercises_done: boolean
          grammar_done: boolean
          lesson_id: number
          reading_done: boolean
          user_id: string
          vocab_done: boolean
          writing_done: boolean
        }
        Insert: {
          chapter_completed?: boolean
          completed_at?: string | null
          dialogue_done?: boolean
          exercises_done?: boolean
          grammar_done?: boolean
          lesson_id: number
          reading_done?: boolean
          user_id: string
          vocab_done?: boolean
          writing_done?: boolean
        }
        Update: {
          chapter_completed?: boolean
          completed_at?: string | null
          dialogue_done?: boolean
          exercises_done?: boolean
          grammar_done?: boolean
          lesson_id?: number
          reading_done?: boolean
          user_id?: string
          vocab_done?: boolean
          writing_done?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      student_nps: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_package_preferences: {
        Row: {
          level: string
          package_id: string | null
          preferred_day_of_week: number | null
          preferred_start_time: string | null
          requested_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          level?: string
          package_id?: string | null
          preferred_day_of_week?: number | null
          preferred_start_time?: string | null
          requested_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          level?: string
          package_id?: string | null
          preferred_day_of_week?: number | null
          preferred_start_time?: string | null
          requested_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_package_preferences_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_package_preferences_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_package_preferences_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "schedule_packages"
            referencedColumns: ["id"]
          },
        ]
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
      student_payment_claims: {
        Row: {
          amount: number
          bundle_id: string | null
          created_at: string
          currency: string
          id: string
          method: string
          note: string | null
          paid_on: string
          receipt_path: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_name: string | null
          status: string
          student_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bundle_id?: string | null
          created_at?: string
          currency: string
          id?: string
          method: string
          note?: string | null
          paid_on: string
          receipt_path?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          status?: string
          student_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bundle_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string
          note?: string | null
          paid_on?: string
          receipt_path?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          status?: string
          student_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_payment_claims_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "student_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_payment_claims_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "teacher_students"
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
          {
            foreignKeyName: "student_schedule_preferences_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_schedule_preferences_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
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
            foreignKeyName: "student_slot_preferences_assigned_slot_id_fkey"
            columns: ["assigned_slot_id"]
            isOneToOne: false
            referencedRelation: "v_matching_slots_status"
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
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "student_slot_preferences_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_selected_level_fkey_course_levels"
            columns: ["selected_level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_slot_preferences_selected_level_fkey_course_levels"
            columns: ["selected_level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_1_id_fkey"
            columns: ["slot_1_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_1_id_fkey"
            columns: ["slot_1_id"]
            isOneToOne: false
            referencedRelation: "v_matching_slots_status"
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
            foreignKeyName: "student_slot_preferences_slot_2_id_fkey"
            columns: ["slot_2_id"]
            isOneToOne: false
            referencedRelation: "v_matching_slots_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_3_id_fkey"
            columns: ["slot_3_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_3_id_fkey"
            columns: ["slot_3_id"]
            isOneToOne: false
            referencedRelation: "v_matching_slots_status"
            referencedColumns: ["id"]
          },
        ]
      }
      student_streaks: {
        Row: {
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          streak_14_earned: boolean
          streak_3_earned: boolean
          streak_30_earned: boolean
          streak_7_earned: boolean
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          streak_14_earned?: boolean
          streak_3_earned?: boolean
          streak_30_earned?: boolean
          streak_7_earned?: boolean
          user_id: string
        }
        Update: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          streak_14_earned?: boolean
          streak_3_earned?: boolean
          streak_30_earned?: boolean
          streak_7_earned?: boolean
          user_id?: string
        }
        Relationships: []
      }
      student_xp: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          lesson_id: number | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          lesson_id?: number | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          lesson_id?: number | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_xp_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
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
      teacher_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: string
          is_available: boolean | null
          start_time: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          is_available?: boolean | null
          start_time: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_available?: boolean | null
          start_time?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_availability_exceptions: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string
          exception_date: string
          id: string
          kind: string
          reason: string | null
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time: string
          exception_date: string
          id?: string
          kind: string
          reason?: string | null
          start_time: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string
          exception_date?: string
          id?: string
          kind?: string
          reason?: string | null
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_availability_rules: {
        Row: {
          class_language: string | null
          created_at: string
          effective_from: string
          effective_to: string | null
          end_time: string
          id: string
          kind: string
          note: string | null
          start_time: string
          student_class_id: string | null
          timezone: string
          updated_at: string
          weekday: number
        }
        Insert: {
          class_language?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          end_time: string
          id?: string
          kind: string
          note?: string | null
          start_time: string
          student_class_id?: string | null
          timezone?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          class_language?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          end_time?: string
          id?: string
          kind?: string
          note?: string | null
          start_time?: string
          student_class_id?: string | null
          timezone?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_rules_student_class_id_fkey"
            columns: ["student_class_id"]
            isOneToOne: false
            referencedRelation: "teacher_student_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_applications: {
        Row: {
          admin_notes: string | null
          course_levels: string[]
          created_at: string
          created_teacher_id: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
          years_experience: string | null
        }
        Insert: {
          admin_notes?: string | null
          course_levels?: string[]
          created_at?: string
          created_teacher_id?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          years_experience?: string | null
        }
        Update: {
          admin_notes?: string | null
          course_levels?: string[]
          created_at?: string
          created_teacher_id?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_applications_created_teacher_id_fkey"
            columns: ["created_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_course_progress: {
        Row: {
          course_level_key: string
          created_at: string
          id: string
          notes: string | null
          ready_at: string | null
          started_at: string | null
          status: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          course_level_key: string
          created_at?: string
          id?: string
          notes?: string | null
          ready_at?: string | null
          started_at?: string | null
          status?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          course_level_key?: string
          created_at?: string
          id?: string
          notes?: string | null
          ready_at?: string | null
          started_at?: string | null
          status?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_course_progress_course_level_key_fkey"
            columns: ["course_level_key"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "teacher_course_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          course_level_key: string
          created_at: string
          id: string
          is_done: boolean
          notes: string | null
          step_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          course_level_key?: string
          created_at?: string
          id?: string
          is_done?: boolean
          notes?: string | null
          step_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          course_level_key?: string
          created_at?: string
          id?: string
          is_done?: boolean
          notes?: string | null
          step_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_onboarding_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "teacher_onboarding_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_onboarding_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_onboarding_steps: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean
          key: string
          scope: string
          sort_order: number
          title_ar: string
          title_en: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean
          key: string
          scope?: string
          sort_order?: number
          title_ar: string
          title_en: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean
          key?: string
          scope?: string
          sort_order?: number
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      teacher_schedule_slots: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          label: string | null
          notes: string | null
          slot_date: string
          source: string
          start_time: string
          status: string
          student_id: string | null
          teacher_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          label?: string | null
          notes?: string | null
          slot_date: string
          source?: string
          start_time: string
          status?: string
          student_id?: string | null
          teacher_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          label?: string | null
          notes?: string | null
          slot_date?: string
          source?: string
          start_time?: string
          status?: string
          student_id?: string | null
          teacher_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_student_classes: {
        Row: {
          created_at: string
          duration_minutes: number
          effective_from: string
          effective_to: string | null
          id: string
          note: string | null
          start_time: string
          student_id: string
          timezone: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          effective_from?: string
          effective_to?: string | null
          id?: string
          note?: string | null
          start_time: string
          student_id: string
          timezone?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          effective_from?: string
          effective_to?: string | null
          id?: string
          note?: string | null
          start_time?: string
          student_id?: string
          timezone?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_student_classes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "teacher_students"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_students: {
        Row: {
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          full_name: string
          id: string
          meeting_url: string | null
          note: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          full_name: string
          id?: string
          meeting_url?: string | null
          note?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          full_name?: string
          id?: string
          meeting_url?: string | null
          note?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      telegram_links: {
        Row: {
          chat_id: number | null
          created_at: string
          id: string
          link_code: string
          linked_at: string | null
          teacher_student_id: string | null
          tg_first_name: string | null
          tg_username: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          chat_id?: number | null
          created_at?: string
          id?: string
          link_code?: string
          linked_at?: string | null
          teacher_student_id?: string | null
          tg_first_name?: string | null
          tg_username?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          id?: string
          link_code?: string
          linked_at?: string | null
          teacher_student_id?: string | null
          tg_first_name?: string | null
          tg_username?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_links_teacher_student_id_fkey"
            columns: ["teacher_student_id"]
            isOneToOne: true
            referencedRelation: "teacher_students"
            referencedColumns: ["id"]
          },
        ]
      }
      textbook_lessons: {
        Row: {
          book: string
          created_at: string
          description: string
          description_ar: string
          emoji: string
          id: number
          is_published: boolean
          scene_image_url: string | null
          sort_order: number
          title_ar: string
          title_en: string
          title_ko: string
          topik_level: number
        }
        Insert: {
          book?: string
          created_at?: string
          description?: string
          description_ar?: string
          emoji?: string
          id?: number
          is_published?: boolean
          scene_image_url?: string | null
          sort_order?: number
          title_ar?: string
          title_en: string
          title_ko: string
          topik_level?: number
        }
        Update: {
          book?: string
          created_at?: string
          description?: string
          description_ar?: string
          emoji?: string
          id?: number
          is_published?: boolean
          scene_image_url?: string | null
          sort_order?: number
          title_ar?: string
          title_en?: string
          title_ko?: string
          topik_level?: number
        }
        Relationships: []
      }
      training_starred: {
        Row: {
          collections: Json
          id: string
          starred: number[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collections?: Json
          id?: string
          starred?: number[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collections?: Json
          id?: string
          starred?: number[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trial_attendance_confirmations: {
        Row: {
          confirmed_at: string
          confirmed_by: string | null
          start_time: string
          trial_date: string
        }
        Insert: {
          confirmed_at?: string
          confirmed_by?: string | null
          start_time: string
          trial_date: string
        }
        Update: {
          confirmed_at?: string
          confirmed_by?: string | null
          start_time?: string
          trial_date?: string
        }
        Relationships: []
      }
      trial_booking_status_transitions: {
        Row: {
          from_status: string
          note: string | null
          to_status: string
        }
        Insert: {
          from_status: string
          note?: string | null
          to_status: string
        }
        Update: {
          from_status?: string
          note?: string | null
          to_status?: string
        }
        Relationships: []
      }
      trial_bookings: {
        Row: {
          attendance_confirmed_at: string | null
          attendance_email_sent_at: string | null
          attendance_followup_manual_at: string | null
          attendance_marked_at: string | null
          attendance_marked_by: string | null
          attendance_responded_at: string | null
          attendance_response: string | null
          attended: boolean | null
          attended_letter_sent_at: string | null
          calendar_url: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          changed_at: string | null
          choice_confirmation_sent_at: string | null
          class_language: string
          confirmation_email_failed_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          day_of_week: number
          duration_min: number
          email: string
          email_opened_at: string | null
          email_sent_at: string | null
          email_verified_at: string | null
          followup_day1_sent_at: string | null
          followup_day3_sent_at: string | null
          followup_day7_sent_at: string | null
          followup_prep_sent_at: string | null
          goal: string | null
          guide_sent_at: string | null
          id: string
          is_tba: boolean
          level: string | null
          link_update_sent_at: string | null
          meeting_url: string | null
          name: string
          next_trial_month: string | null
          phone: string | null
          rebook_email_sent_at: string | null
          reminder_sent_at: string | null
          rollover_notified_at: string | null
          rollover_status: string | null
          slot_chosen_at: string | null
          slot_id: string | null
          slot_range: unknown
          start_time: string | null
          starts_at: string | null
          status: string | null
          student_timezone: string | null
          timezone: string | null
          trial_date: string | null
          trial_days: number | null
          user_id: string | null
        }
        Insert: {
          attendance_confirmed_at?: string | null
          attendance_email_sent_at?: string | null
          attendance_followup_manual_at?: string | null
          attendance_marked_at?: string | null
          attendance_marked_by?: string | null
          attendance_responded_at?: string | null
          attendance_response?: string | null
          attended?: boolean | null
          attended_letter_sent_at?: string | null
          calendar_url?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          changed_at?: string | null
          choice_confirmation_sent_at?: string | null
          class_language?: string
          confirmation_email_failed_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          day_of_week: number
          duration_min?: number
          email: string
          email_opened_at?: string | null
          email_sent_at?: string | null
          email_verified_at?: string | null
          followup_day1_sent_at?: string | null
          followup_day3_sent_at?: string | null
          followup_day7_sent_at?: string | null
          followup_prep_sent_at?: string | null
          goal?: string | null
          guide_sent_at?: string | null
          id?: string
          is_tba?: boolean
          level?: string | null
          link_update_sent_at?: string | null
          meeting_url?: string | null
          name: string
          next_trial_month?: string | null
          phone?: string | null
          rebook_email_sent_at?: string | null
          reminder_sent_at?: string | null
          rollover_notified_at?: string | null
          rollover_status?: string | null
          slot_chosen_at?: string | null
          slot_id?: string | null
          slot_range?: unknown
          start_time?: string | null
          starts_at?: string | null
          status?: string | null
          student_timezone?: string | null
          timezone?: string | null
          trial_date?: string | null
          trial_days?: number | null
          user_id?: string | null
        }
        Update: {
          attendance_confirmed_at?: string | null
          attendance_email_sent_at?: string | null
          attendance_followup_manual_at?: string | null
          attendance_marked_at?: string | null
          attendance_marked_by?: string | null
          attendance_responded_at?: string | null
          attendance_response?: string | null
          attended?: boolean | null
          attended_letter_sent_at?: string | null
          calendar_url?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          changed_at?: string | null
          choice_confirmation_sent_at?: string | null
          class_language?: string
          confirmation_email_failed_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          day_of_week?: number
          duration_min?: number
          email?: string
          email_opened_at?: string | null
          email_sent_at?: string | null
          email_verified_at?: string | null
          followup_day1_sent_at?: string | null
          followup_day3_sent_at?: string | null
          followup_day7_sent_at?: string | null
          followup_prep_sent_at?: string | null
          goal?: string | null
          guide_sent_at?: string | null
          id?: string
          is_tba?: boolean
          level?: string | null
          link_update_sent_at?: string | null
          meeting_url?: string | null
          name?: string
          next_trial_month?: string | null
          phone?: string | null
          rebook_email_sent_at?: string | null
          reminder_sent_at?: string | null
          rollover_notified_at?: string | null
          rollover_status?: string | null
          slot_chosen_at?: string | null
          slot_id?: string | null
          slot_range?: unknown
          start_time?: string | null
          starts_at?: string | null
          status?: string | null
          student_timezone?: string | null
          timezone?: string | null
          trial_date?: string | null
          trial_days?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_bookings_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "trial_bookings_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "trial_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "trial_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "v_trial_bookings_admin"
            referencedColumns: ["slot_id"]
          },
          {
            foreignKeyName: "trial_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "v_trial_slots_admin"
            referencedColumns: ["slot_id"]
          },
        ]
      }
      trial_broadcasts: {
        Row: {
          broadcast_key: string
          created_at: string
          error_count: number
          id: string
          sent_count: number
          triggered_by: string | null
        }
        Insert: {
          broadcast_key: string
          created_at?: string
          error_count?: number
          id?: string
          sent_count?: number
          triggered_by?: string | null
        }
        Update: {
          broadcast_key?: string
          created_at?: string
          error_count?: number
          id?: string
          sent_count?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      trial_invite_sends: {
        Row: {
          attendance_responded_at: string | null
          attendance_response: string | null
          campaign: string
          email: string
          email_opened_at: string | null
          id: string
          name: string | null
          sent_at: string
          source: string
        }
        Insert: {
          attendance_responded_at?: string | null
          attendance_response?: string | null
          campaign?: string
          email: string
          email_opened_at?: string | null
          id?: string
          name?: string | null
          sent_at?: string
          source: string
        }
        Update: {
          attendance_responded_at?: string | null
          attendance_response?: string | null
          campaign?: string
          email?: string
          email_opened_at?: string | null
          id?: string
          name?: string | null
          sent_at?: string
          source?: string
        }
        Relationships: []
      }
      trial_rate_limits: {
        Row: {
          action: string
          attempt_count: number
          id: string
          identifier: string
          last_attempt: string
          window_start: string
        }
        Insert: {
          action?: string
          attempt_count?: number
          id?: string
          identifier: string
          last_attempt?: string
          window_start: string
        }
        Update: {
          action?: string
          attempt_count?: number
          id?: string
          identifier?: string
          last_attempt?: string
          window_start?: string
        }
        Relationships: []
      }
      trial_rebook_resend_log: {
        Row: {
          batch: string
          booking_id: string
          cleared_at: string
          id: number
          previous_sent_at: string
        }
        Insert: {
          batch: string
          booking_id: string
          cleared_at?: string
          id?: number
          previous_sent_at: string
        }
        Update: {
          batch?: string
          booking_id?: string
          cleared_at?: string
          id?: number
          previous_sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_rebook_resend_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "trial_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_rebook_resend_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_trial_bookings_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_rooms: {
        Row: {
          calendar_event_id: string | null
          class_language: string | null
          created_at: string
          day_of_week: number | null
          id: string
          is_spare: boolean
          label: string
          meeting_url: string
        }
        Insert: {
          calendar_event_id?: string | null
          class_language?: string | null
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_spare?: boolean
          label: string
          meeting_url: string
        }
        Update: {
          calendar_event_id?: string | null
          class_language?: string | null
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_spare?: boolean
          label?: string
          meeting_url?: string
        }
        Relationships: []
      }
      trial_settings: {
        Row: {
          booking_lead_minutes: number
          buffer_minutes: number
          default_duration_min: number
          id: number
          max_horizon_days: number
          min_group_size: number
          program_start_date: string | null
          rejoin_cooldown_days: number
          rollover_interval_days: number
          rollover_lead_hours: number
          rollover_mode: string
          slot_minutes: number
          suggestion_weeks: number
          trial_block_days: number
          trial_block_start_dow: number
          trial_weekdays: number[]
          updated_at: string
          window_end_day: number | null
          window_start_day: number | null
        }
        Insert: {
          booking_lead_minutes?: number
          buffer_minutes?: number
          default_duration_min?: number
          id?: number
          max_horizon_days?: number
          min_group_size?: number
          program_start_date?: string | null
          rejoin_cooldown_days?: number
          rollover_interval_days?: number
          rollover_lead_hours?: number
          rollover_mode?: string
          slot_minutes?: number
          suggestion_weeks?: number
          trial_block_days?: number
          trial_block_start_dow?: number
          trial_weekdays?: number[]
          updated_at?: string
          window_end_day?: number | null
          window_start_day?: number | null
        }
        Update: {
          booking_lead_minutes?: number
          buffer_minutes?: number
          default_duration_min?: number
          id?: number
          max_horizon_days?: number
          min_group_size?: number
          program_start_date?: string | null
          rejoin_cooldown_days?: number
          rollover_interval_days?: number
          rollover_lead_hours?: number
          rollover_mode?: string
          slot_minutes?: number
          suggestion_weeks?: number
          trial_block_days?: number
          trial_block_start_dow?: number
          trial_weekdays?: number[]
          updated_at?: string
          window_end_day?: number | null
          window_start_day?: number | null
        }
        Relationships: []
      }
      trial_slot_proposals: {
        Row: {
          capacity: number
          class_language: string
          created_at: string
          created_slot_id: string | null
          day_of_week: number
          decided_at: string | null
          decided_by: string | null
          duration_min: number
          id: string
          min_to_run: number | null
          reason: string
          start_time: string
          status: string
          timezone: string
          trial_date: string
        }
        Insert: {
          capacity: number
          class_language: string
          created_at?: string
          created_slot_id?: string | null
          day_of_week: number
          decided_at?: string | null
          decided_by?: string | null
          duration_min: number
          id?: string
          min_to_run?: number | null
          reason: string
          start_time: string
          status?: string
          timezone: string
          trial_date: string
        }
        Update: {
          capacity?: number
          class_language?: string
          created_at?: string
          created_slot_id?: string | null
          day_of_week?: number
          decided_at?: string | null
          decided_by?: string | null
          duration_min?: number
          id?: string
          min_to_run?: number | null
          reason?: string
          start_time?: string
          status?: string
          timezone?: string
          trial_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_slot_proposals_created_slot_id_fkey"
            columns: ["created_slot_id"]
            isOneToOne: false
            referencedRelation: "trial_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_slot_proposals_created_slot_id_fkey"
            columns: ["created_slot_id"]
            isOneToOne: false
            referencedRelation: "v_trial_bookings_admin"
            referencedColumns: ["slot_id"]
          },
          {
            foreignKeyName: "trial_slot_proposals_created_slot_id_fkey"
            columns: ["created_slot_id"]
            isOneToOne: false
            referencedRelation: "v_trial_slots_admin"
            referencedColumns: ["slot_id"]
          },
        ]
      }
      trial_slot_skips: {
        Row: {
          created_at: string
          created_by: string | null
          reason: string | null
          skip_date: string
          slot_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          reason?: string | null
          skip_date: string
          slot_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          reason?: string | null
          skip_date?: string
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_slot_skips_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "trial_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_slot_skips_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "v_trial_bookings_admin"
            referencedColumns: ["slot_id"]
          },
          {
            foreignKeyName: "trial_slot_skips_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "v_trial_slots_admin"
            referencedColumns: ["slot_id"]
          },
        ]
      }
      trial_slots: {
        Row: {
          archived_at: string | null
          capacity: number
          class_language: string | null
          created_at: string
          day_of_week: number
          duration_min: number
          enrollment_alert_sent_at: string | null
          id: string
          is_active: boolean
          lifecycle: string
          meeting_url: string | null
          min_run_checked_at: string | null
          min_to_run: number | null
          notes: string | null
          rollover_skip_reason: string | null
          rollover_skipped_at: string | null
          session_period: string | null
          start_time: string
          timezone: string
          trial_date: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          capacity?: number
          class_language?: string | null
          created_at?: string
          day_of_week: number
          duration_min?: number
          enrollment_alert_sent_at?: string | null
          id?: string
          is_active?: boolean
          lifecycle?: string
          meeting_url?: string | null
          min_run_checked_at?: string | null
          min_to_run?: number | null
          notes?: string | null
          rollover_skip_reason?: string | null
          rollover_skipped_at?: string | null
          session_period?: string | null
          start_time: string
          timezone?: string
          trial_date?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          capacity?: number
          class_language?: string | null
          created_at?: string
          day_of_week?: number
          duration_min?: number
          enrollment_alert_sent_at?: string | null
          id?: string
          is_active?: boolean
          lifecycle?: string
          meeting_url?: string | null
          min_run_checked_at?: string | null
          min_to_run?: number | null
          notes?: string | null
          rollover_skip_reason?: string | null
          rollover_skipped_at?: string | null
          session_period?: string | null
          start_time?: string
          timezone?: string
          trial_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      unit_placement_tests: {
        Row: {
          answers: Json
          book: string
          created_at: string
          duration_seconds: number | null
          failed_section: string | null
          id: string
          mcq_score: number
          reviewed_at: string | null
          reviewed_by: string | null
          section_scores: Json
          speaking_audio: Json
          speaking_score: number | null
          start_unit: string
          suggested_level_key: string | null
          teacher_notes: string | null
          user_id: string
          writing: Json
          writing_score: number | null
        }
        Insert: {
          answers?: Json
          book?: string
          created_at?: string
          duration_seconds?: number | null
          failed_section?: string | null
          id?: string
          mcq_score: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          section_scores?: Json
          speaking_audio?: Json
          speaking_score?: number | null
          start_unit: string
          suggested_level_key?: string | null
          teacher_notes?: string | null
          user_id: string
          writing?: Json
          writing_score?: number | null
        }
        Update: {
          answers?: Json
          book?: string
          created_at?: string
          duration_seconds?: number | null
          failed_section?: string | null
          id?: string
          mcq_score?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          section_scores?: Json
          speaking_audio?: Json
          speaking_score?: number | null
          start_unit?: string
          suggested_level_key?: string | null
          teacher_notes?: string | null
          user_id?: string
          writing?: Json
          writing_score?: number | null
        }
        Relationships: []
      }
      user_learning_goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          goal_name: string
          goal_type: string
          id: string
          status: string | null
          target_date: string | null
          target_value: number
          time_period: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          goal_name: string
          goal_type: string
          id?: string
          status?: string | null
          target_date?: string | null
          target_value: number
          time_period: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          goal_name?: string
          goal_type?: string
          id?: string
          status?: string | null
          target_date?: string | null
          target_value?: number
          time_period?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_learning_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_learning_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      vocabulary_review_history: {
        Row: {
          created_at: string
          difficulty_factor: number
          id: number
          interval_days: number
          last_reviewed_at: string | null
          lesson_vocabulary_id: string
          next_review_date: string
          quality_last_review: number | null
          review_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_factor?: number
          id?: number
          interval_days?: number
          last_reviewed_at?: string | null
          lesson_vocabulary_id: string
          next_review_date?: string
          quality_last_review?: number | null
          review_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_factor?: number
          id?: number
          interval_days?: number
          last_reviewed_at?: string | null
          lesson_vocabulary_id?: string
          next_review_date?: string
          quality_last_review?: number | null
          review_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_review_history_lesson_vocabulary_id_fkey"
            columns: ["lesson_vocabulary_id"]
            isOneToOne: false
            referencedRelation: "lesson_vocabulary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_review_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_review_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_review_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      active_course_levels: {
        Row: {
          display_label: string | null
          key: string | null
          sort_order: number | null
        }
        Insert: {
          display_label?: string | null
          key?: string | null
          sort_order?: number | null
        }
        Update: {
          display_label?: string | null
          key?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      admin_funnel_overview: {
        Row: {
          derived_status: string | null
          email: string | null
          name: string | null
          private_only: boolean | null
          user_id: string | null
        }
        Relationships: []
      }
      admin_student_overview: {
        Row: {
          amount: number | null
          amount_due: number | null
          approval_status: string | null
          country: string | null
          created_at: string | null
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
          remaining_balance: number | null
          sessions_remaining: number | null
          sessions_total: number | null
          source_label: string | null
          unit_price: number | null
          user_id: string | null
        }
        Relationships: []
      }
      admin_student_status_overview: {
        Row: {
          active_enrollment_id: string | null
          amount: number | null
          approval_status: string | null
          classes_included: number | null
          computed_status: string | null
          country: string | null
          currency: string | null
          duration: number | null
          email: string | null
          enrollment_created_at: string | null
          enrollment_status: string | null
          level: string | null
          matched_at: string | null
          name: string | null
          package_id: string | null
          payment_status: string | null
          plan_type: string | null
          profile_created_at: string | null
          profile_level: string | null
          sessions_remaining: number | null
          sessions_total: number | null
          slot_id: string | null
          unit_price: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_level_fkey_course_levels"
            columns: ["profile_level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profiles_level_fkey_course_levels"
            columns: ["profile_level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      checkout_recovery_kpi: {
        Row: {
          click_rate_pct: number | null
          leads_clicked: number | null
          leads_converted: number | null
          leads_emailed: number | null
          leads_opened: number | null
          open_rate_pct: number | null
          recovery_rate_pct: number | null
          total_sent: number | null
        }
        Relationships: []
      }
      checkout_recovery_tracker: {
        Row: {
          converted_at: string | null
          email: string | null
          emails_sent: number | null
          last_clicked_at: string | null
          last_opened_at: string | null
          last_sent_at: string | null
          last_stage_sent: number | null
          lead_created_at: string | null
          lead_id: string | null
          name: string | null
          plan_type: string | null
          unsubscribed: boolean | null
        }
        Relationships: []
      }
      lead_funnel: {
        Row: {
          booked_trial: boolean | null
          clicked_free_trial: boolean | null
          clicked_whatsapp: boolean | null
          enrolled_paid: boolean | null
          entry_page: string | null
          event_count: number | null
          first_referrer: string | null
          first_seen: string | null
          first_source: string | null
          first_utm_campaign: string | null
          first_utm_medium: string | null
          first_utm_source: string | null
          last_seen: string | null
          last_source: string | null
          session_id: string | null
          signup_completed: boolean | null
          started_placement: boolean | null
          touchpoints: string[] | null
          user_id: string | null
          viewed_pricing_cta: boolean | null
        }
        Relationships: []
      }
      legacy_facts: {
        Row: {
          late: number | null
          legacy_student_id: string | null
          origin: string | null
          paid: number | null
          sessions: number | null
          value: number | null
          year: number | null
        }
        Relationships: []
      }
      legacy_student_summary: {
        Row: {
          auth_user_id: string | null
          display_name: string | null
          historical_value: number | null
          id: string | null
          late_unresolved: number | null
          linked_at: string | null
          linked_email: string | null
          linked_name: string | null
          name_key: string | null
          open_issues: number | null
          original_names: string[] | null
          recorded_paid: number | null
          sessions_2022: number | null
          sessions_2023: number | null
          sessions_2024: number | null
          sessions_2025: number | null
          total_sessions: number | null
          years_active: number[] | null
        }
        Relationships: []
      }
      legacy_year_summary: {
        Row: {
          counted_sessions: number | null
          historical_value: number | null
          late_unresolved: number | null
          recorded_paid: number | null
          unique_students: number | null
          unresolved_records: number | null
          year: number | null
        }
        Relationships: []
      }
      v_campaign_delivery: {
        Row: {
          bounced: number | null
          campaign_id: string | null
          complained: number | null
          created_at: string | null
          delivered: number | null
          failed: number | null
          handed_over: number | null
          name: string | null
          recipients: number | null
          skipped: number | null
          subject: string | null
          untrackable: number | null
        }
        Relationships: []
      }
      v_matching_slots_status: {
        Row: {
          course_level: string | null
          created_at: string | null
          current_count: number | null
          day: string | null
          id: string | null
          max_students: number | null
          min_students: number | null
          package_id: string | null
          slot_state: string | null
          status: string | null
          time: string | null
          timezone: string | null
        }
        Insert: {
          course_level?: string | null
          created_at?: string | null
          current_count?: number | null
          day?: string | null
          id?: string | null
          max_students?: number | null
          min_students?: number | null
          package_id?: string | null
          slot_state?: never
          status?: string | null
          time?: string | null
          timezone?: string | null
        }
        Update: {
          course_level?: string | null
          created_at?: string | null
          current_count?: number | null
          day?: string | null
          id?: string | null
          max_students?: number | null
          min_students?: number | null
          package_id?: string | null
          slot_state?: never
          status?: string | null
          time?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_slots_course_level_fkey_course_levels"
            columns: ["course_level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "matching_slots_course_level_fkey_course_levels"
            columns: ["course_level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "matching_slots_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "schedule_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      v_teacher_schedule_admin: {
        Row: {
          created_at: string | null
          created_by: string | null
          day_name: string | null
          day_of_week: number | null
          duration_minutes: number | null
          end_time: string | null
          ends_at: string | null
          id: string | null
          is_past: boolean | null
          label: string | null
          notes: string | null
          slot_date: string | null
          source: string | null
          start_time: string | null
          starts_at: string | null
          status: string | null
          student_email: string | null
          student_id: string | null
          student_name: string | null
          teacher_id: string | null
          timezone: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_trial_bookings_admin: {
        Row: {
          attendance_responded_at: string | null
          attendance_response: string | null
          class_language: string | null
          confirmed_at: string | null
          created_at: string | null
          day_name: string | null
          day_of_week: number | null
          email: string | null
          email_opened_at: string | null
          email_sent_at: string | null
          goal: string | null
          id: string | null
          is_tba: boolean | null
          level: string | null
          name: string | null
          next_trial_month: string | null
          phone: string | null
          program_phase: string | null
          rollover_notified_at: string | null
          rollover_status: string | null
          slot_capacity: number | null
          slot_duration_min: number | null
          slot_exists: boolean | null
          slot_id: string | null
          slot_is_active: boolean | null
          slot_lifecycle: string | null
          start_time: string | null
          status: string | null
          time_bucket: string | null
          timezone: string | null
          trial_date: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_bookings_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "trial_bookings_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      v_trial_slot_fill_rate: {
        Row: {
          booked_count: number | null
          capacity: number | null
          day_of_week: number | null
          fill_pct: number | null
          near_capacity: boolean | null
          next_trial_date: string | null
          start_time: string | null
        }
        Relationships: []
      }
      v_trial_slots_admin: {
        Row: {
          booked_count: number | null
          capacity: number | null
          class_language: string | null
          day_name: string | null
          day_of_week: number | null
          duration_min: number | null
          is_active: boolean | null
          is_full: boolean | null
          lifecycle: string | null
          meeting_url: string | null
          min_to_run: number | null
          occurrence_date: string | null
          seats_left: number | null
          session_period: string | null
          slot_id: string | null
          start_time: string | null
          timezone: string | null
        }
        Relationships: []
      }
      xp_leaderboard: {
        Row: {
          avatar_url: string | null
          name: string | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _trial_time_to_minutes: { Args: { t: string }; Returns: number }
      activate_pkg_group: {
        Args: { _group_id: string; _start_date?: string }
        Returns: Json
      }
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
      admin_confirm_student_into_group: {
        Args: { _package_id: string; _user_id: string }
        Returns: Json
      }
      admin_manual_enroll: {
        Args: {
          p_amount: number
          p_classes_included: number
          p_currency: string
          p_duration: number
          p_group_id?: string
          p_level?: string
          p_plan_type: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_remove_attendance: {
        Args: { p_enrollment_id: string; p_session_date: string }
        Returns: number
      }
      admin_review_payment_claim: {
        Args: { p_approve: boolean; p_claim_id: string; p_note?: string }
        Returns: undefined
      }
      admin_send_bundle_payment_ask: {
        Args: { p_bundle_id: string }
        Returns: undefined
      }
      admin_telegram_link_code: {
        Args: { p_teacher_student_id?: string; p_user_id?: string }
        Returns: {
          chat_id: number
          link_code: string
          linked_at: string
          tg_username: string
        }[]
      }
      advance_trial_slots: {
        Args: never
        Returns: {
          advanced_count: number
          details: Json
          skipped_count: number
        }[]
      }
      approve_attendance_request: {
        Args: { _request_id: string }
        Returns: number
      }
      approve_enrollment: {
        Args: {
          _admin_id: string
          _enrollment_id: string
          _unit_price?: number
        }
        Returns: undefined
      }
      approve_group_attendance: {
        Args: { _attendance_id: string }
        Returns: undefined
      }
      assign_student_to_group: {
        Args: { _enrollment_id?: string; _package_id: string; _user_id: string }
        Returns: Json
      }
      assign_student_to_group_from_slot: {
        Args: { _enrollment_id?: string; _slot_id: string; _user_id: string }
        Returns: Json
      }
      assign_student_to_pkg_group: {
        Args: { _enrollment_id: string; _user_id: string }
        Returns: string
      }
      attach_session_to_user: {
        Args: { p_session: string }
        Returns: undefined
      }
      auto_match_student: { Args: { _preference_id: string }; Returns: string }
      auto_send_profile_reminders: { Args: never; Returns: undefined }
      award_game_xp: {
        Args: { p_game_id: string; p_score: number }
        Returns: {
          awarded: number
          total_today: number
        }[]
      }
      backfill_missing_enrollments: { Args: never; Returns: Json }
      book_personal_trial_slot: {
        Args: {
          p_email: string
          p_language: string
          p_name: string
          p_notes: string
          p_slot_id: string
          p_whatsapp: string
        }
        Returns: string
      }
      book_trial_with_capacity_check: {
        Args: {
          p_day_of_week: number
          p_email: string
          p_goal: string
          p_level: string
          p_name: string
          p_phone: string
          p_start_time: string
          p_timezone: string
          p_trial_date: string
          p_user_id?: string
        }
        Returns: string
      }
      can_manage_teacher_schedule: {
        Args: { p_teacher_id: string }
        Returns: boolean
      }
      cancel_enrollment: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
      check_cron_health: { Args: never; Returns: Json }
      check_email_send_claims: { Args: never; Returns: number }
      check_trial_cron_health: { Args: never; Returns: undefined }
      claim_email_sends: {
        Args: { p_campaign_id: string; p_limit: number }
        Returns: {
          attempts: number
          bounced_at: string | null
          campaign_id: string
          claimed_at: string | null
          complained_at: string | null
          created_at: string
          delivered_at: string | null
          email: string
          error: string | null
          id: string
          resend_id: string | null
          sent_at: string | null
          status: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "email_sends"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_trial_capacity_alert: {
        Args: { p_start_time: string; p_trial_date: string }
        Returns: {
          capacity: number
          class_language: string
          confirmed_count: number
          day_of_week: number
          fourth_email: string
          fourth_name: string
          should_send: boolean
          timezone: string
        }[]
      }
      claim_trial_min_run_check: {
        Args: { p_start_time: string; p_trial_date: string }
        Returns: {
          affected_bookings: number
          confirmed_count: number
          min_required: number
          should_rollover: boolean
        }[]
      }
      cleanup_pkg_groups: { Args: never; Returns: Json }
      complete_schedule_resubmission: {
        Args: {
          _level: string
          _package_id: string
          _preferred_day: string
          _preferred_time: string
          _timezone: string
          _token: string
        }
        Returns: undefined
      }
      create_egypt_order: {
        Args: { _duration: number; _plan_type: string }
        Returns: string
      }
      deduct_credit: { Args: { _user_id: string }; Returns: number }
      ensure_pkg_groups_for_packages: { Args: never; Returns: number }
      factory_reset_data: { Args: never; Returns: string }
      first_dow_of_month: {
        Args: { p_any_date: string; p_dow: number }
        Returns: string
      }
      fn_add_teacher_slot: {
        Args: {
          p_duration_minutes?: number
          p_end_time?: string
          p_label?: string
          p_notes?: string
          p_slot_date: string
          p_start_time: string
          p_status?: string
          p_student_id?: string
          p_teacher_id?: string
          p_timezone?: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          label: string | null
          notes: string | null
          slot_date: string
          source: string
          start_time: string
          status: string
          student_id: string | null
          teacher_id: string
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "teacher_schedule_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_add_teacher_slots_bulk: {
        Args: {
          p_duration_minutes?: number
          p_from: string
          p_label?: string
          p_skip_conflicts?: boolean
          p_start_times: string[]
          p_status?: string
          p_teacher_id?: string
          p_timezone?: string
          p_to: string
          p_weekdays: number[]
        }
        Returns: Json
      }
      fn_alert_unconfirmed_sessions: { Args: never; Returns: number }
      fn_approve_trial_slot_proposal: {
        Args: { p_id: string; p_meeting_url?: string }
        Returns: string
      }
      fn_class_reminders_due: {
        Args: never
        Returns: {
          duration_min: number
          email: string
          email_unsubscribed: boolean
          group_name: string
          language: string
          level: string
          meeting_url: string
          name: string
          session_date: string
          session_id: string
          start_time: string
          timezone: string
          unsubscribe_token: string
          user_id: string
        }[]
      }
      fn_clear_teacher_slots: {
        Args: {
          p_from: string
          p_status?: string
          p_teacher_id?: string
          p_to: string
        }
        Returns: number
      }
      fn_create_trial_slot: {
        Args: {
          p_capacity?: number
          p_day_of_week: number
          p_duration_min?: number
          p_start_time: string
          p_timezone?: string
        }
        Returns: {
          archived_at: string | null
          capacity: number
          class_language: string | null
          created_at: string
          day_of_week: number
          duration_min: number
          enrollment_alert_sent_at: string | null
          id: string
          is_active: boolean
          lifecycle: string
          meeting_url: string | null
          min_run_checked_at: string | null
          min_to_run: number | null
          notes: string | null
          rollover_skip_reason: string | null
          rollover_skipped_at: string | null
          session_period: string | null
          start_time: string
          timezone: string
          trial_date: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trial_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_decline_trial_slot_proposal: {
        Args: { p_id: string }
        Returns: undefined
      }
      fn_delete_teacher_slot: { Args: { p_slot_id: string }; Returns: boolean }
      fn_first_trial_block_date: { Args: { p_month: string }; Returns: string }
      fn_generate_group_sessions: {
        Args: { p_weeks?: number }
        Returns: number
      }
      fn_generate_scheduled_sessions: {
        Args: { p_horizon_days?: number }
        Returns: number
      }
      fn_legacy_commit_batch: { Args: { p_batch_id: string }; Returns: Json }
      fn_legacy_link_account: {
        Args: { p_legacy_student_id: string; p_user_id: string }
        Returns: undefined
      }
      fn_legacy_require_admin: { Args: never; Returns: string }
      fn_legacy_rollback_batch: {
        Args: { p_batch_id: string; p_force?: boolean }
        Returns: Json
      }
      fn_legacy_search_accounts: {
        Args: { p_query: string }
        Returns: {
          email: string
          linked_legacy_name: string
          linked_legacy_student_id: string
          name: string
          user_id: string
        }[]
      }
      fn_legacy_set_issue_status: {
        Args: { p_issue_id: string; p_note?: string; p_status: string }
        Returns: undefined
      }
      fn_legacy_stage_batch: {
        Args: {
          p_file_sha256: string
          p_month_year_map: Json
          p_payload: Json
          p_source_file: string
        }
        Returns: Json
      }
      fn_legacy_unlink_account: {
        Args: { p_legacy_student_id: string }
        Returns: undefined
      }
      fn_locked_group_packages: {
        Args: { p_level: string }
        Returns: {
          package_id: string
        }[]
      }
      fn_private_slot_options: {
        Args: { p_limit?: number }
        Returns: {
          day_name: string
          day_of_week: number
          group_demand_count: number
          is_recommended: boolean
          start_time: string
          timezone: string
        }[]
      }
      fn_propose_trial_slot: { Args: { p_language: string }; Returns: string }
      fn_propose_trial_slots: { Args: never; Returns: number }
      fn_retire_trial_slot: {
        Args: { p_new_lifecycle?: string; p_slot_id: string }
        Returns: {
          archived_at: string | null
          capacity: number
          class_language: string | null
          created_at: string
          day_of_week: number
          duration_min: number
          enrollment_alert_sent_at: string | null
          id: string
          is_active: boolean
          lifecycle: string
          meeting_url: string | null
          min_run_checked_at: string | null
          min_to_run: number | null
          notes: string | null
          rollover_skip_reason: string | null
          rollover_skipped_at: string | null
          session_period: string | null
          start_time: string
          timezone: string
          trial_date: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trial_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_send_group_class_link: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      fn_set_teacher_slot_status: {
        Args: {
          p_label?: string
          p_notes?: string
          p_slot_id: string
          p_status: string
          p_student_id?: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          label: string | null
          notes: string | null
          slot_date: string
          source: string
          start_time: string
          status: string
          student_id: string | null
          teacher_id: string
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "teacher_schedule_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_set_trial_program_start_date: {
        Args: { p_date: string }
        Returns: {
          booking_lead_minutes: number
          buffer_minutes: number
          default_duration_min: number
          id: number
          max_horizon_days: number
          min_group_size: number
          program_start_date: string | null
          rejoin_cooldown_days: number
          rollover_interval_days: number
          rollover_lead_hours: number
          rollover_mode: string
          slot_minutes: number
          suggestion_weeks: number
          trial_block_days: number
          trial_block_start_dow: number
          trial_weekdays: number[]
          updated_at: string
          window_end_day: number | null
          window_start_day: number | null
        }
        SetofOptions: {
          from: "*"
          to: "trial_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_student_class_conflicts: {
        Args: {
          p_duration_minutes: number
          p_effective_from?: string
          p_effective_to?: string
          p_start_time: string
          p_weekday: number
        }
        Returns: {
          booked_email: string
          booked_name: string
          booking_id: string
          starts_at: string
        }[]
      }
      fn_suggest_group_slots: {
        Args: { p_count?: number; p_level: string }
        Returns: {
          day_name: string
          day_of_week: number
          duration_min: number
          existing_demand: number
          reasons: string[]
          score: number
          start_time: string
          timezone: string
        }[]
      }
      fn_suggest_trial_slots: {
        Args: never
        Returns: {
          day_name: string
          day_of_week: number
          duration_min: number
          has_historical_demand: boolean
          is_reasonable_hour: boolean
          reasons: string[]
          score: number
          source: string
          start_time: string
          timezone: string
          would_replace_full_slot: boolean
        }[]
      }
      fn_teacher_timezone: { Args: never; Returns: string }
      fn_trial_booking_public_view: {
        Args: { p_id: string }
        Returns: {
          attendance_response: string
          booking_id: string
          calendar_url: string
          class_language: string
          duration_min: number
          first_name: string
          is_tba: boolean
          start_time: string
          status: string
          timezone: string
          trial_date: string
        }[]
      }
      fn_trial_language_is_full: {
        Args: { p_language: string }
        Returns: boolean
      }
      fn_trial_room_for: {
        Args: { p_class_language: string; p_day_of_week: number }
        Returns: string
      }
      fn_trial_slot_conflicts: {
        Args: {
          p_day_of_week: number
          p_duration_min?: number
          p_start_text: string
        }
        Returns: {
          detail: string
          source: string
        }[]
      }
      fn_trial_slot_seats_left: { Args: { p_slot_id: string }; Returns: number }
      fn_update_teacher_slot: {
        Args: {
          p_end_time?: string
          p_slot_date?: string
          p_slot_id: string
          p_start_time?: string
          p_timezone?: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          label: string | null
          notes: string | null
          slot_date: string
          source: string
          start_time: string
          status: string
          student_id: string | null
          teacher_id: string
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "teacher_schedule_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_update_trial_slot: {
        Args: {
          p_capacity?: number
          p_class_language?: string
          p_clear_meeting_url?: boolean
          p_clear_min_to_run?: boolean
          p_duration_min?: number
          p_lifecycle?: string
          p_meeting_url?: string
          p_min_to_run?: number
          p_session_period?: string
          p_slot_id: string
          p_start_time?: string
          p_timezone?: string
          p_trial_date?: string
        }
        Returns: {
          archived_at: string | null
          capacity: number
          class_language: string | null
          created_at: string
          day_of_week: number
          duration_min: number
          enrollment_alert_sent_at: string | null
          id: string
          is_active: boolean
          lifecycle: string
          meeting_url: string | null
          min_run_checked_at: string | null
          min_to_run: number | null
          notes: string | null
          rollover_skip_reason: string | null
          rollover_skipped_at: string | null
          session_period: string | null
          start_time: string
          timezone: string
          trial_date: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trial_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_group_sessions: {
        Args: { p_group_id: string; p_start_date?: string; p_weeks?: number }
        Returns: {
          created: boolean
          session_date: string
        }[]
      }
      generate_sessions_for_group: {
        Args: { p_group_id: string; p_start_date?: string; p_weeks?: number }
        Returns: number
      }
      get_auth_email: { Args: never; Returns: string }
      get_enrollment_for_payment: {
        Args: { p_enrollment_id: string }
        Returns: {
          amount: number
          approval_status: string
          classes_included: number
          currency: string
          due_at: string
          duration: number
          id: string
          payment_date: string
          payment_method: string
          plan_type: string
          receipt_url: string
          user_id: string
        }[]
      }
      get_group_sessions: {
        Args: { p_from?: string; p_group_id: string; p_to?: string }
        Returns: {
          marked_count: number
          present_count: number
          session_date: string
          session_id: string
          total_members: number
        }[]
      }
      get_my_streak_rank: {
        Args: never
        Returns: {
          current_streak: number
          out_of: number
          rank: number
        }[]
      }
      get_my_xp_rank: {
        Args: never
        Returns: {
          out_of: number
          rank: number
          total_xp: number
        }[]
      }
      get_near_capacity_trial_slots: {
        Args: never
        Returns: {
          booked_count: number
          capacity: number
          day_of_week: number
          fill_pct: number
          next_trial_date: string
          start_time: string
        }[]
      }
      get_session_roster: {
        Args: { p_session_id: string }
        Returns: {
          admin_approved: boolean
          attendance_status: string
          email: string
          full_name: string
          user_id: string
        }[]
      }
      get_sessions_for_reminder_1h: {
        Args: never
        Returns: {
          duration_min: number
          email: string
          group_name: string
          level: string
          name: string
          session_date: string
          session_id: string
          start_time: string
          user_id: string
        }[]
      }
      get_sessions_for_reminder_24h: {
        Args: never
        Returns: {
          duration_min: number
          email: string
          group_name: string
          level: string
          name: string
          session_date: string
          session_id: string
          start_time: string
          user_id: string
        }[]
      }
      get_streak_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          current_streak: number
          display_name: string
          is_me: boolean
          rank: number
        }[]
      }
      get_student_bundle_balances: {
        Args: never
        Returns: {
          bundle_id: string
          catalog_key: string
          currency: string
          label: string
          purchased_on: string
          remaining_classes: number
          source: string
          student_id: string
          total_classes: number
          total_price: number
          used_classes: number
        }[]
      }
      get_student_preference_trends: {
        Args: { days_back?: number }
        Returns: {
          day_of_week: number
          level: string
          preferred_start_time: string
          request_count: number
        }[]
      }
      get_student_upcoming_sessions: {
        Args: { p_user_id: string }
        Returns: {
          attendance_status: string
          day_of_week: number
          duration_min: number
          group_id: string
          group_name: string
          level: string
          session_date: string
          session_id: string
          start_time: string
          timezone: string
        }[]
      }
      get_teacher_open_slots: {
        Args: { p_from?: string; p_teacher_id?: string; p_to?: string }
        Returns: {
          day_of_week: number
          end_time: string
          id: string
          slot_date: string
          start_time: string
          starts_at: string
          teacher_id: string
          timezone: string
        }[]
      }
      get_teacher_schedule: {
        Args: {
          p_from?: string
          p_status?: string
          p_teacher_id?: string
          p_to?: string
        }
        Returns: {
          created_at: string
          day_of_week: number
          duration_minutes: number
          end_time: string
          ends_at: string
          id: string
          is_past: boolean
          label: string
          notes: string
          slot_date: string
          source: string
          start_time: string
          starts_at: string
          status: string
          student_id: string
          student_name: string
          teacher_id: string
          timezone: string
          updated_at: string
        }[]
      }
      get_trial_availability: {
        Args: { p_language?: string }
        Returns: {
          booked_count: number
          capacity: number
          class_language: string
          day_of_week: number
          duration_min: number
          next_trial_date: string
          session_period: string
          start_time: string
          timezone: string
        }[]
      }
      get_trial_booking_by_token: {
        Args: { p_token: string }
        Returns: {
          attendance_response: string
          booking_id: string
          calendar_url: string
          class_language: string
          duration_min: number
          first_name: string
          is_tba: boolean
          start_time: string
          status: string
          timezone: string
          trial_date: string
        }[]
      }
      get_trial_slot_options: {
        Args: { p_token: string }
        Returns: {
          duration_min: number
          is_current: boolean
          seats_left: number
          slot_id: string
          start_time: string
          timezone: string
          trial_date: string
        }[]
      }
      get_weekly_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          is_me: boolean
          rank: number
          week_xp: number
        }[]
      }
      get_xp_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          is_me: boolean
          rank: number
          total_xp: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hold_my_seat: { Args: { _package_id: string }; Returns: Json }
      increment_blog_view: { Args: { post_slug: string }; Returns: undefined }
      is_own_teacher_student: {
        Args: { _student_id: string }
        Returns: boolean
      }
      log_pgnet_email_failures: { Args: never; Returns: undefined }
      mark_student_attendance: {
        Args: { _notes?: string; _student_id: string }
        Returns: number
      }
      match_enrollment_to_slot: {
        Args: { _enrollment_id: string }
        Returns: string
      }
      next_monthly_trial_date: {
        Args: { p_dow: number; p_from: string }
        Returns: string
      }
      next_weekday_date: {
        Args: { _dow: number; _tz?: string }
        Returns: string
      }
      normalize_level: { Args: { raw: string }; Returns: string }
      notification_category: { Args: { _type: string }; Returns: string }
      placement_level_key: { Args: { p_level: string }; Returns: string }
      public_display_name: { Args: { p_name: string }; Returns: string }
      purge_cron_health: { Args: never; Returns: undefined }
      reassign_student_slot: {
        Args: { _enrollment_id: string; _new_slot_id: string }
        Returns: undefined
      }
      recompute_lesson_milestones: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      recompute_streak_milestones: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      recompute_xp_milestones: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      reject_attendance_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      reschedule_trial_slot: {
        Args: { p_new_start_time: string; p_slot_id: string }
        Returns: {
          bookings_moved: number
          new_start_time: string
          old_start_time: string
          slot_id: string
        }[]
      }
      reset_platform_data: {
        Args: { _reset_password: string }
        Returns: string
      }
      resolve_user_language: {
        Args: { p_country?: string; p_email: string }
        Returns: string
      }
      respond_trial_attendance:
        | {
            Args: { p_response: string; p_token: string }
            Returns: {
              attendance_response: string
              booking_id: string
              calendar_url: string
              class_language: string
              duration_min: number
              first_name: string
              is_tba: boolean
              start_time: string
              status: string
              timezone: string
              trial_date: string
            }[]
          }
        | {
            Args: { p_response: string; p_slot_id: string; p_token: string }
            Returns: {
              attendance_response: string
              booking_id: string
              calendar_url: string
              class_language: string
              duration_min: number
              first_name: string
              is_tba: boolean
              start_time: string
              status: string
              timezone: string
              trial_date: string
            }[]
          }
      revert_attendance_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      revert_enrollment: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
      roll_bundle_if_overdrawn: {
        Args: { p_bundle_id: string }
        Returns: string
      }
      roll_enrolment_if_overdrawn: {
        Args: { p_enrollment_id: string; p_from?: string }
        Returns: string
      }
      run_self_verification: { Args: never; Returns: Json }
      run_trial_min_group_checks: { Args: never; Returns: undefined }
      save_session_attendance: {
        Args: { p_records: Json; p_session_id: string }
        Returns: number
      }
      save_student_preference: {
        Args: {
          p_level?: string
          p_preferred_day_of_week: number
          p_preferred_start_time: string
          p_user_id: string
        }
        Returns: boolean
      }
      send_bundle_payment_ask: {
        Args: { p_bundle_id: string }
        Returns: undefined
      }
      send_class_feedback_emails: { Args: never; Returns: undefined }
      send_daily_numbers_digest: { Args: never; Returns: undefined }
      send_enrolment_payment_ask: {
        Args: { p_enrollment_id: string }
        Returns: undefined
      }
      send_forming_escalation_emails: { Args: never; Returns: undefined }
      send_forming_group_emails: { Args: never; Returns: undefined }
      send_payment_ask_emails: { Args: never; Returns: undefined }
      send_payment_final_alert: { Args: never; Returns: undefined }
      send_pre_class_reminders: { Args: never; Returns: undefined }
      send_receipt_nudge_emails: { Args: never; Returns: undefined }
      send_rejection_followup_emails: { Args: never; Returns: undefined }
      student_confirm_private_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      student_submit_attendance: {
        Args: { p_enrollment_id: string; p_session_date?: string }
        Returns: {
          request_id: string
          sessions_remaining: number
          status: string
        }[]
      }
      student_submit_payment_claim: {
        Args: {
          p_amount: number
          p_bundle_id?: string
          p_currency: string
          p_method: string
          p_note?: string
          p_paid_on: string
          p_receipt_path?: string
          p_sender_name?: string
        }
        Returns: string
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
      submit_enrollment_with_preference: {
        Args: {
          p_amount: number
          p_classes_included: number
          p_duration: number
          p_level: string
          p_payment_provider: string
          p_plan_type: string
          p_preferred_day_of_week?: number
          p_preferred_start_time?: string
          p_stripe_payment_intent_id?: string
          p_unit_price: number
          p_user_id: string
        }
        Returns: Json
      }
      submit_manual_enrollment: {
        Args: {
          _amount: number
          _currency?: string
          _duration: number
          _payment_method?: string
          _plan_type: string
          _receipt_url: string
          _tx_ref: string
        }
        Returns: string
      }
      telegram_bot_config: {
        Args: never
        Returns: {
          admin_chat_id: string
          bot_token: string
          webhook_secret: string
        }[]
      }
      trigger_abandoned_checkout_recovery: { Args: never; Returns: undefined }
      trigger_class_reminder_1h: { Args: never; Returns: undefined }
      trigger_class_reminder_24h: { Args: never; Returns: undefined }
      trigger_class_reminders: { Args: never; Returns: undefined }
      trigger_funnel_digest: { Args: never; Returns: undefined }
      trigger_send_attendance_confirmations: { Args: never; Returns: undefined }
      trigger_teacher_brief: { Args: never; Returns: undefined }
      trigger_trial_followups: { Args: never; Returns: undefined }
      trigger_trial_guide: { Args: never; Returns: undefined }
      trigger_trial_reminder: { Args: never; Returns: undefined }
      trigger_trial_rollover_notifications: { Args: never; Returns: undefined }
      trigger_weekly_report: { Args: never; Returns: undefined }
      unmatch_student_slot: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
      unsubscribe_by_token: { Args: { p_token: string }; Returns: string }
      update_student_preferences: {
        Args: {
          _enrollment_id: string
          _preferred_days: string[]
          _timezone: string
        }
        Returns: undefined
      }
      upsert_trial_booking: {
        Args: {
          p_day_of_week: number
          p_delete_id: string
          p_email: string
          p_goal: string
          p_language: string
          p_level: string
          p_name: string
          p_phone: string
          p_start_time: string
          p_status: string
          p_timezone: string
          p_trial_date: string
          p_user_id: string
        }
        Returns: string
      }
      upsert_trial_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_max_attempts?: number
          p_window_start: string
        }
        Returns: boolean
      }
      validate_resubmission_token: {
        Args: { _token: string }
        Returns: {
          email: string
          enrollment_id: string
          expires_at: string
          id: string
          status: string
          user_id: string
        }[]
      }
      verify_cron_secret: { Args: { p_secret: string }; Returns: boolean }
      verify_internal_secret: { Args: { p_secret: string }; Returns: boolean }
      verify_trial_booking: {
        Args: { p_token: string }
        Returns: {
          attendance_response: string
          booking_id: string
          calendar_url: string
          class_language: string
          duration_min: number
          first_name: string
          is_tba: boolean
          start_time: string
          status: string
          timezone: string
          trial_date: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
