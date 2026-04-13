import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  score?: number;
  className?: string;
}

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        level === 'LOW' && 'bg-success/15 text-success',
        level === 'MEDIUM' && 'bg-warning/15 text-warning',
        level === 'HIGH' && 'bg-destructive/15 text-destructive',
        className
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          level === 'LOW' && 'bg-success',
          level === 'MEDIUM' && 'bg-warning animate-pulse',
          level === 'HIGH' && 'bg-destructive animate-pulse',
        )}
      />
      {level}
      {score !== undefined && (
        <span className="opacity-70">({score.toFixed(1)})</span>
      )}
    </span>
  );
}
