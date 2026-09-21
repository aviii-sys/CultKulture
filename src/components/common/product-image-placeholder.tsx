'use client';

import React from 'react';
import { Shirt, Sparkles, Tag } from 'lucide-react';

interface ProductImagePlaceholderProps {
  name: string;
  category?: string;
  colour?: string;
  aspectRatio?: 'aspect-[3/4]' | 'aspect-[4/5]' | 'aspect-square' | 'aspect-[16/10]';
  className?: string;
  badgeText?: string;
}

// Map common apparel colours to tasteful CSS gradient palettes
const colourPaletteMap: Record<string, { bg: string; text: string; icon: string }> = {
  black: { bg: 'from-stone-900 via-stone-800 to-neutral-900', text: 'text-stone-300', icon: 'text-stone-400' },
  white: { bg: 'from-stone-100 via-neutral-100 to-stone-200', text: 'text-stone-700', icon: 'text-stone-500' },
  grey: { bg: 'from-stone-300 via-neutral-400 to-stone-400', text: 'text-stone-800', icon: 'text-stone-600' },
  blue: { bg: 'from-slate-700 via-sky-900 to-indigo-950', text: 'text-sky-200', icon: 'text-sky-300' },
  navy: { bg: 'from-slate-900 via-blue-950 to-neutral-900', text: 'text-slate-300', icon: 'text-slate-400' },
  brown: { bg: 'from-amber-950 via-stone-800 to-amber-900', text: 'text-amber-200', icon: 'text-amber-300' },
  beige: { bg: 'from-amber-100 via-stone-100 to-stone-200', text: 'text-stone-700', icon: 'text-stone-500' },
  olive: { bg: 'from-emerald-950 via-stone-900 to-emerald-900', text: 'text-emerald-200', icon: 'text-emerald-300' },
  green: { bg: 'from-emerald-900 via-teal-950 to-stone-900', text: 'text-emerald-200', icon: 'text-emerald-300' },
  red: { bg: 'from-rose-950 via-stone-900 to-rose-900', text: 'text-rose-200', icon: 'text-rose-300' },
  maroon: { bg: 'from-rose-950 via-red-950 to-stone-900', text: 'text-rose-200', icon: 'text-rose-300' },
  tan: { bg: 'from-amber-200/60 via-stone-200 to-amber-100', text: 'text-stone-800', icon: 'text-stone-600' },
};

function renderCategoryIcon(cat?: string, className?: string) {
  const c = cat?.toLowerCase() || '';
  if (c.includes('shirt') || c.includes('top') || c.includes('t-shirt') || c.includes('jacket')) {
    return <Shirt className={className} />;
  }
  if (c.includes('accessory') || c.includes('belt') || c.includes('wallet')) {
    return <Sparkles className={className} />;
  }
  return <Tag className={className} />;
}

export function ProductImagePlaceholder({
  name,
  category = 'Apparel',
  colour,
  aspectRatio = 'aspect-[3/4]',
  className = '',
  badgeText,
}: ProductImagePlaceholderProps) {
  const normColour = (colour || '').toLowerCase().trim();
  const palette =
    colourPaletteMap[normColour] || {
      bg: 'from-stone-200/80 via-secondary/70 to-stone-300/60 dark:from-stone-900 dark:via-secondary dark:to-neutral-900',
      text: 'text-stone-700 dark:text-stone-300',
      icon: 'text-stone-400 dark:text-stone-500',
    };

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      className={`relative w-full ${aspectRatio} overflow-hidden rounded-2xl bg-gradient-to-br ${palette.bg} border border-border/60 flex flex-col justify-between p-4 group-hover:brightness-95 transition-all duration-300 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Subtle luxury grain/weave texture effect */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]" />

      {/* Top Bar: Category / Badge */}
      <div className="relative z-10 flex items-center justify-between gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-xs text-foreground/80 border border-border/40 shadow-2xs">
          {category}
        </span>
        {badgeText && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-2xs">
            {badgeText}
          </span>
        )}
      </div>

      {/* Centerpiece: Fashion Monogram / Silhouette */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-background/70 backdrop-blur-xs border border-border/50 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
          {renderCategoryIcon(category, `w-6 h-6 sm:w-7 sm:h-7 ${palette.icon}`)}
        </div>
        <span className="mt-2 text-[11px] font-bold tracking-widest uppercase opacity-40">
          {initials || 'CK'}
        </span>
      </div>

      {/* Bottom Bar: Colour & Minimal Indicator */}
      <div className="relative z-10 flex items-center justify-between text-[11px]">
        {colour ? (
          <span className="font-medium text-foreground/80 bg-background/70 backdrop-blur-xs px-2 py-0.5 rounded-md border border-border/40">
            {colour}
          </span>
        ) : (
          <span />
        )}
        <span className="text-[10px] text-muted-foreground font-semibold">
          Cult Kulture
        </span>
      </div>
    </div>
  );
}
