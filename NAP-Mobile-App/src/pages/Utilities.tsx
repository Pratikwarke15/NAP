import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  Lightbulb, 
  Wifi, 
  Tv, 
  Droplet, 
  Flame, 
  CreditCard,
  Building2,
  Car
} from 'lucide-react';
import { toast } from 'sonner';

const utilities = [
  { name: 'Mobile Recharge', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Electricity', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { name: 'Broadband', icon: Wifi, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { name: 'DTH', icon: Tv, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { name: 'Water', icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { name: 'Gas Cylinder', icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
  { name: 'Credit Card', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { name: 'Rent', icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'FASTag', icon: Car, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
];

export default function Utilities() {
  const handlePayment = (name: string) => {
    toast.success(`${name} simulated successfully. Processed through NAP Risk Engine (LOW risk).`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recharge & Pay Bills</h2>
          <p className="text-sm text-muted-foreground">
            All your utility payments, secured by Negative Acceptance Protocol
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {utilities.map((item) => (
            <button
              key={item.name}
              onClick={() => handlePayment(item.name)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all group"
            >
              <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <span className="text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors">
                {item.name}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground">Auto-Pay Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Set up recurring payments with dynamic trust verification before every deduction.
          </p>
          <Button variant="outline" className="mt-2 rounded-full" onClick={() => toast.info('You will be notified when Auto-Pay is live!')}>
            Notify Me
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
