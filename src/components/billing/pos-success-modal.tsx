'use client';

import React from 'react';
import { CheckCircle2, Receipt, PlusCircle } from 'lucide-react';
import { RupeeDisplay } from '@/components/common/rupee-display';

interface PosSuccessModalProps {
  isOpen: boolean;
  billData: {
    bill_id: string;
    bill_number: string;
    total: number;
    customer_name?: string;
    payment_mode?: string;
  } | null;
  onNewBill: () => void;
  onViewBill: (billId: string) => void;
}

export function PosSuccessModal({
  isOpen,
  billData,
  onNewBill,
  onViewBill,
}: PosSuccessModalProps) {
  if (!isOpen || !billData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 sm:p-8 text-center space-y-6">
        {/* Animated Checkmark */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
            Sale Completed
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1 text-foreground">
            {billData.bill_number}
          </h2>
        </div>

        {/* Bill Receipt Card */}
        <div className="p-4 rounded-2xl border border-border bg-secondary/30 space-y-3 text-left">
          <div className="flex justify-between items-baseline border-b border-border/50 pb-2.5">
            <span className="text-xs text-muted-foreground font-medium">Grand Total</span>
            <RupeeDisplay amount={billData.total} size="xl" className="text-foreground" />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Customer</span>
            <span className="font-semibold text-foreground">
              {billData.customer_name || 'Walk-in Customer'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Payment Mode</span>
            <span className="font-semibold text-foreground px-2 py-0.5 rounded-md bg-secondary">
              {billData.payment_mode || 'Cash'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => onViewBill(billData.bill_id)}
            className="py-3 px-4 rounded-xl border border-border bg-card hover:bg-secondary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <span>VIEW BILL</span>
          </button>

          <button
            type="button"
            onClick={onNewBill}
            className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>NEW BILL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
