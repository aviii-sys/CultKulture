import React from 'react';
import { Store } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Store Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Shop profile, contact information, receipt footer, and bill preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
          <Store className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold">Store Profile Settings</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
          Configure shop name, physical address, counter phone, and custom receipt footer.
        </p>
      </div>
    </div>
  );
}
