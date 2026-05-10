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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          approved_by: string | null
          business_name: string | null
          business_type: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          referral_source: string | null
          reviewed_at: string | null
          status: string
        }
        Insert: {
          approved_by?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          approved_by?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          approved_at: string
          business_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string
          business_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string
          business_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          ai_summary: string | null
          call_duration: number | null
          caller_name: string | null
          caller_phone: string | null
          created_at: string
          customer_id: string | null
          estimated_budget: string | null
          id: string
          job_address: string | null
          job_type: string | null
          lead_score: number | null
          lead_status: string | null
          transcript: string | null
        }
        Insert: {
          ai_summary?: string | null
          call_duration?: number | null
          caller_name?: string | null
          caller_phone?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_budget?: string | null
          id?: string
          job_address?: string | null
          job_type?: string | null
          lead_score?: number | null
          lead_status?: string | null
          transcript?: string | null
        }
        Update: {
          ai_summary?: string | null
          call_duration?: number | null
          caller_name?: string | null
          caller_phone?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_budget?: string | null
          id?: string
          job_address?: string | null
          job_type?: string | null
          lead_score?: number | null
          lead_status?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          default_deposit: number | null
          default_disclaimer: string | null
          default_general_conditions: string | null
          email: string | null
          id: string
          license_number: string | null
          logo_url: string | null
          notify_call_email: boolean | null
          notify_lead_whatsapp: boolean | null
          notify_payment_reminders: boolean | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          default_deposit?: number | null
          default_disclaimer?: string | null
          default_general_conditions?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          notify_call_email?: boolean | null
          notify_lead_whatsapp?: boolean | null
          notify_payment_reminders?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          default_deposit?: number | null
          default_disclaimer?: string | null
          default_general_conditions?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          notify_call_email?: boolean | null
          notify_lead_whatsapp?: boolean | null
          notify_payment_reminders?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      demo_invites: {
        Row: {
          activated_at: string | null
          created_at: string
          expires_at: string
          id: string
          invite_code: string
          invitee_company: string | null
          invitee_email: string | null
          invitee_name: string | null
          is_active: boolean
          last_seen: string | null
          page_views: number
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invite_code: string
          invitee_company?: string | null
          invitee_email?: string | null
          invitee_name?: string | null
          is_active?: boolean
          last_seen?: string | null
          page_views?: number
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invite_code?: string
          invitee_company?: string | null
          invitee_email?: string | null
          invitee_name?: string | null
          is_active?: boolean
          last_seen?: string | null
          page_views?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      project_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          project_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          project_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          project_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_name: string | null
          contract_total: number
          created_at: string
          customer_address: string | null
          customer_id: string | null
          customer_name: string
          deposit: number
          deposit_paid: boolean
          final_paid: boolean
          id: string
          notes: string | null
          payment1_paid: boolean
          payment2_paid: boolean
          payment3_paid: boolean
          progress_pct: number
          project_title: string
          punchlist_items: string[]
          scope_of_work: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          contract_total?: number
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name: string
          deposit?: number
          deposit_paid?: boolean
          final_paid?: boolean
          id?: string
          notes?: string | null
          payment1_paid?: boolean
          payment2_paid?: boolean
          payment3_paid?: boolean
          progress_pct?: number
          project_title: string
          punchlist_items?: string[]
          scope_of_work?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          contract_total?: number
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string
          deposit?: number
          deposit_paid?: boolean
          final_paid?: boolean
          id?: string
          notes?: string | null
          payment1_paid?: boolean
          payment2_paid?: boolean
          payment3_paid?: boolean
          progress_pct?: number
          project_title?: string
          punchlist_items?: string[]
          scope_of_work?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_jobs: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          duration_minutes: number
          id: string
          job_address: string | null
          job_type: string | null
          notes: string | null
          project_id: string | null
          scheduled_date: string
          start_time: string
          status: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          duration_minutes?: number
          id?: string
          job_address?: string | null
          job_type?: string | null
          notes?: string | null
          project_id?: string | null
          scheduled_date?: string
          start_time?: string
          status?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          duration_minutes?: number
          id?: string
          job_address?: string | null
          job_type?: string | null
          notes?: string | null
          project_id?: string | null
          scheduled_date?: string
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          business_name: string | null
          consent_timestamp: string | null
          contractor_type: string | null
          created_at: string
          demo_access: boolean
          demo_expires_at: string
          demo_link: string
          email: string
          feature_interest: string | null
          full_name: string | null
          id: string
          marketing_consent: boolean
          phone: string | null
          source: string | null
        }
        Insert: {
          business_name?: string | null
          consent_timestamp?: string | null
          contractor_type?: string | null
          created_at?: string
          demo_access?: boolean
          demo_expires_at?: string
          demo_link?: string
          email: string
          feature_interest?: string | null
          full_name?: string | null
          id?: string
          marketing_consent?: boolean
          phone?: string | null
          source?: string | null
        }
        Update: {
          business_name?: string | null
          consent_timestamp?: string | null
          contractor_type?: string | null
          created_at?: string
          demo_access?: boolean
          demo_expires_at?: string
          demo_link?: string
          email?: string
          feature_interest?: string | null
          full_name?: string | null
          id?: string
          marketing_consent?: boolean
          phone?: string | null
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
