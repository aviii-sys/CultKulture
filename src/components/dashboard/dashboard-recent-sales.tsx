'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Receipt, ArrowRight, ChevronRight } from 'lucide-react';
import { Bill } from '@/types';
import { formatISTTime } from '@/lib/utils/dates';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { BillDetailModal } from '@/components/billing/bill-detail-modal';

interface DashboardRecentSalesProps {
  bills: Bill[];
  onBillVoided?: (billId: string) => void;
}

export function DashboardRecentSales({ bills, onBillVoided }: DashboardRecentSalesProps) {
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleOpenDetail = (billId: string) => {
    setSelectedBillId(billId);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedBillId(null);
  };

  return (
    <>
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-foreground">Recent Sales</h3>
            </div>
            <Link
              href="/bills"
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>VIEW ALL BILLS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {bills.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Receipt className="w-8 h-8 opacity-30 mx-auto" />
              <p className="text-xs font-medium">No sales recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {bills.map((bill) => {
                const isVoided = bill.status === 'voided';

                return (
                  <div
                    key={bill.id}
                    onClick={() => handleOpenDetail(bill.id)}
                    className="py-3 px-1 flex items-center justify-between gap-3 hover:bg-secondary/40 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400">
                            {bill.bill_number}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                              isVoided
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {bill.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {bill.customer_name} • {bill.payment_mode}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <RupeeDisplay
                          amount={bill.total}
                          size="sm"
                          className={`font-bold ${
                            isVoided ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        />
                        <div className="text-[10px] text-muted-foreground">
                          {formatISTTime(bill.created_at)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex justify-between items-center">
          <span>Click any bill to view complete receipt</span>
          <Link
            href="/billing"
            className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            New Sale
          </Link>
        </div>
      </div>

      {/* Bill Detail Modal */}
      <BillDetailModal
        billId={selectedBillId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onBillVoided={(id) => {
          if (onBillVoided) onBillVoided(id);
        }}
      />
    </>
  );
}
