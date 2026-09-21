import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { BillsView } from '@/components/billing/bills-view';
import { Bill } from '@/types';

export const dynamic = 'force-dynamic';

export default async function BillsPage() {
  const supabase = (await createClient()) as any;

  // Fetch bills ordered by newest first
  const { data: bills, error } = await supabase
    .from('bills')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bills:', error);
  }

  return (
    <div className="space-y-6">
      <BillsView initialBills={(bills || []) as Bill[]} />
    </div>
  );
}
