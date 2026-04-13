import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/hooks/useProfile';
import { Shield, CreditCard, Settings, User, LogOut, ChevronRight, LockKeyhole, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  
  const [activeModal, setActiveModal] = useState<'bank' | 'pin' | null>(null);
  
  // Bank AC State
  const [bankAccounts, setBankAccounts] = useState<{ id: string, name: string, last4: string }[]>([]);
  const [newBankName, setNewBankName] = useState('');
  const [newBankAcc, setNewBankAcc] = useState('');
  
  // PIN State
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  useEffect(() => {
    if (user) {
      const storedBanks = localStorage.getItem(`nap_banks_${user.id}`);
      if (storedBanks) setBankAccounts(JSON.parse(storedBanks));
    }
  }, [user]);

  const saveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || newBankAcc.length < 4) {
      toast.error('Enter valid bank details');
      return;
    }
    const newAcc = { id: Date.now().toString(), name: newBankName, last4: newBankAcc.slice(-4) };
    const updated = [...bankAccounts, newAcc];
    setBankAccounts(updated);
    localStorage.setItem(`nap_banks_${user?.id}`, JSON.stringify(updated));
    setNewBankName('');
    setNewBankAcc('');
    toast.success('Bank account linked successfully');
  };

  const removeBank = (id: string) => {
    const updated = bankAccounts.filter(b => b.id !== id);
    setBankAccounts(updated);
    localStorage.setItem(`nap_banks_${user?.id}`, JSON.stringify(updated));
    toast.success('Bank account removed');
  };

  const savePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    localStorage.setItem(`nap_pin_${user?.id}`, pin);
    toast.success('Security PIN updated successfully');
    setActiveModal(null);
    setPin('');
    setConfirmPin('');
  };

  const menuItems = [
    { id: 'bank', icon: CreditCard, label: 'Linked Bank Accounts', desc: `${bankAccounts.length} accounts linked` },
    { id: 'pin', icon: LockKeyhole, label: 'Security & PIN', desc: 'Change your 4-digit NAP PIN' },
    { id: 'privacy', icon: Shield, label: 'NAP Privacy Settings', desc: 'Manage data shared with the risk engine' },
    { id: 'settings', icon: Settings, label: 'App Settings', desc: 'Language, notifications, and theme' }
  ];

  return (
    <AppLayout>
      <div className="space-y-6 pb-20 animate-slide-up">
        <h2 className="text-2xl font-bold text-foreground">Profile & Settings</h2>
        
        <div className="flex items-center gap-4 bg-card border border-border p-6 rounded-2xl shadow-lg">
          <div className="h-20 w-20 rounded-full bg-primary/20 text-primary border-4 border-background flex items-center justify-center text-3xl font-bold shadow-inner">
            {profile?.name?.charAt(0) || <User />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{profile?.name || 'NAP User'}</h3>
            <p className="text-sm font-mono text-muted-foreground mt-1">{profile?.upi_id || 'user@nap'}</p>
            <p className="text-xs text-primary font-semibold mt-1">Trust Score: {Number(profile?.trust_score || 0).toFixed(0)}/100</p>
          </div>
        </div>

        <div className="space-y-3">
          {menuItems.map((item, i) => (
            <button 
              key={i} 
              onClick={() => {
                if (item.id === 'bank') setActiveModal('bank');
                if (item.id === 'pin') setActiveModal('pin');
              }}
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        <Button onClick={signOut} variant="outline" className="w-full h-14 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 font-bold text-lg mt-8">
          <LogOut className="w-5 h-5 mr-2" /> Log Out
        </Button>

        {/* Modal Overlays */}
        {activeModal === 'bank' && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in">
            <div className="bg-card w-full md:max-w-md rounded-t-3xl md:rounded-3xl border border-border p-6 shadow-2xl animate-in slide-in-from-bottom flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><CreditCard className="text-primary w-6 h-6" /> Linked Banks</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    <p className="text-sm">No banks linked yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankAccounts.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">{b.name.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-sm tracking-wide">{b.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">**** {b.last4}</p>
                          </div>
                        </div>
                        <button onClick={() => removeBank(b.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={saveBank} className="border-t border-border pt-6 mt-6 space-y-4">
                  <h4 className="text-sm font-bold">Add New Bank</h4>
                  <div className="space-y-2">
                    <Label htmlFor="bname">Bank Name</Label>
                    <Input id="bname" value={newBankName} onChange={e => setNewBankName(e.target.value)} placeholder="e.g. HDFC Bank" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bacc">Account Number</Label>
                    <Input id="bacc" type="number" value={newBankAcc} onChange={e => setNewBankAcc(e.target.value)} placeholder="Enter full account number" required />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg"><Plus className="w-5 h-5 mr-2" /> Link Account</Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'pin' && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in">
            <div className="bg-card w-full md:max-w-md rounded-t-3xl md:rounded-3xl border border-border p-6 shadow-2xl animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><LockKeyhole className="text-primary w-6 h-6" /> Set Security PIN</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <form onSubmit={savePin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pin">New 4-Digit PIN</Label>
                  <Input 
                    id="pin" 
                    type="password" 
                    maxLength={4} 
                    value={pin} 
                    onChange={e => setPin(e.target.value.replace(/\\D/g, ''))} 
                    placeholder="••••" 
                    className="text-center text-2xl tracking-[1em] font-mono h-14" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpin">Confirm PIN</Label>
                  <Input 
                    id="cpin" 
                    type="password" 
                    maxLength={4} 
                    value={confirmPin} 
                    onChange={e => setConfirmPin(e.target.value.replace(/\\D/g, ''))} 
                    placeholder="••••" 
                    className="text-center text-2xl tracking-[1em] font-mono h-14" 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg">Save Secure PIN</Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
