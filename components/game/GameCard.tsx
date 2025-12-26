// components/game/GameCard.tsx
'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function GameCard({
  title,
  subtitle,
  right,
  children,
  className,
  onClick,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative overflow-hidden border-white/10 bg-white/5 p-4 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_30px_80px_rgba(0,0,0,0.55)]',
        onClick ? 'cursor-pointer hover:bg-white/8 active:scale-[0.995]' : '',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      {(title || subtitle || right) && (
        <div className="relative mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <div className="text-base font-semibold">{title}</div>}
            {subtitle && <div className="mt-0.5 text-xs text-white/60">{subtitle}</div>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}

      {children && <div className="relative">{children}</div>}
    </Card>
  );
}
