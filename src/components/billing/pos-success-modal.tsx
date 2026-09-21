'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Receipt,
  PlusCircle,
  Download,
  Share2,
  AlertCircle,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { getOrGenerateBillPdfAction } from '@/lib/actions/pdf-actions';
import {
  formatWhatsAppBillMessage,
  getWhatsAppUrl,
  shareBillPdf,
} from '@/lib/utils/share';

interface PosSuccessModalProps {
  isOpen: boolean;
  billData: {
    bill_id: string;
    bill_number: string;
    total: number;
    customer_name?: string;
    phone?: string | null;
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
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [prevBillId, setPrevBillId] = useState<string | null>(null);

  // Reset state during render when a new bill arrives (official React recommendation)
  if (billData?.bill_id && billData.bill_id !== prevBillId) {
    setPrevBillId(billData.bill_id);
    setSignedUrl(null);
    setPdfError(null);
    setStatusNotice(null);
    setIsGenerating(true);
  }

  // Auto-generate or retrieve PDF in background when modal opens
  useEffect(() => {
    let ignore = false;
    const currentId = billData?.bill_id;
    const currentNum = billData?.bill_number;

    if (isOpen && currentId) {
      getOrGenerateBillPdfAction(currentId)
        .then((result) => {
          if (ignore) return;
          if (result.error) {
            setPdfError('Sale completed, but the PDF could not be generated.');
          } else if (result.signedUrl) {
            setSignedUrl(result.signedUrl);
            setFileName(result.fileName || `${currentNum || 'bill'}.pdf`);
          }
        })
        .catch(() => {
          if (ignore) return;
          setPdfError('Sale completed, but the PDF could not be generated.');
        })
        .finally(() => {
          if (ignore) return;
          setIsGenerating(false);
        });
    }

    return () => {
      ignore = true;
    };
  }, [isOpen, billData?.bill_id, billData?.bill_number]);

  if (!isOpen || !billData) return null;

  // Manual Retry PDF Generation (isolated from sale creation)
  const handleRetry = async () => {
    setIsGenerating(true);
    setPdfError(null);
    try {
      const result = await getOrGenerateBillPdfAction(billData.bill_id);
      if (result.error) {
        setPdfError('Sale completed, but the PDF could not be generated.');
      } else if (result.signedUrl) {
        setSignedUrl(result.signedUrl);
        setFileName(result.fileName || `${billData.bill_number}.pdf`);
      }
    } catch {
      setPdfError('Sale completed, but the PDF could not be generated.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 1. Download PDF handler
  const handleDownloadPdf = async () => {
    setStatusNotice(null);
    let url = signedUrl;
    if (!url) {
      setIsGenerating(true);
      const res = await getOrGenerateBillPdfAction(billData.bill_id);
      setIsGenerating(false);
      if (res.error || !res.signedUrl) {
        setPdfError('Sale completed, but the PDF could not be generated.');
        return;
      }
      url = res.signedUrl;
      setSignedUrl(res.signedUrl);
      setFileName(res.fileName || `${billData.bill_number}.pdf`);
    }

    // Trigger download via anchor
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `${billData.bill_number}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusNotice('Downloading bill PDF...');
  };

  // 2. WhatsApp Share handler
  const handleWhatsAppShare = async () => {
    setStatusNotice(null);
    const message = formatWhatsAppBillMessage(
      {
        bill_number: billData.bill_number,
        customer_name: billData.customer_name || 'Walk-in Customer',
        total: billData.total,
        payment_mode: (billData.payment_mode as any) || 'Cash',
      },
      'Cult Kulture'
    );

    const waUrl = getWhatsAppUrl(billData.phone, message);

    // Also ensure PDF is downloaded so user can attach it in WhatsApp
    if (!signedUrl) {
      handleDownloadPdf();
    }

    // Open WhatsApp deep link
    window.open(waUrl, '_blank');
    setStatusNotice(
      billData.phone
        ? 'Opened WhatsApp. If sending the bill PDF, please attach the downloaded file.'
        : 'Opened WhatsApp. Please select a contact and attach the bill PDF.'
    );
  };

  // 3. Native Web Share handler
  const handleNativeShare = async () => {
    setStatusNotice(null);
    let url = signedUrl;
    if (!url) {
      setIsGenerating(true);
      const res = await getOrGenerateBillPdfAction(billData.bill_id);
      setIsGenerating(false);
      if (res.error || !res.signedUrl) {
        setPdfError('Sale completed, but the PDF could not be generated.');
        return;
      }
      url = res.signedUrl;
      setSignedUrl(res.signedUrl);
      setFileName(res.fileName || `${billData.bill_number}.pdf`);
    }

    const message = formatWhatsAppBillMessage(
      {
        bill_number: billData.bill_number,
        customer_name: billData.customer_name || 'Walk-in Customer',
        total: billData.total,
        payment_mode: (billData.payment_mode as any) || 'Cash',
      },
      'Cult Kulture'
    );

    const shareRes = await shareBillPdf({
      signedUrl: url,
      fileName: fileName || `${billData.bill_number}.pdf`,
      title: `Bill ${billData.bill_number} - Cult Kulture`,
      text: message,
    });

    if (shareRes.success) {
      setStatusNotice(shareRes.fileShared ? 'Shared bill PDF successfully!' : 'Shared bill link.');
    } else if (shareRes.error) {
      // Fallback: Download file directly
      handleDownloadPdf();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-5 sm:p-7 text-center space-y-5 max-h-[95vh] overflow-y-auto">
        {/* Animated Checkmark */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9 sm:w-10 sm:h-10" />
        </div>

        <div>
          <span className="text-[11px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
            Sale Completed Successfully
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
            {billData.bill_number}
          </h2>
        </div>

        {/* Bill Receipt Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-secondary/30 space-y-2.5 text-left text-xs">
          <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
            <span className="text-muted-foreground font-medium">Grand Total</span>
            <RupeeDisplay amount={billData.total} size="xl" className="text-foreground" />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Customer</span>
            <span className="font-semibold text-foreground">
              {billData.customer_name || 'Walk-in Customer'}
            </span>
          </div>

          {billData.phone && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Phone</span>
              <span className="font-semibold text-foreground">{billData.phone}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Payment Mode</span>
            <span className="font-semibold text-foreground px-2 py-0.5 rounded-md bg-secondary border border-border/60">
              {billData.payment_mode || 'Cash'}
            </span>
          </div>
        </div>

        {/* PDF Failure Banner & TRY AGAIN button (isolated from sale creation) */}
        {pdfError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2 text-left animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{pdfError}</span>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isGenerating}
              className="w-full py-2 px-3 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>TRY AGAIN</span>
            </button>
          </div>
        )}

        {/* Status Notice if applicable */}
        {statusNotice && !pdfError && (
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 text-sky-800 dark:text-sky-300 text-[11px] text-left">
            {statusNotice}
          </div>
        )}

        {/* Action Priority (Mobile First): 1. Share, 2. WhatsApp, 3. Download PDF */}
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Share Button */}
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isGenerating}
              className="py-3 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>SHARE</span>
            </button>

            {/* 2. WhatsApp Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-3 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WHATSAPP</span>
            </button>
          </div>

          {/* 3. Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>{isGenerating ? 'GENERATING PDF...' : 'DOWNLOAD PDF'}</span>
          </button>
        </div>

        {/* Secondary Navigation: View Bill & New Bill */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => onViewBill(billData.bill_id)}
            className="py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-secondary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
            <span>View Bill</span>
          </button>

          <button
            type="button"
            onClick={onNewBill}
            className="py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-secondary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <span>New Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
}
