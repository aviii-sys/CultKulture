'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Boxes, ReceiptText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const mobileNavItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'New Bill',
    href: '/billing',
    icon: ShoppingCart,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Boxes,
  },
  {
    name: 'Bills',
    href: '/bills',
    icon: ReceiptText,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg px-2 py-1 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
      <div className="grid grid-cols-5 h-14 items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center h-full min-h-[48px] rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-md transition-all',
                  isActive ? 'bg-sky-100 dark:bg-sky-950/60' : ''
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="mt-0.5 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
