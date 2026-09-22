import React from 'react';
import {
  Store,
  Receipt,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Database,
  Lock,
  FileCheck,
  Users,
  MessageCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { SHOP_WHATSAPP_NUMBER } from '@/lib/utils/share';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
          Store Configuration
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Shop profile, authorized store managers, POS defaults, WhatsApp sender, and system security.
        </p>
      </div>

      {/* 1. Shop Profile */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-foreground font-bold border border-border/60">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Boutique Profile</h2>
            <p className="text-xs text-muted-foreground">Store identity displayed on digital cash memos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Store Name
            </span>
            <div className="font-bold text-sm text-foreground flex items-center gap-2">
              <span>Cult Kulture</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary border border-border text-foreground">
                Active
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Store Monogram
            </span>
            <div className="font-bold text-sm text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-black">
                CK
              </span>
              <span>Cult Kulture Monogram</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Location
            </span>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Dehradun, Uttarakhand, India</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Timezone & Currency
            </span>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Asia/Kolkata (IST, UTC+5:30) • INR (₹)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Authorized Store Accounts (Phase 10: Two Authorized Users) */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-foreground font-bold border border-border/60">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Authorized Store Managers</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                2 Accounts
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Strictly whitelisted store operator credentials anchored in database RLS
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* User 1: Primary Owner */}
          <div className="p-4 rounded-2xl border border-border bg-secondary/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Account Owner
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            </div>
            <div className="font-bold text-sm text-foreground">
              avinavnegi7@gmail.com
            </div>
            <div className="text-[11px] text-muted-foreground">
              Full store privileges • Inventory, Billing, Voiding, Reports & Settings
            </div>
          </div>

          {/* User 2: Authorized Manager */}
          <div className="p-4 rounded-2xl border border-border bg-secondary/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Authorized Manager
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            </div>
            <div className="font-bold text-sm text-foreground">
              rhythamsaini99@gmail.com
            </div>
            <div className="text-[11px] text-muted-foreground">
              Full store privileges • Inventory, Billing, Voiding, Reports & Settings
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-secondary/40 border border-border text-[11px] text-muted-foreground flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
          <span>
            Public registration is permanently disabled. Only these two accounts have cryptographic access through Supabase Auth and Row-Level Security policies.
          </span>
        </div>
      </div>

      {/* 3. WhatsApp Bill Sender Configuration */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">WhatsApp Bill-Sender Configuration</h2>
            <p className="text-xs text-muted-foreground">
              Store contact number associated with retail cash memo transmission
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Store WhatsApp Number
            </span>
            <div className="font-mono font-bold text-sm text-foreground">
              {SHOP_WHATSAPP_NUMBER}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Cult Kulture business contact and designated bill sender
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Message Dispatch Protocol
            </span>
            <div className="font-bold text-sm text-foreground">
              Native Web Share / wa.me Link
            </div>
            <p className="text-[10px] text-muted-foreground">
              Zero unauthorized third-party bot relay or data leakage
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-secondary/20 border border-border text-[11px] text-muted-foreground space-y-1 leading-relaxed">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Architecture Note:</span>
          </div>
          <p>
            Standard WhatsApp (<code className="px-1 py-0.5 rounded bg-secondary text-foreground text-[10px]">wa.me</code>) deep links open WhatsApp on the operating counter device and transmit the bill from whichever account is logged in on that device. Customer recipient phone numbers stored on bills remain separate and protected.
          </p>
        </div>
      </div>

      {/* 4. Billing & Receipt Defaults */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-foreground font-bold border border-border/60">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Billing & Cash Memo Preferences</h2>
            <p className="text-xs text-muted-foreground">Numbering scheme and retail bill specifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Bill Sequence Format
            </span>
            <div className="font-mono font-bold text-sm text-foreground">INV-YYYY-XXXX</div>
            <p className="text-[10px] text-muted-foreground">Annual sequence reset every Jan 1</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Next Invoice
            </span>
            <div className="font-mono font-bold text-sm text-foreground">INV-2026-0001</div>
            <p className="text-[10px] text-muted-foreground">Ready for first store sale</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Supported Payments
            </span>
            <div className="font-bold text-foreground">Cash, UPI, Card, Split</div>
            <p className="text-[10px] text-muted-foreground">Instant validation & breakdown</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-secondary/20 border border-border space-y-2 text-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Standard Receipt Terms & Footer
          </span>
          <p className="text-foreground italic bg-card p-3 rounded-xl border border-border/60">
            &quot;Thank you for shopping with Cult Kulture! Goods once sold may be exchanged within 7 days with original bill tags intact.&quot;
          </p>
        </div>
      </div>

      {/* 5. Security, Storage & Architecture Status */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-foreground font-bold border border-border/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Security & System Architecture</h2>
            <p className="text-xs text-muted-foreground">Audit certifications, data protection and storage status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl border border-border bg-secondary/20 flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-foreground block">Row-Level Security (RLS)</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Strict two-manager authorization enforced at the PostgreSQL database layer via is_owner().
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-border bg-secondary/20 flex items-start gap-3">
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-foreground block">Private PDF Vault</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Bills stored securely in private Supabase Storage bucket with signed time-limited URLs.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-border bg-secondary/20 flex items-start gap-3">
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-foreground block">Atomic Ledger Transactions</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                PostgreSQL stored procedures ensure zero stock drift and atomic sales recording.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-border bg-secondary/20 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-foreground block">High-Performance Frontend</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Parallelized data fetching via Promise.all() with sub-50ms instant skeletons.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
