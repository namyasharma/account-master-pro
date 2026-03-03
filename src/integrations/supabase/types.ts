export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      businesses: {
        Row: {
          address: string | null;
          created_at: string | null;
          email: string | null;
          gstin: string | null;
          id: string;
          industry: Database["public"]["Enums"]["industry_type"] | null;
          name: string;
          owner_id: string;
          phone: string | null;
          state_code: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          industry?: Database["public"]["Enums"]["industry_type"] | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          state_code?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          industry?: Database["public"]["Enums"]["industry_type"] | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          state_code?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          address: string | null;
          business_id: string;
          created_at: string | null;
          email: string | null;
          gstin: string | null;
          id: string;
          name: string;
          phone: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          business_id: string;
          created_at?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          business_id?: string;
          created_at?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      feature_usage: {
        Row: {
          barcode_scan_count: number | null;
          created_at: string | null;
          customer_count: number | null;
          id: string;
          invoice_count: number | null;
          item_count: number | null;
          last_reset_date: string | null;
          user_id: string;
        };
        Insert: {
          barcode_scan_count?: number | null;
          created_at?: string | null;
          customer_count?: number | null;
          id?: string;
          invoice_count?: number | null;
          item_count?: number | null;
          last_reset_date?: string | null;
          user_id: string;
        };
        Update: {
          barcode_scan_count?: number | null;
          created_at?: string | null;
          customer_count?: number | null;
          id?: string;
          invoice_count?: number | null;
          item_count?: number | null;
          last_reset_date?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      gst_notification: {
        Row: {
          authority: Database["public"]["Enums"]["authority_type"];
          created_at: string | null;
          document_hash: string | null;
          effective_from: string;
          effective_to: string | null;
          id: string;
          issued_at: string;
          notification_number: string;
          parse_error: string | null;
          parsed_at: string | null;
          source_url: string | null;
          status: Database["public"]["Enums"]["notification_status"] | null;
          summary: string | null;
          supersedes_notification_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          authority?: Database["public"]["Enums"]["authority_type"];
          created_at?: string | null;
          document_hash?: string | null;
          effective_from: string;
          effective_to?: string | null;
          id?: string;
          issued_at: string;
          notification_number: string;
          parse_error?: string | null;
          parsed_at?: string | null;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["notification_status"] | null;
          summary?: string | null;
          supersedes_notification_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          authority?: Database["public"]["Enums"]["authority_type"];
          created_at?: string | null;
          document_hash?: string | null;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          issued_at?: string;
          notification_number?: string;
          parse_error?: string | null;
          parsed_at?: string | null;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["notification_status"] | null;
          summary?: string | null;
          supersedes_notification_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gst_notification_supersedes_notification_id_fkey";
            columns: ["supersedes_notification_id"];
            isOneToOne: false;
            referencedRelation: "gst_notification";
            referencedColumns: ["id"];
          },
        ];
      };
      gst_rate_override: {
        Row: {
          applies_to_type: Database["public"]["Enums"]["code_type"];
          approved_by: string | null;
          cess_rate: number | null;
          cgst_rate: number | null;
          condition_text: string | null;
          created_at: string | null;
          created_by: string | null;
          effective_from: string;
          effective_to: string | null;
          exclusion_codes: string[] | null;
          hsn_end: string | null;
          hsn_start: string | null;
          id: string;
          igst_rate: number | null;
          is_exempt: boolean | null;
          priority: number | null;
          reason: string;
          sac_code: string | null;
          sgst_rate: number | null;
          updated_at: string | null;
        };
        Insert: {
          applies_to_type: Database["public"]["Enums"]["code_type"];
          approved_by?: string | null;
          cess_rate?: number | null;
          cgst_rate?: number | null;
          condition_text?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          effective_from: string;
          effective_to?: string | null;
          exclusion_codes?: string[] | null;
          hsn_end?: string | null;
          hsn_start?: string | null;
          id?: string;
          igst_rate?: number | null;
          is_exempt?: boolean | null;
          priority?: number | null;
          reason: string;
          sac_code?: string | null;
          sgst_rate?: number | null;
          updated_at?: string | null;
        };
        Update: {
          applies_to_type?: Database["public"]["Enums"]["code_type"];
          approved_by?: string | null;
          cess_rate?: number | null;
          cgst_rate?: number | null;
          condition_text?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          effective_from?: string;
          effective_to?: string | null;
          exclusion_codes?: string[] | null;
          hsn_end?: string | null;
          hsn_start?: string | null;
          id?: string;
          igst_rate?: number | null;
          is_exempt?: boolean | null;
          priority?: number | null;
          reason?: string;
          sac_code?: string | null;
          sgst_rate?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      gst_rate_rule: {
        Row: {
          applies_to_type: Database["public"]["Enums"]["code_type"];
          cess_rate: number | null;
          cgst_rate: number | null;
          condition_text: string | null;
          created_at: string | null;
          effective_from: string;
          effective_to: string | null;
          exclusion_codes: string[] | null;
          hsn_end: string | null;
          hsn_start: string | null;
          id: string;
          igst_rate: number | null;
          is_exempt: boolean | null;
          notification_id: string;
          raw_row_json: Json | null;
          sac_code: string | null;
          sgst_rate: number | null;
          updated_at: string | null;
        };
        Insert: {
          applies_to_type: Database["public"]["Enums"]["code_type"];
          cess_rate?: number | null;
          cgst_rate?: number | null;
          condition_text?: string | null;
          created_at?: string | null;
          effective_from: string;
          effective_to?: string | null;
          exclusion_codes?: string[] | null;
          hsn_end?: string | null;
          hsn_start?: string | null;
          id?: string;
          igst_rate?: number | null;
          is_exempt?: boolean | null;
          notification_id: string;
          raw_row_json?: Json | null;
          sac_code?: string | null;
          sgst_rate?: number | null;
          updated_at?: string | null;
        };
        Update: {
          applies_to_type?: Database["public"]["Enums"]["code_type"];
          cess_rate?: number | null;
          cgst_rate?: number | null;
          condition_text?: string | null;
          created_at?: string | null;
          effective_from?: string;
          effective_to?: string | null;
          exclusion_codes?: string[] | null;
          hsn_end?: string | null;
          hsn_start?: string | null;
          id?: string;
          igst_rate?: number | null;
          is_exempt?: boolean | null;
          notification_id?: string;
          raw_row_json?: Json | null;
          sac_code?: string | null;
          sgst_rate?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gst_rate_rule_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "gst_notification";
            referencedColumns: ["id"];
          },
        ];
      };
      hsn_code: {
        Row: {
          id: string;
          subchapter_id: string;
          hsn_code: string;
          name: string; // description of the HSN code
          tax_rate: number;
          reverse_charge?: boolean;
          rate_type?: "flat" | "slab" | string;
          threshold_amount?: number;
          rate_below_threshold?: number;
          rate_above_threshold?: number;
        };
        Insert: {
          cid: string;
          subchapter_id: string;
          hsn_code: string;
          name: string; // description of the HSN code
          tax_rate: number;
          reverse_charge?: boolean;
          rate_type?: "flat" | "slab" | string;
          threshold_amount?: number;
          rate_below_threshold?: number;
          rate_above_threshold?: number;
        };
        Update: {
          embedding?: string | null;
          hsn_code?: string;
          id?: string;
          name?: string;
          rate_above_threshold?: number | null;
          rate_below_threshold?: number | null;
          rate_type?: string;
          reverse_charge?: boolean;
          subchapter_id?: string;
          subchapter_id_int?: number | null;
          tax_rate?: number;
          threshold_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "hsn_code_subchapter_id_fkey";
            columns: ["subchapter_id"];
            isOneToOne: false;
            referencedRelation: "subchapter";
            referencedColumns: ["id"];
          },
        ];
      };
      hsn_sac: {
        Row: {
          code: string | null;
          code_length: number | null;
          created_at: string | null;
          deprecated_on: string | null;
          description: string | null;
          id: string | null;
          introduced_on: string | null;
          is_active: boolean | null;
          parent_code: string | null;
          type: Database["public"]["Enums"]["code_type"] | null;
          updated_at: string | null;
        };
        Insert: {
          code?: string | null;
          code_length?: number | null;
          created_at?: string | null;
          deprecated_on?: string | null;
          description?: string | null;
          id?: string | null;
          introduced_on?: string | null;
          is_active?: boolean | null;
          parent_code?: string | null;
          type?: Database["public"]["Enums"]["code_type"] | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string | null;
          code_length?: number | null;
          created_at?: string | null;
          deprecated_on?: string | null;
          description?: string | null;
          id?: string | null;
          introduced_on?: string | null;
          is_active?: boolean | null;
          parent_code?: string | null;
          type?: Database["public"]["Enums"]["code_type"] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      hsn_sac_old: {
        Row: {
          code: string;
          code_length: number;
          created_at: string | null;
          deprecated_on: string | null;
          description: string;
          id: string;
          introduced_on: string | null;
          is_active: boolean | null;
          parent_code: string | null;
          type: Database["public"]["Enums"]["code_type"];
          updated_at: string | null;
        };
        Insert: {
          code: string;
          code_length: number;
          created_at?: string | null;
          deprecated_on?: string | null;
          description: string;
          id?: string;
          introduced_on?: string | null;
          is_active?: boolean | null;
          parent_code?: string | null;
          type: Database["public"]["Enums"]["code_type"];
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          code_length?: number;
          created_at?: string | null;
          deprecated_on?: string | null;
          description?: string;
          id?: string;
          introduced_on?: string | null;
          is_active?: boolean | null;
          parent_code?: string | null;
          type?: Database["public"]["Enums"]["code_type"];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      import_subchapter: {
        Row: {
          chapter_id: number | null;
          name: string | null;
          subchapter_id: number | null;
        };
        Insert: {
          chapter_id?: number | null;
          name?: string | null;
          subchapter_id?: number | null;
        };
        Update: {
          chapter_id?: number | null;
          name?: string | null;
          subchapter_id?: number | null;
        };
        Relationships: [];
      };
      industry_templates: {
        Row: {
          created_at: string | null;
          id: string;
          industry: string;
          template_config: Json;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          industry: string;
          template_config: Json;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          industry?: string;
          template_config?: Json;
        };
        Relationships: [];
      };
      invoice_line_items: {
        Row: {
          created_at: string | null;
          description: string;
          gst_amount: number;
          gst_rate: number;
          hsn_sac_code: string | null;
          id: string;
          invoice_id: string;
          item_id: string | null;
          line_total: number;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          gst_amount?: number;
          gst_rate?: number;
          hsn_sac_code?: string | null;
          id?: string;
          invoice_id: string;
          item_id?: string | null;
          line_total?: number;
          quantity?: number;
          unit_price?: number;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          gst_amount?: number;
          gst_rate?: number;
          hsn_sac_code?: string | null;
          id?: string;
          invoice_id?: string;
          item_id?: string | null;
          line_total?: number;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_line_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          business_id: string;
          buyer_gstin: string | null;
          buyer_name: string;
          cgst_amount: number;
          created_at: string | null;
          customer_id: string | null;
          gst_amount: number;
          id: string;
          igst_amount: number;
          invoice_date: string;
          invoice_number: string;
          place_of_supply: string | null;
          sgst_amount: number;
          share_token: string | null;
          subtotal: number;
          total: number;
          updated_at: string | null;
        };
        Insert: {
          business_id: string;
          buyer_gstin?: string | null;
          buyer_name: string;
          cgst_amount?: number;
          created_at?: string | null;
          customer_id?: string | null;
          gst_amount?: number;
          id?: string;
          igst_amount?: number;
          invoice_date: string;
          invoice_number: string;
          place_of_supply?: string | null;
          sgst_amount?: number;
          share_token?: string | null;
          subtotal?: number;
          total?: number;
          updated_at?: string | null;
        };
        Update: {
          business_id?: string;
          buyer_gstin?: string | null;
          buyer_name?: string;
          cgst_amount?: number;
          created_at?: string | null;
          customer_id?: string | null;
          gst_amount?: number;
          id?: string;
          igst_amount?: number;
          invoice_date?: string;
          invoice_number?: string;
          place_of_supply?: string | null;
          sgst_amount?: number;
          share_token?: string | null;
          subtotal?: number;
          total?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      items: {
        Row: {
          business_id: string;
          category_code: string | null;
          created_at: string | null;
          gst_bracket_source: string | null;
          gst_rate: number;
          hsn_sac_code: string | null;
          id: string;
          name: string;
          owner_id: string;
          sku: string | null;
          unit_of_measure: string;
          unit_price: number;
          updated_at: string | null;
        };
        Insert: {
          business_id: string;
          category_code?: string | null;
          created_at?: string | null;
          gst_bracket_source?: string | null;
          gst_rate?: number;
          hsn_sac_code?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          sku?: string | null;
          unit_of_measure?: string;
          unit_price?: number;
          updated_at?: string | null;
        };
        Update: {
          business_id?: string;
          category_code?: string | null;
          created_at?: string | null;
          gst_bracket_source?: string | null;
          gst_rate?: number;
          hsn_sac_code?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          sku?: string | null;
          unit_of_measure?: string;
          unit_price?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "items_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      parser_audit_log: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          error_details: Json | null;
          id: string;
          notification_id: string | null;
          rows_failed: number | null;
          rows_inserted: number | null;
          rows_parsed: number | null;
          started_at: string;
          status: string;
          validation_checks: Json | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          error_details?: Json | null;
          id?: string;
          notification_id?: string | null;
          rows_failed?: number | null;
          rows_inserted?: number | null;
          rows_parsed?: number | null;
          started_at?: string;
          status: string;
          validation_checks?: Json | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          error_details?: Json | null;
          id?: string;
          notification_id?: string | null;
          rows_failed?: number | null;
          rows_inserted?: number | null;
          rows_parsed?: number | null;
          started_at?: string;
          status?: string;
          validation_checks?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "parser_audit_log_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "gst_notification";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number | null;
          currency: string | null;
          id: string;
          payment_date: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          status: string | null;
          subscription_id: string | null;
          user_id: string;
        };
        Insert: {
          amount?: number | null;
          currency?: string | null;
          id?: string;
          payment_date?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          status?: string | null;
          subscription_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number | null;
          currency?: string | null;
          id?: string;
          payment_date?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          status?: string | null;
          subscription_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          onboarding_completed: boolean | null;
          theme: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          onboarding_completed?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          onboarding_completed?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      purchase_entries: {
        Row: {
          business_id: string;
          cgst_amount: number;
          created_at: string | null;
          entry_date: string;
          entry_number: string;
          gst_amount: number;
          id: string;
          igst_amount: number;
          place_of_supply: string | null;
          sgst_amount: number;
          subtotal: number;
          supplier_gstin: string | null;
          supplier_id: string | null;
          supplier_name: string;
          total: number;
          updated_at: string | null;
        };
        Insert: {
          business_id: string;
          cgst_amount?: number;
          created_at?: string | null;
          entry_date?: string;
          entry_number: string;
          gst_amount?: number;
          id?: string;
          igst_amount?: number;
          place_of_supply?: string | null;
          sgst_amount?: number;
          subtotal?: number;
          supplier_gstin?: string | null;
          supplier_id?: string | null;
          supplier_name: string;
          total?: number;
          updated_at?: string | null;
        };
        Update: {
          business_id?: string;
          cgst_amount?: number;
          created_at?: string | null;
          entry_date?: string;
          entry_number?: string;
          gst_amount?: number;
          id?: string;
          igst_amount?: number;
          place_of_supply?: string | null;
          sgst_amount?: number;
          subtotal?: number;
          supplier_gstin?: string | null;
          supplier_id?: string | null;
          supplier_name?: string;
          total?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_entries_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_entries_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      state_code: {
        Row: {
          code: string;
          gst_code: string | null;
          id: string;
          name: string;
        };
        Insert: {
          code: string;
          gst_code?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          code?: string;
          gst_code?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      subchapter: {
        Row: {
          chapter_id: string;
          chapter_id_int: number | null;
          id: string;
          name: string;
          subchapter_id: number;
        };
        Insert: {
          chapter_id: string;
          chapter_id_int?: number | null;
          id?: string;
          name: string;
          subchapter_id: number;
        };
        Update: {
          chapter_id?: string;
          chapter_id_int?: number | null;
          id?: string;
          name?: string;
          subchapter_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "subchapter_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapter";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string | null;
          id: string;
          plan: string | null;
          razorpay_customer_id: string | null;
          razorpay_subscription_id: string | null;
          status: string | null;
          subscription_end_date: string | null;
          subscription_start_date: string | null;
          trial_end_date: string | null;
          trial_start_date: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          plan?: string | null;
          razorpay_customer_id?: string | null;
          razorpay_subscription_id?: string | null;
          status?: string | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          trial_end_date?: string | null;
          trial_start_date?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          plan?: string | null;
          razorpay_customer_id?: string | null;
          razorpay_subscription_id?: string | null;
          status?: string | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          trial_end_date?: string | null;
          trial_start_date?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          address: string | null;
          business_id: string;
          created_at: string | null;
          email: string | null;
          gstin: string | null;
          id: string;
          name: string;
          phone: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          business_id: string;
          created_at?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          business_id?: string;
          created_at?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      tax_period_summaries: {
        Row: {
          business_id: string;
          created_at: string | null;
          id: string;
          input_gst: number;
          net_gst: number;
          output_gst: number;
          period_end: string;
          period_start: string;
          total_purchases: number;
          total_sales: number;
          updated_at: string | null;
        };
        Insert: {
          business_id: string;
          created_at?: string | null;
          id?: string;
          input_gst?: number;
          net_gst?: number;
          output_gst?: number;
          period_end: string;
          period_start: string;
          total_purchases?: number;
          total_sales?: number;
          updated_at?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string | null;
          id?: string;
          input_gst?: number;
          net_gst?: number;
          output_gst?: number;
          period_end?: string;
          period_start?: string;
          total_purchases?: number;
          total_sales?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tax_period_summaries_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      current_gst_rates: {
        Row: {
          applies_to_type: Database["public"]["Enums"]["code_type"] | null;
          cess_rate: number | null;
          cgst_rate: number | null;
          condition_text: string | null;
          effective_from: string | null;
          effective_to: string | null;
          exclusion_codes: string[] | null;
          hsn_end: string | null;
          hsn_start: string | null;
          id: string | null;
          igst_rate: number | null;
          is_exempt: boolean | null;
          notification_id: string | null;
          priority: number | null;
          sac_code: string | null;
          sgst_rate: number | null;
          source_type: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      get_current_gst_rate: {
        Args: { p_hsn_sac_code: string; p_transaction_date: string };
        Returns: {
          cess_rate: number;
          cgst_rate: number;
          igst_rate: number;
          is_exempt: boolean;
          sgst_rate: number;
          source: string;
        }[];
      };
      get_gst_rate: {
        Args: { p_code: string; p_date?: string };
        Returns: {
          cess_rate: number;
          cgst_rate: number;
          code: string;
          condition_text: string;
          effective_from: string;
          igst_rate: number;
          is_exempt: boolean;
          notification_number: string;
          sgst_rate: number;
          source_type: string;
        }[];
      };
      increment_usage: {
        Args: { p_usage_type: string; p_user_id: string };
        Returns: undefined;
      };
      match_hsn_semantic: {
        Args: { match_count?: number; query_vector: string };
        Returns: {
          hsn_code: string;
          id: string;
          name: string;
          rate_above_threshold: number;
          rate_below_threshold: number;
          rate_type: string;
          reverse_charge: boolean;
          similarity: number;
          subchapter_id: string;
          tax_rate: number;
          threshold_amount: number;
        }[];
      };
      search_hsn_sac_codes: {
        Args: { limit_count?: number; search_query: string };
        Returns: {
          code: string;
          description: string;
          id: string;
          type: Database["public"]["Enums"]["code_type"];
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "user";
      authority_type: "CBIC" | "GST_COUNCIL" | "STATE";
      code_type: "HSN" | "SAC";
      industry_type:
        | "general"
        | "retail"
        | "restaurant"
        | "manufacturing"
        | "services"
        | "healthcare"
        | "construction";
      notification_status: "pending" | "parsed" | "failed" | "superseded";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      authority_type: ["CBIC", "GST_COUNCIL", "STATE"],
      code_type: ["HSN", "SAC"],
      industry_type: [
        "general",
        "retail",
        "restaurant",
        "manufacturing",
        "services",
        "healthcare",
        "construction",
      ],
      notification_status: ["pending", "parsed", "failed", "superseded"],
    },
  },
} as const;
