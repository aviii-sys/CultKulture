'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Receipt, ArrowRight, ChevronRight, ShoppingBag } from 'lucide-react';
import { Bill } from '@/types';
import { formatISTTime } from '@/lib/utils/dates';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { BillDetailModal } from '@/components/billing/bill-detail-modal';

interface DashboardRecentSalesProps {
  bills: Bill[];
  onBillVoided?: (billId: string) => void;
}

function getRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / (60 * 1000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatISTTime(timestamp);
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
      <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-secondary text-foreground">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">Recent Sales Feed</h3>
            </div>
            <Link
              href="/bills"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>All Bills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {bills.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground/60">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-foreground/80">Your first sale will appear here.</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Completed transactions from the POS counter appear here in real time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {bills.map((bill) => {
                const isVoided = bill.status === 'voided';

                return (
                  <div
                    key={bill.id}
                    onClick={() => handleOpenDetail(bill.id)}
                    className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-secondary/40 rounded-2xl transition-all cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenDetail(bill.id);
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-foreground group-hover:underline">
                          {bill.bill_number}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isVoided
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate flex items-center gap-1.5">
                        <span>{bill.customer_name || 'Walk-in Customer'}</span>
                        <span>•</span>
                        <span className="font-semibold text-foreground/80">{bill.payment_mode}</span>
                        <span>•</span>
                        <span>{getRelativeTime(bill.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <RupeeDisplay
                          amount={bill.total}
                          size="sm"
                          className={`font-bold ${
                            isVoided ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        />
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
          <span>Click to view retail receipt</span>
          <Link href="/billing" className="font-semibold text-foreground hover:underline">
            New Sale
          </Link>
        </div>
      </div>

      {/* Digital Receipt Modal */}
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
