// Supabase 데이터베이스 타입 정의
// Supabase CLI gen types 형식 준수

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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          business_type?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          business_type?: string | null;
          address?: string | null;
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
