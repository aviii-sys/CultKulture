'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ReceiptText,
  Settings,
  BarChart3,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'New Bill (POS)',
    href: '/billing',
    icon: ShoppingCart,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Boxes,
  },
  {
    name: 'Bills History',
    href: '/bills',
    icon: ReceiptText,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-sm p-4 min-h-[calc(100vh-57px)]">
      <div className="space-y-1">
        {navigationItems.map((item) => {
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Quick POS Shortcut Info */}
      <div className="mt-auto pt-6">
        <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground mb-1">
            <Tag className="w-3.5 h-3.5 text-sky-500" />
            <span>Cult Kulture POS</span>
          </div>
          <p className="leading-relaxed">
            Fast billing counter with live profit snapshots and instant stock verification.
          </p>
        </div>
      </div>
    </aside>
  );
}
