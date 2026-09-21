'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  X,
  Plus,
} from 'lucide-react';
import { Bill } from '@/types';
import { BillsTable } from './bills-table';
import { BillsCardList } from './bills-card-list';
import { BillDetailModal } from './bill-detail-modal';
import { RupeeDisplay } from '@/components/common/rupee-display';

interface BillsViewProps {
  initialBills: Bill[];
}

export function BillsView({ initialBills }: BillsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSelectedId = searchParams.get('id');

  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'voided'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState('');

  // Selected bill for detail modal
  const [selectedBillId, setSelectedBillId] = useState<string | null>(initialSelectedId);
  const [isDetailOpen, setIsDetailOpen] = useState(Boolean(initialSelectedId));

  // Handle URL changes
  const handleSelectBill = (id: string) => {
    setSelectedBillId(id);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedBillId(null);
    // Clear URL query param if present
    if (searchParams.get('id')) {
      router.replace('/bills');
    }
  };

  const handleBillVoided = (id: string) => {
    setBills((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: 'voided', voided_at: new Date().toISOString() }
          : b
      )
    );
  };

  // Filtered bills
  const filteredBills = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return bills.filter((bill) => {
      // 1. Status filter
      if (statusFilter !== 'ALL' && bill.status !== statusFilter) {
        return false;
      }

      // 2. Search query (bill_number, customer_name, phone)
      if (q) {
        const matchesNumber = bill.bill_number.toLowerCase().includes(q);
        const matchesCustomer = bill.customer_name?.toLowerCase().includes(q);
        const matchesPhone = bill.phone?.toLowerCase().includes(q);

        if (!matchesNumber && !matchesCustomer && !matchesPhone) {
          return false;
        }
      }

      // 3. Date filter
      if (dateFilter !== 'ALL') {
        const billDate = new Date(bill.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'TODAY') {
          const check = new Date(billDate);
          check.setHours(0, 0, 0, 0);
          if (check.getTime() !== today.getTime()) return false;
        } else if (dateFilter === 'YESTERDAY') {
          const yest = new Date(today);
          yest.setDate(yest.getDate() - 1);
          const check = new Date(billDate);
          check.setHours(0, 0, 0, 0);
          if (check.getTime() !== yest.getTime()) return false;
        } else if (dateFilter === 'LAST_7_DAYS') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (billDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'CUSTOM' && customDate) {
          const billDateStr = billDate.toISOString().slice(0, 10);
          if (billDateStr !== customDate) return false;
        }
      }

      return true;
    });
  }, [bills, searchQuery, statusFilter, dateFilter, customDate]);

  // Key metrics from current list
  const activeBills = filteredBills.filter((b) => b.status === 'active');
  const totalRevenue = activeBills.reduce((sum, b) => sum + b.total, 0);
  const totalProfit = activeBills.reduce((sum, b) => sum + b.profit, 0);
  const voidedCount = filteredBills.filter((b) => b.status === 'voided').length;

  return (
    <div className="space-y-6">
      {/* Header & New Bill Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Bills & Sales History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Audit trail of sequential bills (INV-YYYY-XXXX), status tracking, and returns.
          </p>
        </div>

        <Link
          href="/billing"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Bill (POS)</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Active Bills
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
            {activeBills.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Total Revenue
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
            <RupeeDisplay amount={totalRevenue} size="xl" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Total Profit (Est)
          </span>
          <div className="text-xl sm:text-2xl font-extrabold mt-1">
            <RupeeDisplay amount={totalProfit} size="xl" showColor />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Cancelled Bills
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {voidedCount}
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Bill Number (e.g. INV-2026-0001), Customer, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-border bg-background text-xs font-medium outline-hidden focus:border-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3 flex rounded-xl bg-secondary p-1 border border-border">
            {(
              [
                { key: 'ALL', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'voided', label: 'Voided' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === tab.key
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold outline-hidden focus:border-sky-500"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="CUSTOM">Specific Date</option>
            </select>

            {dateFilter === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-10 px-2 rounded-xl border border-border bg-background text-xs outline-hidden"
              />
            )}
          </div>
        </div>
      </div>

      {/* Responsive View: Desktop Table & Mobile Cards */}
      <div className="hidden md:block">
        <BillsTable bills={filteredBills} onSelectBill={handleSelectBill} />
      </div>

      <div className="md:hidden">
        <BillsCardList bills={filteredBills} onSelectBill={handleSelectBill} />
      </div>

      {/* Bill Detail Modal */}
      <BillDetailModal
        billId={selectedBillId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onBillVoided={handleBillVoided}
      />
    </div>
  );
}
