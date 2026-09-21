'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { DashboardData, getDashboardDataAction } from '@/lib/actions/dashboard-actions';
import { createClient } from '@/lib/supabase/client';
import { DashboardProfitHero } from './dashboard-profit-hero';
import { DashboardTodaySection } from './dashboard-today-section';
import { DashboardProfitChart } from './dashboard-profit-chart';
import { DashboardComparisonCard } from './dashboard-comparison-card';
import { DashboardTopSellers } from './dashboard-top-sellers';
import { DashboardLowStock } from './dashboard-low-stock';
import { DashboardRecentSales } from './dashboard-recent-sales';
import { DashboardSkeleton } from './dashboard-skeleton';

interface DashboardViewProps {
  initialData: DashboardData;
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialData.month);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authoritative fetch from server
  const fetchDashboardData = useCallback(async (month: string, showSkeleton: boolean = false) => {
    if (showSkeleton) setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await getDashboardDataAction(month);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.data) {
        setData(res.data);
      }
    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err);
      setErrorMessage('Unable to load dashboard data. Please check your connection.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  }, []);

  // Handle month change from dropdown
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    fetchDashboardData(newMonth, true);
  };

  // Supabase Realtime synchronization
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to bills table (INSERT = new sale, UPDATE = bill voided)
    // and variants table (* = stock adjustments / restocking)
    const channel = supabase
      .channel('dashboard_realtime_sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bills' },
        () => {
          // Authoritatively refetch dashboard data
          fetchDashboardData(selectedMonth, false);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bills' },
        () => {
          fetchDashboardData(selectedMonth, false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'variants' },
        () => {
          fetchDashboardData(selectedMonth, false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMonth, fetchDashboardData]);

  // Handle voiding a bill directly from the recent sales modal
  const handleBillVoided = () => {
    fetchDashboardData(selectedMonth, false);
  };

  if (errorMessage && !data) {
    return (
      <div className="p-12 text-center rounded-3xl border border-destructive/20 bg-destructive/5 space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <div>
          <h3 className="font-bold text-base text-foreground">Unable to load dashboard data</h3>
          <p className="text-xs text-muted-foreground mt-1">
            An error occurred while connecting to the database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchDashboardData(selectedMonth, true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const { summary, recent_bills, low_stock_variants, available_months, month_label, is_current_month } = data;

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Primary Hero Card: Monthly Net Profit, Editorial Greeting & Unified Hierarchy */}
      <DashboardProfitHero
        monthLabel={month_label}
        isCurrentMonth={is_current_month}
        profit={summary.month_profit}
        revenue={summary.month_revenue}
        cost={summary.month_cost}
        billsCount={summary.month_bills_count}
        itemsSold={summary.month_items_sold}
        availableMonths={available_months}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        isLoading={isLoading}
      />

      {/* 2. Today's Performance Section */}
      <DashboardTodaySection
        todaySales={summary.today_sales}
        todayProfit={summary.today_profit}
        todayBillsCount={summary.today_bills_count || 0}
        todayItemsSold={summary.today_items_sold || 0}
      />

      {/* 4 & 5. Middle Charts: Profit By Day & Revenue/Cost/Profit Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <DashboardProfitChart
            month={selectedMonth}
            monthLabel={month_label}
            data={summary.profit_by_day}
          />
        </div>
        <div className="lg:col-span-4">
          <DashboardComparisonCard
            revenue={summary.month_revenue}
            cost={summary.month_cost}
            profit={summary.month_profit}
            discounts={summary.month_discounts}
          />
        </div>
      </div>

      {/* 6, 7 & 8. Bottom Grid: Recent Sales, Top Sellers, and Low Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {/* Recent Sales Feed */}
        <DashboardRecentSales
          bills={recent_bills}
          onBillVoided={handleBillVoided}
        />

        {/* Top Selling Products */}
        <DashboardTopSellers
          items={summary.top_sellers}
          monthLabel={month_label}
        />

        {/* Low Stock Alerts */}
        <DashboardLowStock
          items={low_stock_variants}
        />
      </div>
    </div>
  );
}
