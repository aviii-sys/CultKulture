'use client';

import React from 'react';
import { Bill } from '@/types';
import { formatISTDate, formatISTTime } from '@/lib/utils/dates';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { ChevronRight, Receipt } from 'lucide-react';

interface BillsCardListProps {
  bills: Bill[];
  onSelectBill: (billId: string) => void;
}

export function BillsCardList({ bills, onSelectBill }: BillsCardListProps) {
  if (bills.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-card rounded-3xl border border-dashed border-border flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center mb-2.5 text-muted-foreground">
          <Receipt className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-foreground">No bills recorded yet</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Complete a sale in POS to view receipts here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bills.map((bill) => {
        const isVoided = bill.status === 'voided';

        return (
          <div
            key={bill.id}
            onClick={() => onSelectBill(bill.id)}
            className="p-4 rounded-3xl border border-border bg-card hover:border-foreground/40 shadow-xs transition-all active:scale-[0.99] cursor-pointer space-y-3"
          >
            {/* Header: Bill Number, Status, Arrow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-foreground">
                  {bill.bill_number}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isVoided
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {bill.status}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Customer & Payment Meta */}
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-foreground block">
                  {bill.customer_name}
                </span>
                {bill.phone && (
                  <span className="text-[11px] text-muted-foreground">{bill.phone}</span>
                )}
              </div>
              <span className="font-medium px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-[11px] border border-border/60">
                {bill.payment_mode}
              </span>
            </div>

            {/* Date & Financials Footer */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">
                {formatISTDate(bill.created_at)}, {formatISTTime(bill.created_at)}
              </span>

              <div className="text-right">
                <RupeeDisplay
                  amount={bill.total}
                  size="md"
                  className={`font-bold ${isVoided ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                />
                {!isVoided && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Profit: <RupeeDisplay amount={bill.profit} size="sm" showColor />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
