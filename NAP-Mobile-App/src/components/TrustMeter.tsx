import { RiskBadge } from '@/components/RiskBadge';

export function TrustMeter({ score, level }: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  // Futuristic half-circle gauge or line gauge
  const percentage = Math.max(0, Math.min(100, score));
  
  let glowColor = 'shadow-[0_0_15px_var(--success)]';
  let barColor = 'bg-success';
  if (level === 'MEDIUM') {
    glowColor = 'shadow-[0_0_15px_var(--warning)]';
    barColor = 'bg-warning';
  } else if (level === 'HIGH') {
    glowColor = 'shadow-[0_0_15px_var(--destructive)]';
    barColor = 'bg-destructive';
  }

  return (
    <div className="relative p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center space-y-4 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      
      <div className="text-center">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Trust Gravity Score
        </h3>
        <div className="flex items-end justify-center gap-2">
          <span className="text-5xl font-mono font-bold text-foreground tracking-tighter">
            {score.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground pb-1">/ 100</span>
        </div>
      </div>

      <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden relative border border-white/10">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${barColor} ${glowColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between w-full text-xs font-mono text-muted-foreground">
        <span>0 (HIGH RISK)</span>
        <RiskBadge level={level} />
        <span>100 (TRUSTED)</span>
      </div>
    </div>
  );
}
