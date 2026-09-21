'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Plus, ShoppingCart } from 'lucide-react';
import { formatISTDate } from '@/lib/utils/dates';

interface AppHeaderProps {
  shopName?: string;
}

export function AppHeader({ shopName = 'Cult Kulture' }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const todayIST = formatISTDate(new Date());

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors select-none">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xs tracking-wider shadow-xs group-hover:scale-105 transition-transform">
            CK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground">
                {shopName}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Store
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden md:block">
              {todayIST}
            </p>
          </div>
        </Link>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick New Sale Action */}
          <Link
            href="/billing"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-xs transition-opacity"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New Sale</span>
          </Link>

          {/* Quick Add Stock Action */}
          <Link
            href="/inventory/add"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 border border-border/60 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stock</span>
          </Link>

          {/* Theme Toggle (Mobile visible, Desktop in sidebar) */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
        </div>
      </div>
    </header>
  );
}
