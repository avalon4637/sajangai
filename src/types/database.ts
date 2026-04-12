// Database type definitions for sajang.ai
// Follows Supabase CLI gen types format
//
// Migration order:
//   00001_initial_schema.sql      - Core tables (businesses, revenues, expenses, etc.)
//   20260224000000_rls_policies   - Granular RLS policies
//   20260224000001_api_connections - api_connections + sync_logs tables
//   00002_agent_tables.sql        - Agent system tables
//   00003_store_context.sql       - Drops agent_events, adds store_context
//   00004_hyphen_integration.sql  - Adds encrypted_credentials/last_sync_at/sync_frequency to api_connections + delivery_reviews
//   00005_daily_reports.sql       - daily_reports table
//   00006_brand_voice.sql         - brand_voice_profiles table
//   00007_subscriptions.sql       - subscriptions + payments tables
//   00008_expense_categories.sql  - expense_categories, merchant_mappings, labor_records, invoices, vendors

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          business_type: string | null;
          address: string | null;
          is_active: boolean;
          deactivated_at: string | null;
          naver_place_id: string | null;
          naver_last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          business_type?: string | null;
          address?: string | null;
          is_active?: boolean;
          deactivated_at?: string | null;
          naver_place_id?: string | null;
          naver_last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          business_type?: string | null;
          address?: string | null;
          is_active?: boolean;
          deactivated_at?: string | null;
          naver_place_id?: string | null;
          naver_last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      revenues: {
        Row: {
          id: string;
          business_id: string;
          date: string;
          channel: string | null;
          category: string | null;
          amount: number;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          date: string;
          channel?: string | null;
          category?: string | null;
          amount: number;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          date?: string;
          channel?: string | null;
          category?: string | null;
          amount?: number;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          business_id: string;
          date: string;
          type: "fixed" | "variable";
          category: string;
          amount: number;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          date: string;
          type: "fixed" | "variable";
          category: string;
          amount: number;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          date?: string;
          type?: "fixed" | "variable";
          category?: string;
          amount?: number;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      fixed_costs: {
        Row: {
          id: string;
          business_id: string;
          category: string;
          amount: number;
          is_labor: boolean;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          category: string;
          amount: number;
          is_labor: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          category?: string;
          amount?: number;
          is_labor?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      monthly_summaries: {
        Row: {
          id: string;
          business_id: string;
          year_month: string;
          total_revenue: number;
          total_expense: number;
          total_fixed_cost: number;
          total_labor_cost: number;
          gross_profit: number;
          net_profit: number;
          gross_margin: number;
          labor_ratio: number;
          fixed_cost_ratio: number;
          survival_score: number;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          year_month: string;
          total_revenue: number;
          total_expense: number;
          total_fixed_cost: number;
          total_labor_cost: number;
          gross_profit: number;
          net_profit: number;
          gross_margin: number;
          labor_ratio: number;
          fixed_cost_ratio: number;
          survival_score: number;
          calculated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          year_month?: string;
          total_revenue?: number;
          total_expense?: number;
          total_fixed_cost?: number;
          total_labor_cost?: number;
          gross_profit?: number;
          net_profit?: number;
          gross_margin?: number;
          labor_ratio?: number;
          fixed_cost_ratio?: number;
          survival_score?: number;
          calculated_at?: string;
        };
        Relationships: [];
      };
      csv_uploads: {
        Row: {
          id: string;
          business_id: string;
          file_name: string;
          file_path: string | null;
          row_count: number | null;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          file_name: string;
          file_path?: string | null;
          row_count?: number | null;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          file_name?: string;
          file_path?: string | null;
          row_count?: number | null;
          processed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      api_connections: {
        // NOTE: Two separate timestamp fields exist due to migration history:
        //   last_synced_at - added in 20260224000001_api_connections (original sync timestamp)
        //   last_sync_at   - added in 00004_hyphen_integration (Hyphen-specific sync timestamp)
        // Both fields are present in the database and should be maintained separately.
        Row: {
          id: string;
          business_id: string;
          provider: string;
          connection_type: "card_sales" | "delivery";
          status: "active" | "inactive" | "error" | "expired";
          config: Record<string, unknown>;
          last_synced_at: string | null;
          encrypted_credentials: string | null;
          last_sync_at: string | null;
          sync_frequency: "daily" | "weekly" | "manual";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          provider?: string;
          connection_type: "card_sales" | "delivery";
          status?: "active" | "inactive" | "error" | "expired";
          config?: Record<string, unknown>;
          last_synced_at?: string | null;
          encrypted_credentials?: string | null;
          last_sync_at?: string | null;
          sync_frequency?: "daily" | "weekly" | "manual";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          provider?: string;
          connection_type?: "card_sales" | "delivery";
          status?: "active" | "inactive" | "error" | "expired";
          config?: Record<string, unknown>;
          last_synced_at?: string | null;
          encrypted_credentials?: string | null;
          last_sync_at?: string | null;
          sync_frequency?: "daily" | "weekly" | "manual";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      monthly_roi_reports: {
        // Added in 20260412000001_monthly_roi_reports — Phase 2.3
        Row: {
          id: number;
          business_id: string;
          year_month: string;
          fee_savings: number;
          anomaly_prevention: number;
          cost_savings: number;
          customer_retention: number;
          time_savings: number;
          total_value: number;
          subscription_cost: number;
          roi_multiple: number;
          narrative: string | null;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          business_id: string;
          year_month: string;
          fee_savings?: number;
          anomaly_prevention?: number;
          cost_savings?: number;
          customer_retention?: number;
          time_savings?: number;
          total_value?: number;
          subscription_cost?: number;
          roi_multiple?: number;
          narrative?: string | null;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          business_id?: string;
          year_month?: string;
          fee_savings?: number;
          anomaly_prevention?: number;
          cost_savings?: number;
          customer_retention?: number;
          time_savings?: number;
          total_value?: number;
          subscription_cost?: number;
          roi_multiple?: number;
          narrative?: string | null;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      card_settlements: {
        // Added in 20260412000000_card_settlements — Phase 2.2 cashflow cache
        Row: {
          id: number;
          business_id: string;
          card_company: string;
          pay_date: string | null;
          pay_scheduled_date: string;
          sales_amount: number;
          pay_amount: number;
          fee_total: number;
          transaction_count: number;
          status: "pending" | "settled" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          business_id: string;
          card_company: string;
          pay_date?: string | null;
          pay_scheduled_date: string;
          sales_amount?: number;
          pay_amount?: number;
          fee_total?: number;
          transaction_count?: number;
          status?: "pending" | "settled" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          business_id?: string;
          card_company?: string;
          pay_date?: string | null;
          pay_scheduled_date?: string;
          sales_amount?: number;
          pay_amount?: number;
          fee_total?: number;
          transaction_count?: number;
          status?: "pending" | "settled" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_call_logs: {
        // Added in 20260411000000_ai_call_logs — Phase 0.5 observability
        Row: {
          id: number;
          business_id: string | null;
          caller: string | null;
          function_name: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          cache_read_tokens: number | null;
          cache_write_tokens: number | null;
          cost_krw: number;
          latency_ms: number;
          status: "success" | "error";
          error_code: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          business_id?: string | null;
          caller?: string | null;
          function_name: string;
          model: string;
          input_tokens?: number;
          output_tokens?: number;
          cache_read_tokens?: number | null;
          cache_write_tokens?: number | null;
          cost_krw?: number;
          latency_ms?: number;
          status: "success" | "error";
          error_code?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          business_id?: string | null;
          caller?: string | null;
          function_name?: string;
          model?: string;
          input_tokens?: number;
          output_tokens?: number;
          cache_read_tokens?: number | null;
          cache_write_tokens?: number | null;
          cost_krw?: number;
          latency_ms?: number;
          status?: "success" | "error";
          error_code?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      delivery_reviews: {
        Row: {
          id: string;
          business_id: string;
          platform: "baemin" | "coupangeats" | "yogiyo" | "naver_place";
          external_id: string | null;
          rating: number;
          content: string | null;
          customer_name: string | null;
          order_summary: string | null;
          review_date: string;
          ai_reply: string | null;
          reply_status: "pending" | "auto_published" | "draft" | "published" | "skipped";
          sentiment_score: number | null;
          keywords: string[] | null;
          replied_at: string | null;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          platform: "baemin" | "coupangeats" | "yogiyo" | "naver_place";
          external_id?: string | null;
          rating: number;
          content?: string | null;
          customer_name?: string | null;
          order_summary?: string | null;
          review_date: string;
          ai_reply?: string | null;
          reply_status?: "pending" | "auto_published" | "draft" | "published" | "skipped";
          sentiment_score?: number | null;
          keywords?: string[] | null;
          replied_at?: string | null;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          platform?: "baemin" | "coupangeats" | "yogiyo" | "naver_place";
          external_id?: string | null;
          rating?: number;
          content?: string | null;
          customer_name?: string | null;
          order_summary?: string | null;
          review_date?: string;
          ai_reply?: string | null;
          reply_status?: "pending" | "auto_published" | "draft" | "published" | "skipped";
          sentiment_score?: number | null;
          keywords?: string[] | null;
          replied_at?: string | null;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      agent_profiles: {
        Row: {
          id: string;
          business_id: string;
          agent_type: "manager" | "dapjangi" | "seri" | "viral";
          display_name: string;
          is_active: boolean;
          config: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          agent_type: "manager" | "dapjangi" | "seri" | "viral";
          display_name: string;
          is_active?: boolean;
          config?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          agent_type?: "manager" | "dapjangi" | "seri" | "viral";
          display_name?: string;
          is_active?: boolean;
          config?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          business_id: string;
          agent_type: "manager" | "dapjangi" | "seri" | "viral" | "team";
          title: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          agent_type: "manager" | "dapjangi" | "seri" | "viral" | "team";
          title?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          agent_type?: "manager" | "dapjangi" | "seri" | "viral" | "team";
          title?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          business_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          agent_type: "manager" | "dapjangi" | "seri" | "viral" | null;
          // metadata is jsonb DEFAULT '{}' in SQL (no NOT NULL constraint) — treat as nullable
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          business_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          agent_type?: "manager" | "dapjangi" | "seri" | "viral" | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          business_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          agent_type?: "manager" | "dapjangi" | "seri" | "viral" | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          business_id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          token_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          token_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          session_id?: string;
          role?: "user" | "assistant";
          content?: string;
          token_count?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      conversation_summaries: {
        Row: {
          id: string;
          business_id: string;
          session_id: string;
          summary: string;
          key_facts: string[];
          follow_ups: string[];
          message_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          session_id: string;
          summary: string;
          key_facts?: string[];
          follow_ups?: string[];
          message_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          session_id?: string;
          summary?: string;
          key_facts?: string[];
          follow_ups?: string[];
          message_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      agent_memory: {
        Row: {
          id: string;
          business_id: string;
          agent_type: "manager" | "dapjangi" | "seri" | "viral";
          memory_type: "fact" | "preference" | "insight" | "decision";
          content: string;
          importance: number;
          source_message_id: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          agent_type: "manager" | "dapjangi" | "seri" | "viral";
          memory_type: "fact" | "preference" | "insight" | "decision";
          content: string;
          importance?: number;
          source_message_id?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          agent_type?: "manager" | "dapjangi" | "seri" | "viral";
          memory_type?: "fact" | "preference" | "insight" | "decision";
          content?: string;
          importance?: number;
          source_message_id?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      store_context: {
        Row: {
          id: string;
          business_id: string;
          agent_type: "dapjangi" | "seri" | "viral";
          context_data: Record<string, unknown>;
          summary: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          agent_type: "dapjangi" | "seri" | "viral";
          context_data?: Record<string, unknown>;
          summary?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          agent_type?: "dapjangi" | "seri" | "viral";
          context_data?: Record<string, unknown>;
          summary?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_activity_log: {
        Row: {
          id: string;
          business_id: string;
          agent_type: "manager" | "dapjangi" | "seri" | "viral" | "system";
          action: string;
          summary: string;
          // details is jsonb DEFAULT '{}' in SQL (no NOT NULL constraint) — treat as nullable
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          agent_type: "manager" | "dapjangi" | "seri" | "viral" | "system";
          action: string;
          summary: string;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          agent_type?: "manager" | "dapjangi" | "seri" | "viral" | "system";
          action?: string;
          summary?: string;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sync_logs: {
        Row: {
          id: string;
          connection_id: string;
          sync_type: "card_sales" | "delivery";
          status: "pending" | "running" | "completed" | "failed";
          records_count: number;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          connection_id: string;
          sync_type: "card_sales" | "delivery";
          status?: "pending" | "running" | "completed" | "failed";
          records_count?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          connection_id?: string;
          sync_type?: "card_sales" | "delivery";
          status?: "pending" | "running" | "completed" | "failed";
          records_count?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      daily_reports: {
        Row: {
          id: string;
          business_id: string;
          report_date: string;
          report_type: "seri_profit" | "seri_cashflow" | "seri_cost" | "dapjangi_review" | "jeongjang_briefing" | "review_weekly" | "cross_diagnosis";
          content: Record<string, unknown>;
          summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          report_date: string;
          report_type: "seri_profit" | "seri_cashflow" | "seri_cost" | "dapjangi_review" | "jeongjang_briefing" | "review_weekly" | "cross_diagnosis";
          content: Record<string, unknown>;
          summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          report_date?: string;
          report_type?: "seri_profit" | "seri_cashflow" | "seri_cost" | "dapjangi_review" | "jeongjang_briefing" | "review_weekly" | "cross_diagnosis";
          content?: Record<string, unknown>;
          summary?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      brand_voice_profiles: {
        Row: {
          id: string;
          business_id: string;
          sample_replies: string[];
          voice_traits: Record<string, unknown>;
          tone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          sample_replies?: string[];
          voice_traits?: Record<string, unknown>;
          tone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          sample_replies?: string[];
          voice_traits?: Record<string, unknown>;
          tone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          business_id: string;
          plan: "trial" | "paid";
          status: "trial" | "active" | "past_due" | "cancelled" | "expired";
          billing_key: string | null;
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancelled_at: string | null;
          billed_business_count: number;
          base_price_krw: number;
          extra_business_price_krw: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          plan?: "trial" | "paid";
          status?: "trial" | "active" | "past_due" | "cancelled" | "expired";
          billing_key?: string | null;
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancelled_at?: string | null;
          billed_business_count?: number;
          base_price_krw?: number;
          extra_business_price_krw?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          plan?: "trial" | "paid";
          status?: "trial" | "active" | "past_due" | "cancelled" | "expired";
          billing_key?: string | null;
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancelled_at?: string | null;
          billed_business_count?: number;
          base_price_krw?: number;
          extra_business_price_krw?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          subscription_id: string;
          amount: number;
          status: "pending" | "paid" | "failed" | "refunded";
          portone_payment_id: string | null;
          paid_at: string | null;
          failed_reason: string | null;
          retry_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          amount?: number;
          status?: "pending" | "paid" | "failed" | "refunded";
          portone_payment_id?: string | null;
          paid_at?: string | null;
          failed_reason?: string | null;
          retry_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          amount?: number;
          status?: "pending" | "paid" | "failed" | "refunded";
          portone_payment_id?: string | null;
          paid_at?: string | null;
          failed_reason?: string | null;
          retry_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      expense_categories: {
        Row: {
          id: string;
          business_id: string;
          major_category: string;
          sub_category: string;
          display_order: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          major_category: string;
          sub_category: string;
          display_order?: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          major_category?: string;
          sub_category?: string;
          display_order?: number;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      merchant_mappings: {
        Row: {
          id: string;
          business_id: string;
          merchant_name_pattern: string;
          major_category: string;
          sub_category: string | null;
          confidence: number;
          usage_count: number;
          created_by: "user" | "ai";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          merchant_name_pattern: string;
          major_category: string;
          sub_category?: string | null;
          confidence?: number;
          usage_count?: number;
          created_by?: "user" | "ai";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          merchant_name_pattern?: string;
          major_category?: string;
          sub_category?: string | null;
          confidence?: number;
          usage_count?: number;
          created_by?: "user" | "ai";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      labor_records: {
        Row: {
          id: string;
          business_id: string;
          employee_name: string;
          payment_date: string;
          gross_amount: number;
          deductions: number;
          net_amount: number;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          employee_name: string;
          payment_date: string;
          gross_amount: number;
          deductions?: number;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          employee_name?: string;
          payment_date?: string;
          gross_amount?: number;
          deductions?: number;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          business_id: string;
          type: "receivable" | "payable";
          counterparty: string;
          amount: number;
          issue_date: string;
          due_date: string | null;
          paid_date: string | null;
          status: "pending" | "paid" | "overdue";
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          type: "receivable" | "payable";
          counterparty: string;
          amount: number;
          issue_date: string;
          due_date?: string | null;
          paid_date?: string | null;
          status?: "pending" | "paid" | "overdue";
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          type?: "receivable" | "payable";
          counterparty?: string;
          amount?: number;
          issue_date?: string;
          due_date?: string | null;
          paid_date?: string | null;
          status?: "pending" | "paid" | "overdue";
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          category: string | null;
          contact_name: string | null;
          phone: string | null;
          business_number: string | null;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          category?: string | null;
          contact_name?: string | null;
          phone?: string | null;
          business_number?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          category?: string | null;
          contact_name?: string | null;
          phone?: string | null;
          business_number?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          business_id: string;
          communication_style: "concise" | "detailed" | "conversational";
          focus_area: "revenue" | "review" | "cost" | "all";
          notification_time: "morning" | "evening" | "both";
          active_hours_start: number;
          active_hours_end: number;
          onboarding_completed: boolean;
          role: "user" | "admin";
          push_token: string | null;
          push_platform: "android" | "ios" | "web" | null;
          notification_preferences: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          communication_style?: "concise" | "detailed" | "conversational";
          focus_area?: "revenue" | "review" | "cost" | "all";
          notification_time?: "morning" | "evening" | "both";
          active_hours_start?: number;
          active_hours_end?: number;
          onboarding_completed?: boolean;
          role?: "user" | "admin";
          push_token?: string | null;
          push_platform?: "android" | "ios" | "web" | null;
          notification_preferences?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          communication_style?: "concise" | "detailed" | "conversational";
          focus_area?: "revenue" | "review" | "cost" | "all";
          notification_time?: "morning" | "evening" | "both";
          active_hours_start?: number;
          active_hours_end?: number;
          onboarding_completed?: boolean;
          role?: "user" | "admin";
          push_token?: string | null;
          push_platform?: "android" | "ios" | "web" | null;
          notification_preferences?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_feedback: {
        Row: {
          id: string;
          business_id: string | null;
          source: "chat" | "briefing" | "review_reply" | "diagnosis" | "seri_report";
          source_id: string | null;
          rating: 1 | -1;
          prompt_version: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string | null;
          source: "chat" | "briefing" | "review_reply" | "diagnosis" | "seri_report";
          source_id?: string | null;
          rating: 1 | -1;
          prompt_version?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string | null;
          source?: "chat" | "briefing" | "review_reply" | "diagnosis" | "seri_report";
          source_id?: string | null;
          rating?: 1 | -1;
          prompt_version?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for convenience
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
