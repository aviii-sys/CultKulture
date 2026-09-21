import React from 'react';
import { Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Reports & Data Exports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          CSV downloads for bills, stock inventory valuation, and monthly profit exports.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
          <Download className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold">Reports & CSV Export</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
          Scheduled for Phase 7: Instant CSV downloads for complete inventory snapshots and transaction logs.
        </p>
      </div>
    </div>
  );
}
