import { AppLayout } from '@/components/AppLayout';
import { Award, Gift, Sparkles, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Rewards() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Rewards</h2>
            <p className="text-sm text-muted-foreground">
              Cashback and exclusive NAP benefits
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 border border-warning/20 shadow-[0_0_20px_var(--warning)] animate-pulse">
            <Award className="h-6 w-6 text-warning" />
          </div>
        </div>

        {/* Total Earned */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-card to-background p-6 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
          
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Total Cashback Earned
          </h3>
          <h1 className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-success via-primary to-warning filter drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]">
            ₹0
          </h1>
          <p className="mt-4 text-xs text-muted-foreground">Keep scanning and sending money to earn scratch cards!</p>
        </div>

        {/* Scratch Cards Mock */}
        <h3 className="font-semibold text-foreground pt-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Unscratched Cards
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <button
              key={i}
              onClick={() => toast.info("Hold tight! True random rewards engine is under construction.")}
              className="aspect-square rounded-2xl border-2 border-white/5 bg-gradient-to-tr from-primary/20 to-purple-500/20 backdrop-blur-sm flex flex-col items-center justify-center gap-2 group hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-all"
            >
              <Gift className="w-10 h-10 text-white/50 group-hover:text-white transition-colors animate-bounce" />
              <span className="text-xs font-medium text-white/70">Tap to Scratch</span>
            </button>
          ))}
        </div>

        {/* Offers List */}
        <h3 className="font-semibold text-foreground pt-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-warning" /> Partner Offers
        </h3>
        <div className="space-y-3">
          {[
            { tag: 'Amazon', desc: 'Flat 5% Cashback on electronics', bg: 'bg-blue-500/10', color: 'text-blue-500' },
            { tag: 'Zomato', desc: 'Up to ₹150 off on weekend orders', bg: 'bg-red-500/10', color: 'text-red-500' },
            { tag: 'Uber', desc: 'Next 3 rides at 20% discount', bg: 'bg-zinc-500/10', color: 'text-zinc-500' },
          ].map((offer, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-xl border border-white/5 bg-card/40 p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${offer.bg} ${offer.color}`}>
                  {offer.tag[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{offer.tag}</h4>
                  <p className="text-xs text-muted-foreground">{offer.desc}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-full text-xs">Claim</Button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
