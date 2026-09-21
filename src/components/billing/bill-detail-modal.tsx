'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Ban,
  AlertCircle,
  Eye,
  EyeOff,
  Receipt,
  Download,
  Share2,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { BillDetailData, getBillDetailAction } from '@/lib/actions/billing-actions';
import { getOrGenerateBillPdfAction } from '@/lib/actions/pdf-actions';
import {
  formatWhatsAppBillMessage,
  getWhatsAppUrl,
  shareBillPdf,
} from '@/lib/utils/share';
import { formatISTDate, formatISTTime } from '@/lib/utils/dates';
import { formatIndianRupees } from '@/lib/utils/currency';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { VoidConfirmModal } from './void-confirm-modal';

interface BillDetailModalProps {
  billId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onBillVoided?: (billId: string) => void;
}

export function BillDetailModal({
  billId,
  isOpen,
  onClose,
  onBillVoided,
}: BillDetailModalProps) {
  const [bill, setBill] = useState<BillDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showInternalProfit, setShowInternalProfit] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  // PDF & Sharing State
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    if (!isOpen || !billId) {
      return;
    }

    async function loadBill() {
      setLoading(true);
      setErrorMsg(null);
      setPdfError(null);
      setPdfNotice(null);
      try {
        const res = await getBillDetailAction(billId!);
        if (ignore) return;
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.data) {
          setBill(res.data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load bill');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadBill();

    return () => {
      ignore = true;
    };
  }, [isOpen, billId]);

  if (!isOpen) return null;

  const isVoided = bill?.status === 'voided';

  const handleVoidSuccess = (id: string) => {
    if (bill) {
      setBill({
        ...bill,
        status: 'voided',
        voided_at: new Date().toISOString(),
      });
    }
    if (onBillVoided) {
      onBillVoided(id);
    }
  };

  // 1. Download PDF Action
  const handleDownloadPdf = async () => {
    if (!bill) return;
    setIsPdfLoading(true);
    setPdfError(null);
    setPdfNotice(null);

    try {
      const res = await getOrGenerateBillPdfAction(bill.id);
      if (res.error || !res.signedUrl) {
        setPdfError(res.error || 'Failed to generate PDF');
        return;
      }

      const link = document.createElement('a');
      link.href = res.signedUrl;
      link.download = res.fileName || `${bill.bill_number}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setPdfNotice('Downloading bill PDF...');
    } catch (err: unknown) {
      setPdfError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // 2. WhatsApp Share Action
  const handleWhatsAppShare = async () => {
    if (!bill) return;
    setIsPdfLoading(true);
    setPdfError(null);
    setPdfNotice(null);

    try {
      const res = await getOrGenerateBillPdfAction(bill.id);
      setIsPdfLoading(false);

      const message = formatWhatsAppBillMessage(
        {
          bill_number: bill.bill_number,
          customer_name: bill.customer_name,
          total: bill.total,
          payment_mode: bill.payment_mode,
        },
        'Cult Kulture'
      );

      const waUrl = getWhatsAppUrl(bill.phone, message);

      if (res.signedUrl) {
        // Trigger download for user to attach if desired
        const link = document.createElement('a');
        link.href = res.signedUrl;
        link.download = res.fileName || `${bill.bill_number}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      window.open(waUrl, '_blank');
      setPdfNotice(
        bill.phone
          ? 'Opened WhatsApp. If sending the bill PDF, please attach the downloaded file.'
          : 'Opened WhatsApp. Please select a contact and attach the bill PDF.'
      );
    } catch (err: unknown) {
      setIsPdfLoading(false);
      setPdfError(err instanceof Error ? err.message : 'Failed to open WhatsApp');
    }
  };

  // 3. Web Share Action
  const handleNativeShare = async () => {
    if (!bill) return;
    setIsPdfLoading(true);
    setPdfError(null);
    setPdfNotice(null);

    try {
      const res = await getOrGenerateBillPdfAction(bill.id);
      if (res.error || !res.signedUrl) {
        setPdfError(res.error || 'Failed to generate PDF for sharing');
        return;
      }

      const message = formatWhatsAppBillMessage(
        {
          bill_number: bill.bill_number,
          customer_name: bill.customer_name,
          total: bill.total,
          payment_mode: bill.payment_mode,
        },
        'Cult Kulture'
      );

      const shareRes = await shareBillPdf({
        signedUrl: res.signedUrl,
        fileName: res.fileName || `${bill.bill_number}.pdf`,
        title: `Bill ${bill.bill_number} - Cult Kulture`,
        text: message,
      });

      if (shareRes.success) {
        setPdfNotice(shareRes.fileShared ? 'Shared bill PDF successfully!' : 'Shared bill link.');
      } else if (shareRes.error) {
        // Fallback to downloading
        const link = document.createElement('a');
        link.href = res.signedUrl;
        link.download = res.fileName || `${bill.bill_number}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setPdfNotice('Downloaded PDF (Web Share not supported on this device).');
      }
    } catch (err: unknown) {
      setPdfError(err instanceof Error ? err.message : 'Failed to share');
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-card w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {bill ? bill.bill_number : 'Bill Details'}
                  </h3>
                  {bill && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isVoided
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {bill.status}
                    </span>
                  )}
                </div>
                {bill && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatISTDate(bill.created_at)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatISTTime(bill.created_at)}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Toolbar (Download PDF, Share, WhatsApp) */}
          {bill && !loading && (
            <div className="px-4 py-2.5 sm:px-6 bg-secondary/10 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isPdfLoading}
                  className="py-1.5 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-foreground font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{isPdfLoading ? 'Generating...' : 'Download PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={isPdfLoading}
                  className="py-1.5 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-foreground font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  disabled={isPdfLoading}
                  className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {isVoided && (
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  PDF will be marked VOIDED
                </span>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {loading && (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium">Loading bill details...</p>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {pdfError && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pdfError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="font-bold underline hover:opacity-80 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {pdfNotice && (
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 text-xs border border-sky-200 dark:border-sky-900/50">
                {pdfNotice}
              </div>
            )}

            {bill && !loading && (
              <>
                {/* Voided Notice if applicable */}
                {isVoided && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Ban className="w-4 h-4 text-rose-600" />
                      <span>This bill was cancelled on {formatISTDate(bill.voided_at)} at {formatISTTime(bill.voided_at)}</span>
                    </div>
                    {bill.void_reason && (
                      <p className="text-[11px] text-muted-foreground ml-5">
                        Reason: &quot;{bill.void_reason}&quot;
                      </p>
                    )}
                  </div>
                )}

                {/* Customer & Payment Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl border border-border bg-secondary/20 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Customer</span>
                    <span className="font-semibold text-foreground">{bill.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Phone</span>
                    <span className="font-semibold text-foreground">
                      {bill.phone || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Payment Mode</span>
                    <span className="font-semibold text-foreground">{bill.payment_mode}</span>
                    {bill.notes && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                        {bill.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Purchased Items ({bill.items.length})
                  </h4>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-secondary/40 border-b border-border text-muted-foreground">
                        <tr>
                          <th className="p-2.5 font-semibold">Item</th>
                          <th className="p-2.5 font-semibold text-center">Qty</th>
                          <th className="p-2.5 font-semibold text-right">Unit Price</th>
                          <th className="p-2.5 font-semibold text-right">Discount</th>
                          <th className="p-2.5 font-semibold text-right">Final Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {bill.items.map((item) => (
                          <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-2.5 font-medium">
                              <div className="font-bold text-foreground">{item.product_name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-secondary text-foreground">
                                  {item.colour}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                                  {item.size}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 text-center font-bold">{item.qty}</td>
                            <td className="p-2.5 text-right font-medium">
                              {formatIndianRupees(item.unit_selling_price)}
                            </td>
                            <td className="p-2.5 text-right text-rose-600 dark:text-rose-400">
                              {item.line_discount + (item.allocated_bill_discount || 0) > 0
                                ? `-${formatIndianRupees(
                                    item.line_discount + (item.allocated_bill_discount || 0)
                                  )}`
                                : '-'}
                            </td>
                            <td className="p-2.5 text-right font-bold text-foreground">
                              {formatIndianRupees(item.line_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bill Summary Breakdown */}
                <div className="p-4 rounded-2xl border border-border bg-card space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">
                      {formatIndianRupees(bill.subtotal)}
                    </span>
                  </div>

                  {bill.total_item_discount > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>Item Discounts</span>
                      <span>-{formatIndianRupees(bill.total_item_discount)}</span>
                    </div>
                  )}

                  {bill.bill_discount > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>Whole-Bill Discount</span>
                      <span>-{formatIndianRupees(bill.bill_discount)}</span>
                    </div>
                  )}

                  {bill.total_discount > 0 && (
                    <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-dashed border-border/60">
                      <span>Total Savings / Discount</span>
                      <span className="text-rose-600 dark:text-rose-400">
                        -{formatIndianRupees(bill.total_discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-border font-bold">
                    <span className="text-sm text-foreground">Grand Total</span>
                    <RupeeDisplay amount={bill.total} size="xl" className="text-sky-600 dark:text-sky-400" />
                  </div>
                </div>

                {/* Internal Profit / Cost Section (Owner View Only) */}
                <div className="p-3.5 rounded-2xl border border-border bg-secondary/30 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span>Internal Cost & Profit Analysis</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                        Store Owner Only
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInternalProfit(!showInternalProfit)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      {showInternalProfit ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showInternalProfit ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>

                  {showInternalProfit && (
                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-3 animate-in fade-in duration-150">
                      <div className="p-2.5 rounded-xl bg-card border border-border">
                        <span className="text-[11px] text-muted-foreground block">
                          Total Cost (Snapshotted)
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {formatIndianRupees(bill.total_cost)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-card border border-border">
                        <span className="text-[11px] text-muted-foreground block">
                          Net Profit Realized
                        </span>
                        <RupeeDisplay amount={bill.profit} size="sm" showColor />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer with Void Option & Close */}
          <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between gap-3">
            <div>
              {bill && !isVoided && (
                <button
                  type="button"
                  onClick={() => setIsVoidModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Void Bill</span>
                </button>
              )}
              {isVoided && (
                <span className="text-xs font-semibold text-muted-foreground">
                  This bill has been cancelled.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold hover:bg-secondary transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Void Confirmation Modal */}
      {bill && (
        <VoidConfirmModal
          bill={{
            id: bill.id,
            bill_number: bill.bill_number,
            customer_name: bill.customer_name,
            total: bill.total,
            status: bill.status,
          }}
          isOpen={isVoidModalOpen}
          onClose={() => setIsVoidModalOpen(false)}
          onSuccess={handleVoidSuccess}
        />
      )}
    </>
  );
}
