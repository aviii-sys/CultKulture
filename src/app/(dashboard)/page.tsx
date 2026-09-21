import React from 'react';
import { getDashboardDataAction } from '@/lib/actions/dashboard-actions';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const result = await getDashboardDataAction();

  if (result.error || !result.data) {
    return (
      <div className="p-12 text-center rounded-3xl border border-destructive/20 bg-destructive/5 space-y-3">
        <h3 className="font-bold text-base text-foreground">Unable to load dashboard</h3>
        <p className="text-xs text-muted-foreground">
          {result.error || 'Could not retrieve dashboard metrics from server.'}
        </p>
      </div>
    );
  }

  return <DashboardView initialData={result.data} />;
}
