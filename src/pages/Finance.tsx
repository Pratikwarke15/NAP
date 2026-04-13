import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { LineChart, HandCoins, ShieldCheck, Gem, TrendingUp, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const services = [
  { name: 'Personal Loan', icon: HandCoins, desc: 'Up to ₹5 Lakhs instantly', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Credit Lines', icon: Briefcase, desc: 'Pay later with zero interest', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { name: 'Health Insurance', icon: ShieldCheck, desc: 'Protect your family', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { name: 'Digital Gold', icon: Gem, desc: 'Start investing from ₹10', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { name: 'Mutual Funds', icon: TrendingUp, desc: 'High yield tax saving', color: 'text-success', bg: 'bg-success/10' },
  { name: 'US Stocks', icon: LineChart, desc: 'Invest in global tech', color: 'text-primary', bg: 'bg-primary/10' },
];

export default function Finance() {
  const handleFeature = (name: string) => {
    toast.info(`${name} is currently in closed beta. Join the waitlist!`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Wealth & Insurance</h2>
          <p className="text-sm text-muted-foreground">
            Grow your portfolio and secure your future with NAP verified partners.
          </p>
        </div>

        {/* Portfolio Mini-Dashboard */}
        <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-md p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <LineChart className="w-40 h-40 text-primary" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Total Investment Value
          </p>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-4xl font-bold text-foreground">₹0.00</h3>
            <span className="text-sm mt-2 px-2 py-1 rounded-full bg-success/20 text-success border border-success/30 font-medium">
              +0.00%
            </span>
          </div>
          <Button variant="outline" className="rounded-full shadow-[0_0_15px_rgba(var(--primary),0.15)]">
            Explore Portfolios
          </Button>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((item) => (
            <div 
              key={item.name}
              onClick={() => handleFeature(item.name)}
              className="group cursor-pointer rounded-2xl border border-white/5 bg-background/50 hover:bg-white/5 backdrop-blur-sm p-4 transition-all hover:border-primary/30 flex items-center gap-4 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.bg} transition-transform group-hover:scale-110`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.name}
                </h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
