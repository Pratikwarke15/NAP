import { AppLayout } from '@/components/AppLayout';
import { Users, Search, IndianRupee, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAllProfiles } from '@/hooks/useProfile';
import { useAuth } from '@/lib/authContext';

export default function SplitBills() {
  const [amount, setAmount] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const { user } = useAuth();
  const allProfiles = useAllProfiles().filter((p) => p.user_id !== user?.id);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleSplit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount to split');
      return;
    }
    if (selectedFriends.length === 0) {
      toast.error('Select at least one friend to split with');
      return;
    }
    
    // Total people = selected friends + you (1)
    const perPerson = Number(amount) / (selectedFriends.length + 1);
    toast.success(`Split successful! Requested ₹${perPerson.toFixed(2)} from ${selectedFriends.length} friends.`);
    setAmount('');
    setSelectedFriends([]);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Split Bills</h2>
          <p className="text-sm text-muted-foreground">
            Split dinners, trips, and expenses effortlessly.
          </p>
        </div>

        {/* Input Card */}
        <div className="rounded-3xl border border-white/10 bg-card/60 backdrop-blur-md p-6 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <PieChart className="w-40 h-40 text-primary" />
          </div>

          <div className="relative space-y-2 z-10 w-full max-w-sm mx-auto">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block text-center">
              Total Expense Amount
            </label>
            <div className="relative flex items-center justify-center">
              <IndianRupee className="absolute left-4 w-6 h-6 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-center text-4xl font-bold h-16 bg-background/50 border-white/10 pl-12 rounded-2xl shadow-inner focus-visible:ring-primary/50"
              />
            </div>
            {amount && selectedFriends.length > 0 && (
              <p className="text-center text-sm text-success font-medium mt-2">
                ₹{(Number(amount) / (selectedFriends.length + 1)).toFixed(2)} per person (including you)
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 z-10 relative">
            <Label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Users className="w-4 h-4 text-primary" /> Select Friends
            </Label>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search friends by name or UPI ID..." className="pl-9 bg-background/30 border-white/10 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-2 h-[200px] overflow-y-auto pr-2 rounded-xl">
              {allProfiles.map((p) => {
                const isSelected = selectedFriends.includes(p.user_id);
                return (
                  <button
                    key={p.user_id}
                    onClick={() => toggleFriend(p.user_id)}
                    className={`flex items-center gap-3 p-3 text-left rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.2)]' 
                        : 'border-white/5 bg-background/40 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-xs text-muted-foreground">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground truncate">{p.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">{p.upi_id}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <Button 
            className="w-full h-12 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.3)] text-md font-bold"
            disabled={!amount || selectedFriends.length === 0}
            onClick={handleSplit}
          >
            Split Expense
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}

// Inline Label for convenience
function Label({ children, className }: any) {
  return <label className={className}>{children}</label>;
}
