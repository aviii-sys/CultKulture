'use server';

import { createClient } from '@/lib/supabase/server';
import { Bill, DashboardSummaryData } from '@/types';
import {
  getCurrentISTMonthString,
  formatMonthLabel,
  getRecentMonthsList,
  getISTStartAndEndOfToday,
} from '@/lib/utils/dates';

export interface LowStockVariantItem {
  id: string;
  product_name: string;
  category: string | null;
  brand: string | null;
  colour: string | null;
  size: string | null;
  quantity: number;
  low_stock_threshold: number;
}

export interface DashboardData {
  month: string;
  month_label: string;
  is_current_month: boolean;
  summary: DashboardSummaryData;
  recent_bills: Bill[];
  low_stock_variants: LowStockVariantItem[];
  available_months: Array<{ value: string; label: string }>;
}

export interface DashboardActionResult {
  success?: boolean;
  data?: DashboardData;
  error?: string;
}

/**
 * Server action to fetch comprehensive dashboard data for a specified month.
 * Defaults to current month in Asia/Kolkata timezone.
 */
export async function getDashboardDataAction(
  targetMonth?: string
): Promise<DashboardActionResult> {
  try {
    const supabase = (await createClient()) as any;

    const currentMonthStr = getCurrentISTMonthString();
    const activeMonth = targetMonth && /^\d{4}-\d{2}$/.test(targetMonth)
      ? targetMonth
      : currentMonthStr;
    const isCurrentMonth = activeMonth === currentMonthStr;

    // 1. Prepare parameters
    const targetMonthDate = `${activeMonth}-01`;
    const { startISO: todayStart, endISO: todayEnd } = getISTStartAndEndOfToday();

    // 2. Dispatch all 4 Supabase queries concurrently in parallel via Promise.all
    const [
      { data: summaryRpcData, error: summaryError },
      { data: todayBillsData },
      { data: recentBillsData },
      { data: variantsData },
    ] = await Promise.all([
      // Query 1: PostgreSQL dashboard_summary() RPC
      supabase.rpc('dashboard_summary', { p_month: targetMonthDate }),

      // Query 2: Today's active bills with item quantities
      supabase
        .from('bills')
        .select('id, total, profit, bill_items(qty)')
        .eq('status', 'active')
        .gte('created_at', todayStart)
        .lt('created_at', todayEnd),

      // Query 3: Recent 8 bills for feed
      supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8),

      // Query 4: Inventory low-stock / out-of-stock variants
      supabase
        .from('variants')
        .select(`
          id,
          colour,
          size,
          quantity,
          low_stock_threshold,
          archived,
          products (
            id,
            name,
            category,
            brand,
            archived
          )
        `)
        .eq('archived', false)
        .order('quantity', { ascending: true })
        .limit(50),
    ]);

    if (summaryError) {
      console.error('dashboard_summary RPC error:', summaryError);
      return { error: 'Unable to load dashboard data. Please try again.' };
    }

    const todayBillsCount = todayBillsData?.length || 0;
    const todayItemsSold = (todayBillsData || []).reduce(
      (acc: number, bill: any) =>
        acc +
        (Array.isArray(bill.bill_items)
          ? bill.bill_items.reduce((s: number, bi: any) => s + (Number(bi.qty) || 0), 0)
          : 0),
      0
    );

    const summary: DashboardSummaryData = {
      month: summaryRpcData?.month || activeMonth,
      month_revenue: Number(summaryRpcData?.month_revenue || 0),
      month_discounts: Number(summaryRpcData?.month_discounts || 0),
      month_cost: Number(summaryRpcData?.month_cost || 0),
      month_profit: Number(summaryRpcData?.month_profit || 0),
      month_bills_count: Number(summaryRpcData?.month_bills_count || 0),
      month_items_sold: Number(summaryRpcData?.month_items_sold || 0),
      today_sales: Number(summaryRpcData?.today_sales || 0),
      today_cost: Number(summaryRpcData?.today_cost || 0),
      today_profit: Number(summaryRpcData?.today_profit || 0),
      today_bills_count: todayBillsCount,
      today_items_sold: todayItemsSold,
      profit_by_day: Array.isArray(summaryRpcData?.profit_by_day)
        ? summaryRpcData.profit_by_day.map((d: any) => ({
            date: d.date,
            revenue: Number(d.revenue || 0),
            discounts: Number(d.discounts || 0),
            cost: Number(d.cost || 0),
            profit: Number(d.profit || 0),
            bills_count: Number(d.bills_count || 0),
          }))
        : [],
      top_sellers: Array.isArray(summaryRpcData?.top_sellers)
        ? summaryRpcData.top_sellers.map((ts: any) => ({
            product_name: ts.product_name || '',
            colour: ts.colour || '',
            size: ts.size || '',
            qty_sold: Number(ts.qty_sold || 0),
            revenue: Number(ts.revenue || 0),
          }))
        : [],
    };

    const lowStockVariants: LowStockVariantItem[] = [];
    (variantsData || []).forEach((v: any) => {
      if (v.products && !v.products.archived) {
        const threshold = Number(v.low_stock_threshold ?? 2);
        if (v.quantity <= threshold) {
          lowStockVariants.push({
            id: v.id,
            product_name: v.products.name,
            category: v.products.category,
            brand: v.products.brand || null,
            colour: v.colour,
            size: v.size,
            quantity: Number(v.quantity),
            low_stock_threshold: threshold,
          });
        }
      }
    });

    const payload: DashboardData = {
      month: activeMonth,
      month_label: formatMonthLabel(activeMonth),
      is_current_month: isCurrentMonth,
      summary,
      recent_bills: (recentBillsData || []) as Bill[],
      low_stock_variants: lowStockVariants.slice(0, 10),
      available_months: getRecentMonthsList(12),
    };

    return {
      success: true,
      data: payload,
    };
  } catch (err: unknown) {
    console.error('Unexpected error in getDashboardDataAction:', err);
    return {
      error: err instanceof Error ? err.message : 'Failed to fetch dashboard data',
    };
  }
}
