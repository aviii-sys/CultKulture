'use client';

import React from 'react';
import { Bill } from '@/types';
import { formatISTDate, formatISTTime } from '@/lib/utils/dates';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { ChevronRight } from 'lucide-react';

interface BillsCardListProps {
  bills: Bill[];
  onSelectBill: (billId: string) => void;
}

export function BillsCardList({ bills, onSelectBill }: BillsCardListProps) {
  if (bills.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border text-xs">
        No bills found matching your criteria.
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
            className="p-4 rounded-2xl border border-border bg-card hover:border-sky-500/60 shadow-2xs transition-all active:scale-[0.99] cursor-pointer space-y-3"
          >
            {/* Header: Bill Number, Status, Arrow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-foreground">
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
              <span className="font-medium px-2 py-0.5 rounded-md bg-secondary text-foreground text-[11px]">
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
