import React from 'react';
import { AppHeader } from '@/components/common/app-header';
import { DesktopSidebar } from '@/components/common/sidebar';
import { MobileBottomNav } from '@/components/common/bottom-nav';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let shopName = 'Cult Kulture';
  let userEmail: string | undefined;

  try {
    const supabase = await createClient();
    const [settingsRes, userRes] = await Promise.all([
      supabase
        .from('shop_settings')
        .select('shop_name')
        .eq('id', 1)
        .maybeSingle(),
      supabase.auth.getUser(),
    ]);

    const settingsData = settingsRes.data as { shop_name?: string } | null;
    if (settingsData?.shop_name) {
      shopName = settingsData.shop_name;
    }
    if (userRes.data?.user?.email) {
      userEmail = userRes.data.user.email;
    }
  } catch {
    // Fallback default
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader shopName={shopName} />
      <div className="flex flex-1">
        <DesktopSidebar userEmail={userEmail} />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
