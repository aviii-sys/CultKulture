'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Ban, Loader2 } from 'lucide-react';
import { voidBillAction } from '@/lib/actions/billing-actions';

interface VoidConfirmModalProps {
  bill: {
    id: string;
    bill_number: string;
    customer_name: string;
    total: number;
    status: 'active' | 'voided';
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (billId: string) => void;
}

export function VoidConfirmModal({
  bill,
  isOpen,
  onClose,
  onSuccess,
}: VoidConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !bill) return null;

  const isAlreadyVoided = bill.status === 'voided';

  const handleConfirm = async () => {
    if (isAlreadyVoided) {
      setErrorMsg('This bill has already been cancelled.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await voidBillAction({
        bill_id: bill.id,
        reason: reason.trim() || undefined,
      });

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      onSuccess(bill.id);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to cancel bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-card w-full max-w-md rounded-3xl border border-destructive/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border bg-destructive/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-destructive font-bold text-base">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Cancel Bill {bill.bill_number}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          {isAlreadyVoided ? (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
              This bill has already been cancelled.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  Are you sure you want to cancel this bill?
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The sold stock will be returned to inventory and this sale will no longer count toward revenue or profit.
                </p>
              </div>

              {/* Bill brief */}
              <div className="p-3 rounded-xl bg-secondary/50 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold">{bill.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                    Active
                  </span>
                </div>
              </div>

              {/* Optional Reason Input */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Customer returned goods, wrong size chosen..."
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-xs outline-hidden focus:border-destructive transition-colors resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                  {errorMsg}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-border font-semibold text-xs hover:bg-secondary transition-colors"
          >
            Go Back
          </button>
          {!isAlreadyVoided && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Ban className="w-4 h-4" />
              )}
              <span>Confirm Void</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
