'use client';

import React from 'react';
import { Bill } from '@/types';
import { formatISTDate, formatISTTime } from '@/lib/utils/dates';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { ChevronRight, Receipt } from 'lucide-react';

interface BillsTableProps {
  bills: Bill[];
  onSelectBill: (billId: string) => void;
}

export function BillsTable({ bills, onSelectBill }: BillsTableProps) {
  if (bills.length === 0) {
    return (
      <div className="p-16 text-center text-muted-foreground bg-card rounded-3xl border border-dashed border-border flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-3 text-muted-foreground">
          <Receipt className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">No bills recorded yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete a sale in the POS register to view sales receipts here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-secondary/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
          <tr>
            <th className="p-4">Bill Number</th>
            <th className="p-4">Customer</th>
            <th className="p-4">Date & Time</th>
            <th className="p-4">Payment</th>
            <th className="p-4 text-right">Amount</th>
            <th className="p-4 text-right">Profit (Est)</th>
            <th className="p-4 text-center">Status</th>
            <th className="p-4 text-center w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {bills.map((bill) => {
            const isVoided = bill.status === 'voided';

            return (
              <tr
                key={bill.id}
                onClick={() => onSelectBill(bill.id)}
                className="hover:bg-secondary/30 transition-colors cursor-pointer group"
              >
                {/* Bill Number */}
                <td className="p-4 font-mono font-bold text-foreground group-hover:underline">
                  {bill.bill_number}
                </td>

                {/* Customer */}
                <td className="p-4">
                  <div className="font-semibold text-foreground">{bill.customer_name}</div>
                  {bill.phone && (
                    <div className="text-[11px] text-muted-foreground">{bill.phone}</div>
                  )}
                </td>

                {/* Date & Time */}
                <td className="p-4 text-muted-foreground">
                  <div>{formatISTDate(bill.created_at)}</div>
                  <div className="text-[11px] opacity-75">{formatISTTime(bill.created_at)}</div>
                </td>

                {/* Payment Method */}
                <td className="p-4">
                  <span className="font-medium px-2.5 py-0.5 rounded-full bg-secondary border border-border/60 text-foreground text-[11px]">
                    {bill.payment_mode}
                  </span>
                </td>

                {/* Amount */}
                <td className="p-4 text-right">
                  <RupeeDisplay
                    amount={bill.total}
                    size="sm"
                    className={`font-bold ${isVoided ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                  />
                </td>

                {/* Profit (Owner Internal) */}
                <td className="p-4 text-right">
                  <RupeeDisplay
                    amount={isVoided ? 0 : bill.profit}
                    size="sm"
                    showColor={!isVoided}
                    className={isVoided ? 'text-muted-foreground line-through' : ''}
                  />
                </td>

                {/* Status */}
                <td className="p-4 text-center">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isVoided
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {bill.status}
                  </span>
                </td>

                {/* Arrow */}
                <td className="p-4 text-center text-muted-foreground group-hover:text-foreground">
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
