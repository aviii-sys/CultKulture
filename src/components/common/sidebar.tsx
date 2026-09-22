'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ReceiptText,
  Settings,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { logoutAction } from '@/lib/actions/auth-actions';

const navigationItems = [
  {
    name: 'Overview',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Boxes,
  },
  {
    name: 'New Sale',
    href: '/billing',
    icon: ShoppingCart,
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

interface DesktopSidebarProps {
  userEmail?: string;
}

export function DesktopSidebar({ userEmail }: DesktopSidebarProps = {}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border/70 bg-card/40 backdrop-blur-xs p-5 min-h-[calc(100vh-57px)] select-none">
      {/* Editorial Boutique Navigation */}
      <div className="space-y-1.5">
        <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
          Command Center
        </div>
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
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/90" />
              )}
            </Link>
          );
        })}
      </div>

      {/* POS Quick Key Callout */}
      <div className="mt-8 rounded-2xl border border-border/80 bg-secondary/40 p-3.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Cult Kulture Retail</span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Visual inventory matrix, weighted-cost tracking, and instant POS counter checkout.
        </p>
      </div>

      {/* Owner / Profile / Actions Area */}
      <div className="mt-auto pt-6 border-t border-border/60 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Signed in as
            </span>
            <span
              className="text-[11px] font-semibold text-foreground truncate max-w-[130px]"
              title={userEmail || 'avinavnegi7@gmail.com'}
            >
              {userEmail || 'avinavnegi7@gmail.com'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            <Sun className="w-3.5 h-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-3.5 h-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
