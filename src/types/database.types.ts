export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      app_owner: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      shop_settings: {
        Row: {
          id: number;
          shop_name: string;
          address: string | null;
          phone: string | null;
          logo_url: string | null;
          bill_footer: string;
          currency_symbol: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          shop_name?: string;
          address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          bill_footer?: string;
          currency_symbol?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          shop_name?: string;
          address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          bill_footer?: string;
          currency_symbol?: string;
          updated_at?: string;
        };
      };
      login_attempts: {
        Row: {
          id: string;
          ip: string;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          ip: string;
          attempted_at?: string;
        };
        Update: {
          id?: string;
          ip?: string;
          attempted_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          brand: string | null;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          brand?: string | null;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          brand?: string | null;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      variants: {
        Row: {
          id: string;
          product_id: string;
          colour: string | null;
          size: string | null;
          quantity: number;
          cost_price: number;
          selling_price: number;
          low_stock_threshold: number;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          colour?: string | null;
          size?: string | null;
          quantity?: number;
          cost_price?: number;
          selling_price?: number;
          low_stock_threshold?: number;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          colour?: string | null;
          size?: string | null;
          quantity?: number;
          cost_price?: number;
          selling_price?: number;
          low_stock_threshold?: number;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_entries: {
        Row: {
          id: string;
          variant_id: string;
          qty: number;
          cost_per_unit: number;
          supplier: string | null;
          purchase_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          qty: number;
          cost_per_unit: number;
          supplier?: string | null;
          purchase_date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          qty?: number;
          cost_per_unit?: number;
          supplier?: string | null;
          purchase_date?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      bill_sequences: {
        Row: {
          year: number;
          last_number: number;
        };
        Insert: {
          year: number;
          last_number?: number;
        };
        Update: {
          year?: number;
          last_number?: number;
        };
      };
      bills: {
        Row: {
          id: string;
          bill_number: string;
          customer_name: string;
          phone: string | null;
          payment_mode: 'Cash' | 'UPI' | 'Card' | 'Split';
          subtotal: number;
          total_item_discount: number;
          bill_discount: number;
          total_discount: number;
          total: number;
          total_cost: number;
          profit: number;
          status: 'active' | 'voided';
          notes: string | null;
          pdf_path: string | null;
          voided_at: string | null;
          void_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_number: string;
          customer_name?: string;
          phone?: string | null;
          payment_mode: 'Cash' | 'UPI' | 'Card' | 'Split';
          subtotal?: number;
          total_item_discount?: number;
          bill_discount?: number;
          total_discount?: number;
          total?: number;
          total_cost?: number;
          profit?: number;
          status?: 'active' | 'voided';
          notes?: string | null;
          pdf_path?: string | null;
          voided_at?: string | null;
          void_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bill_number?: string;
          customer_name?: string;
          phone?: string | null;
          payment_mode?: 'Cash' | 'UPI' | 'Card' | 'Split';
          subtotal?: number;
          total_item_discount?: number;
          bill_discount?: number;
          total_discount?: number;
          total?: number;
          total_cost?: number;
          profit?: number;
          status?: 'active' | 'voided';
          notes?: string | null;
          pdf_path?: string | null;
          voided_at?: string | null;
          void_reason?: string | null;
          created_at?: string;
        };
      };
      bill_items: {
        Row: {
          id: string;
          bill_id: string;
          variant_id: string;
          product_name: string;
          colour: string | null;
          size: string | null;
          qty: number;
          unit_selling_price: number;
          line_gross: number;
          line_discount: number;
          allocated_bill_discount: number;
          unit_cost_price: number;
          line_total: number;
          line_cost: number;
          line_profit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          variant_id: string;
          product_name: string;
          colour?: string | null;
          size?: string | null;
          qty: number;
          unit_selling_price: number;
          line_gross: number;
          line_discount?: number;
          allocated_bill_discount?: number;
          unit_cost_price: number;
          line_total: number;
          line_cost: number;
          line_profit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          bill_id?: string;
          variant_id?: string;
          product_name?: string;
          colour?: string | null;
          size?: string | null;
          qty?: number;
          unit_selling_price?: number;
          line_gross?: number;
          line_discount?: number;
          allocated_bill_discount?: number;
          unit_cost_price?: number;
          line_total?: number;
          line_cost?: number;
          line_profit?: number;
          created_at?: string;
        };
      };
    };
    Functions: {
      is_owner: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      add_stock_batch: {
        Args: {
          p_product: Json;
          p_variants: Json;
        };
        Returns: Json;
      };
      create_bill: {
        Args: {
          p_customer_name: string;
          p_phone: string;
          p_payment_mode: string;
          p_bill_discount: number;
          p_notes: string;
          p_items: Json;
        };
        Returns: Json;
      };
      void_bill: {
        Args: {
          p_bill_id: string;
          p_reason?: string;
        };
        Returns: Json;
      };
      dashboard_summary: {
        Args: {
          p_month?: string;
        };
        Returns: Json;
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
  };
}
