import { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type ShopSettings = Tables<'shop_settings'>;
export type Product = Tables<'products'>;
export type Variant = Tables<'variants'>;
export type StockEntry = Tables<'stock_entries'>;
export type Bill = Tables<'bills'>;
export type BillItem = Tables<'bill_items'>;
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Split';

export interface ProductWithVariants extends Product {
  variants: Variant[];
}

export interface BillWithItems extends Bill {
  items: BillItem[];
}

export interface CartItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  colour: string;
  size: string;
  qty: number;
  available_stock: number;
  unit_selling_price: number;
  line_discount: number; // Discount in Rupees for the line
  cost_price: number;
}

export interface DashboardSummaryData {
  month: string; // YYYY-MM
  month_revenue: number;
  month_discounts: number;
  month_cost: number;
  month_profit: number;
  month_bills_count: number;
  month_items_sold: number;
  today_sales: number;
  today_cost: number;
  today_profit: number;
  today_bills_count: number;
  today_items_sold: number;
  profit_by_day: Array<{
    date: string;
    revenue: number;
    discounts: number;
    cost: number;
    profit: number;
    bills_count: number;
  }>;
  top_sellers: Array<{
    product_name: string;
    colour: string;
    size: string;
    qty_sold: number;
    revenue: number;
  }>;
}
