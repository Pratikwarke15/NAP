/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useNavigate } from 'react-router-dom';
import { 
  ScanLine, Send, Building2, User, HelpCircle, 
  Smartphone, Tv, Zap, Droplets, Car,
  Briefcase, Search, QrCode, Shield, LockKeyhole, EyeOff, ChevronRight
} from 'lucide-react';
import { TrustMeter } from '@/components/TrustMeter';
import { format } from 'date-fns';
import { useState } from 'react';
import { useBufferedTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { transactions, loading: txLoading } = useTransactions();
  const { buffered, loading: bufLoading } = useBufferedTransactions();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Balance Privacy States
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');

  if (profileLoading || txLoading || bufLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  // ─── Balance Logic ───────────────────────────────────────────
  // settledBalance  = current wallet balance (fully settled money)
  // bufferedTotal   = sum of incoming payments NOT YET accepted by user
  // totalBalance    = settledBalance + bufferedTotal (what user will have if they accept all)
  const settledBalance = Number(profile?.balance || 0);
  const bufferedTotal = buffered?.reduce((acc: number, tx: any) => acc + Number(tx.amount), 0) || 0;
  const totalBalance = settledBalance + bufferedTotal;

  const handleCheckBalance = () => {
    const savedPin = localStorage.getItem(`nap_pin_${user?.id}`);
    if (!savedPin) {
      toast.error('Please set a Security PIN in your Profile first.');
      navigate('/profile');
      return;
    }
    setShowPinModal(true);
    setPin('');
  };

  const verifyPinAndUnlock = (enteredPin: string) => {
    const savedPin = localStorage.getItem(`nap_pin_${user?.id}`);
    if (enteredPin === savedPin) {
      setIsBalanceVisible(true);
      setShowPinModal(false);
      setPin('');
    } else {
      toast.error('Incorrect Security PIN');
      setPin('');
    }
  };

  const quickActions = [
    { icon: ScanLine, label: 'Scan any QR', path: '/scan', primary: true },
    { icon: User, label: 'To Mobile or Contact', path: '/send' },
    { icon: Send, label: 'To UPI Apps', path: '/send' },
    { icon: Building2, label: 'To Bank or Self A/c', path: '/send' }
  ];

  const recharges = [
    { icon: Smartphone, label: 'Mobile Recharge', path: '/utilities' },
    { icon: Tv, label: 'DTH Recharge', path: '/utilities' },
    { icon: Zap, label: 'Electricity Bill', path: '/utilities' },
    { icon: Droplets, label: 'Water Bill', path: '/utilities' }
  ];

  const finance = [
    { icon: Briefcase, label: 'Personal Loan', path: '/finance' },
    { icon: Car, label: 'FASTag Recharge', path: '/utilities' },
    { icon: QrCode, label: 'My QR Code', path: '/myqr' },
    { icon: HelpCircle, label: 'Split Bills', path: '/split' }
  ];

  return (
    <AppLayout>
      <div className="space-y-6 pb-20 animate-slide-up bg-background relative -mt-6">
        {/* Top Header matching Paytm Theme */}
        <div className="-mx-4 md:-mx-8 px-4 md:px-8 pt-10 pb-16 bg-primary relative overflow-hidden flex flex-col items-center shadow-lg shadow-primary/30">
          <div className="flex w-full items-center justify-between z-10 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div
                onClick={() => navigate('/profile')}
                className="h-12 w-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center cursor-pointer backdrop-blur-md shadow-inner text-white font-bold text-xl hover:bg-white/30 transition-colors"
              >
                {profile?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-white">
                <p className="text-lg font-bold">Welcome, {profile?.name?.split(' ')[0] || 'User'}!</p>
                <p className="text-xs font-mono opacity-90">{profile?.upi_id || 'user@nap'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowSearch(true)}
              className="h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors border border-white/20"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        {showSearch && (
          <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md animate-in fade-in flex flex-col p-4 md:p-8">
            <div className="flex items-center gap-3 w-full max-w-3xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts, bills, features..."
                  className="w-full h-14 pl-10 pr-4 rounded-2xl border-2 border-primary/20 bg-card text-lg focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="h-14 px-4 font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <div className="w-full max-w-3xl mx-auto mt-8 grid gap-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Suggestions</p>
              {[...quickActions, ...recharges, ...finance]
                .filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 5)
                .map((a, i) => (
                  <button key={i} onClick={() => { setShowSearch(false); navigate(a.path); }} className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <a.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">{a.label}</span>
                  </button>
                ))
              }
              {searchQuery.length > 2 && (
                <button onClick={() => { setShowSearch(false); navigate(`/send?target=${searchQuery}`); }} className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left">
                  <div className="h-10 w-10 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <span>Pay: <strong>{searchQuery}</strong></span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* PIN Verification Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
            <div className="w-full max-w-xs">
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <LockKeyhole className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Enter NAP PIN</h3>
                <p className="text-sm text-muted-foreground mt-1">Authenticate to view your balance</p>
              </div>

              {/* PIN Dots */}
              <div className="flex justify-center gap-3 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl transition-all ${
                      pin[i] ? 'border-primary bg-primary/10 scale-105' : 'border-border bg-card'
                    }`}
                  >
                    {pin[i] ? '•' : ''}
                  </div>
                ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                      key === '✓'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90'
                        : key === 'C'
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                        : 'bg-card text-foreground border border-border hover:bg-muted shadow-sm'
                    }`}
                    onClick={() => {
                      if (key === 'C') {
                        setPin('');
                      } else if (key === '✓') {
                        verifyPinAndUnlock(pin);
                      } else if (pin.length < 4) {
                        const newPin = pin + String(key);
                        setPin(newPin);
                        if (newPin.length === 4) {
                          setTimeout(() => verifyPinAndUnlock(newPin), 120);
                        }
                      }
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <button
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
                onClick={() => { setShowPinModal(false); setPin(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto space-y-6 px-4 md:px-8">
          {/* Floating Quick Actions */}
          <div className="-mt-12 relative z-20 rounded-2xl bg-card border border-border shadow-xl p-4 grid grid-cols-4 gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center text-center gap-3 p-2 hover:bg-muted/50 rounded-xl transition-all group"
              >
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-md ${
                  action.primary
                    ? 'bg-primary text-primary-foreground border border-primary/50'
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  <action.icon className={`w-6 h-6 ${action.primary ? 'animate-pulse' : ''}`} />
                </div>
                <span className="text-[11px] md:text-xs font-semibold leading-tight text-foreground/90">{action.label}</span>
              </button>
            ))}
          </div>

          {/* ─── BANK BALANCE — Protected by NAP PIN ─── */}
          {!isBalanceVisible ? (
            <button
              onClick={handleCheckBalance}
              className="w-full relative z-20 rounded-2xl bg-card border border-border shadow-lg p-5 flex items-center justify-between hover:bg-primary/5 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/20">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-foreground">Check Bank Balance</h3>
                  <p className="text-xs text-muted-foreground">Enter NAP PIN to view settled &amp; buffered funds</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <LockKeyhole className="w-4 h-4" />
                <ChevronRight className="w-5 h-5 group-hover:text-foreground transition-colors" />
              </div>
            </button>
          ) : (
            <div className="space-y-3 relative z-20 animate-in slide-in-from-top-2 duration-300">
              {/* Total Balance Card — full width, gradient */}
              <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 shadow-xl text-primary-foreground">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-medium opacity-75 uppercase tracking-widest">Net Balance (Total)</p>
                    <p className="text-[10px] opacity-60 mt-0.5">Wallet + All Pending Incoming</p>
                  </div>
                  <button onClick={() => setIsBalanceVisible(false)} className="opacity-60 hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all">
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-4xl font-bold font-mono tracking-tight">
                  ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/60 rounded-full"
                    style={{ width: `${(settledBalance / Math.max(1, totalBalance)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] opacity-70 mt-1">
                  <span>Settled: {((settledBalance / Math.max(1, totalBalance)) * 100).toFixed(0)}%</span>
                  <span>Buffered: {((bufferedTotal / Math.max(1, totalBalance)) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Two sub-cards side by side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Wallet Balance (Settled) */}
                <div
                  className="bg-card border border-border rounded-2xl p-4 shadow-md flex flex-col justify-between hover:border-success/40 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate('/finance')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Wallet Balance</p>
                    <div className="h-7 w-7 rounded-full bg-success/10 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-success" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    ₹{settledBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-success font-semibold mt-2 flex items-center gap-1">
                    ✓ Fully Settled
                  </p>
                </div>

                {/* Buffered Incoming */}
                <div
                  className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 rounded-2xl p-4 shadow-md flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate('/trust-buffer')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Pending Incoming</p>
                    <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <LockKeyhole className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
                    ₹{bufferedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 font-semibold mt-2">
                    {buffered.length} payment{buffered.length !== 1 ? 's' : ''} awaiting acceptance
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trust Score Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-card to-muted border border-border overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px]" />
            <TrustMeter
              score={Number(profile?.trust_score || 0)}
              level={
                Number(profile?.trust_score || 0) >= 75 ? 'LOW' :
                Number(profile?.trust_score || 0) >= 45 ? 'MEDIUM' : 'HIGH'
              }
            />
          </div>

          {/* Bills & Recharges */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold ml-1 flex items-center gap-2">
              My Bills &amp; Recharges
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">New Offers</span>
            </h3>
            <div className="rounded-2xl bg-card border border-border shadow-lg p-4 grid grid-cols-4 gap-2">
              {recharges.map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center text-center gap-3 p-2 hover:bg-muted/50 rounded-xl transition-all group"
                >
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-medium leading-tight text-muted-foreground group-hover:text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Finance Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold ml-1">Loans &amp; Credit Cards</h3>
            <div className="rounded-2xl bg-card border border-border shadow-lg p-4 grid grid-cols-4 gap-2">
              {finance.map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center text-center gap-3 p-2 hover:bg-muted/50 rounded-xl transition-all group"
                >
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-medium leading-tight text-muted-foreground group-hover:text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between ml-1">
              <h3 className="text-sm font-bold">Recent Transactions</h3>
              <button onClick={() => navigate('/history')} className="text-xs text-primary font-semibold hover:underline bg-primary/10 px-3 py-1 rounded-full">View All</button>
            </div>
            <div className="bg-card border border-border rounded-2xl shadow-lg divide-y divide-border">
              {transactions.slice(0, 3).map((tx) => {
                const isSender = tx.sender_id === user?.id;
                return (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isSender ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                      }`}>
                        {isSender ? <Send className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{isSender ? 'Paid To' : 'Received From'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'dd MMM, hh:mm a')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isSender ? 'text-foreground' : 'text-success'}`}>
                        {isSender ? '-' : '+'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </p>
                      <p className={`text-[10px] font-bold uppercase ${
                        tx.status === 'SETTLED' ? 'text-success' :
                        tx.status === 'BUFFERED' ? 'text-warning' : 'text-destructive'
                      }`}>{tx.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
