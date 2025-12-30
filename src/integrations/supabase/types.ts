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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter: {
        Row: {
          chapter_id: number
          id: string
          name: string
        }
        Insert: {
          chapter_id: number
          id?: string
          name: string
        }
        Update: {
          chapter_id?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          barcode_scan_count: number | null
          created_at: string | null
          customer_count: number | null
          id: string
          invoice_count: number | null
          item_count: number | null
          last_reset_date: string | null
          user_id: string
        }
        Insert: {
          barcode_scan_count?: number | null
          created_at?: string | null
          customer_count?: number | null
          id?: string
          invoice_count?: number | null
          item_count?: number | null
          last_reset_date?: string | null
          user_id: string
        }
        Update: {
          barcode_scan_count?: number | null
          created_at?: string | null
          customer_count?: number | null
          id?: string
          invoice_count?: number | null
          item_count?: number | null
          last_reset_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hsn_code: {
        Row: {
          embedding: string | null
          hsn_code: string
          id: string
          name: string
          rate_above_threshold: number | null
          rate_below_threshold: number | null
          rate_type: string
          reverse_charge: boolean
          subchapter_id: string
          subchapter_id_int: number | null
          tax_rate: number
          threshold_amount: number | null
        }
        Insert: {
          embedding?: string | null
          hsn_code: string
          id?: string
          name: string
          rate_above_threshold?: number | null
          rate_below_threshold?: number | null
          rate_type?: string
          reverse_charge?: boolean
          subchapter_id: string
          subchapter_id_int?: number | null
          tax_rate: number
          threshold_amount?: number | null
        }
        Update: {
          embedding?: string | null
          hsn_code?: string
          id?: string
          name?: string
          rate_above_threshold?: number | null
          rate_below_threshold?: number | null
          rate_type?: string
          reverse_charge?: boolean
          subchapter_id?: string
          subchapter_id_int?: number | null
          tax_rate?: number
          threshold_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hsn_code_subchapter_id_fkey"
            columns: ["subchapter_id"]
            isOneToOne: false
            referencedRelation: "subchapter"
            referencedColumns: ["id"]
          },
        ]
      }
      import_subchapter: {
        Row: {
          chapter_id: number | null
          name: string | null
          subchapter_id: number | null
        }
        Insert: {
          chapter_id?: number | null
          name?: string | null
          subchapter_id?: number | null
        }
        Update: {
          chapter_id?: number | null
          name?: string | null
          subchapter_id?: number | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          created_at: string | null
          description: string
          gst_amount: number
          gst_rate: number
          id: string
          invoice_id: string
          item_id: string | null
          line_total: number
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          gst_amount?: number
          gst_rate?: number
          id?: string
          invoice_id: string
          item_id?: string | null
          line_total?: number
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          gst_amount?: number
          gst_rate?: number
          id?: string
          invoice_id?: string
          item_id?: string | null
          line_total?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_id: string
          buyer_gstin: string | null
          buyer_name: string
          created_at: string | null
          customer_id: string | null
          gst_amount: number
          id: string
          invoice_date: string
          invoice_number: string
          subtotal: number
          total: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          buyer_gstin?: string | null
          buyer_name: string
          created_at?: string | null
          customer_id?: string | null
          gst_amount?: number
          id?: string
          invoice_date: string
          invoice_number: string
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          buyer_gstin?: string | null
          buyer_name?: string
          created_at?: string | null
          customer_id?: string | null
          gst_amount?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          business_id: string
          category_code: string | null
          created_at: string | null
          gst_bracket_source: string | null
          gst_rate: number
          hsn_sac_code: string | null
          id: string
          name: string
          owner_id: string
          sku: string | null
          unit_of_measure: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category_code?: string | null
          created_at?: string | null
          gst_bracket_source?: string | null
          gst_rate?: number
          hsn_sac_code?: string | null
          id?: string
          name: string
          owner_id: string
          sku?: string | null
          unit_of_measure: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category_code?: string | null
          created_at?: string | null
          gst_bracket_source?: string | null
          gst_rate?: number
          hsn_sac_code?: string | null
          id?: string
          name?: string
          owner_id?: string
          sku?: string | null
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          currency: string | null
          id: string
          payment_date: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          currency?: string | null
          id?: string
          payment_date?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          currency?: string | null
          id?: string
          payment_date?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_entries: {
        Row: {
          business_id: string
          created_at: string | null
          entry_date: string
          entry_number: string
          gst_amount: number
          id: string
          subtotal: number
          supplier_gstin: string | null
          supplier_id: string | null
          supplier_name: string
          total: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          entry_date: string
          entry_number: string
          gst_amount?: number
          id?: string
          subtotal?: number
          supplier_gstin?: string | null
          supplier_id?: string | null
          supplier_name: string
          total?: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          entry_date?: string
          entry_number?: string
          gst_amount?: number
          id?: string
          subtotal?: number
          supplier_gstin?: string | null
          supplier_id?: string | null
          supplier_name?: string
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      state_code: {
        Row: {
          code: string
          id: string
          name: string
        }
        Insert: {
          code: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      subchapter: {
        Row: {
          chapter_id: string
          chapter_id_int: number | null
          id: string
          name: string
          subchapter_id: number
        }
        Insert: {
          chapter_id: string
          chapter_id_int?: number | null
          id?: string
          name: string
          subchapter_id: number
        }
        Update: {
          chapter_id?: string
          chapter_id_int?: number | null
          id?: string
          name?: string
          subchapter_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "subchapter_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          id: string
          plan: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          status: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plan?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_period_summaries: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          input_gst: number
          net_gst: number
          output_gst: number
          period_end: string
          period_start: string
          total_purchases: number
          total_sales: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          input_gst?: number
          net_gst?: number
          output_gst?: number
          period_end: string
          period_start: string
          total_purchases?: number
          total_sales?: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          input_gst?: number
          net_gst?: number
          output_gst?: number
          period_end?: string
          period_start?: string
          total_purchases?: number
          total_sales?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_period_summaries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      temp_hsn: {
        Row: {
          hsn_code: number
          id: string
          name: string | null
          rate_above_threshold: number | null
          rate_below_threshold: number | null
          rate_type: string
          reverse_charge: boolean | null
          subchapter_id: number
          tax_rate: number | null
          threshold_amount: number | null
        }
        Insert: {
          hsn_code: number
          id?: string
          name?: string | null
          rate_above_threshold?: number | null
          rate_below_threshold?: number | null
          rate_type?: string
          reverse_charge?: boolean | null
          subchapter_id: number
          tax_rate?: number | null
          threshold_amount?: number | null
        }
        Update: {
          hsn_code?: number
          id?: string
          name?: string | null
          rate_above_threshold?: number | null
          rate_below_threshold?: number | null
          rate_type?: string
          reverse_charge?: boolean | null
          subchapter_id?: number
          tax_rate?: number | null
          threshold_amount?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      check_feature_access: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
      increment_usage: {
        Args: { p_usage_type: string; p_user_id: string }
        Returns: undefined
      }
      match_hsn_semantic: {
        Args: { match_count?: number; query_vector: string }
        Returns: {
          hsn_code: string
          id: string
          name: string
          rate_above_threshold: number
          rate_below_threshold: number
          rate_type: string
          reverse_charge: boolean
          similarity: number
          subchapter_id: string
          tax_rate: number
          threshold_amount: number
        }[]
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
