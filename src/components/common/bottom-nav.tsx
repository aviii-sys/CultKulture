'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Boxes, ReceiptText, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const mobileNavItems = [
  {
    name: 'Home',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Boxes,
  },
  {
    name: 'Sell',
    href: '/billing',
    icon: ShoppingCart,
  },
  {
    name: 'Bills',
    href: '/bills',
    icon: ReceiptText,
  },
  {
    name: 'More',
    href: '/settings',
    icon: MoreHorizontal,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md px-3 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-lg"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 h-13 items-center justify-around">
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
                'flex flex-col items-center justify-center h-full min-h-[44px] rounded-xl text-[10px] font-semibold tracking-tight transition-all active:scale-95',
                isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-all',
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
