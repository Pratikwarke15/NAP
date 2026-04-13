/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/lib/authContext';
import { useProfile, useAllProfiles } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import {
  computeTrustGravityScore,
  generateTransactionHash,
  generateNearbyLocation,
  type TransactionContext,
} from '@/lib/riskEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RiskBadge } from '@/components/RiskBadge';
import { toast } from 'sonner';
import { Send, AlertTriangle, CheckCircle2, Shield, QrCode, Building2, LockKeyhole } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SendMoney() {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const allProfiles = useAllProfiles();
  const navigate = useNavigate();
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // New Super-app states
  const [selectedBank, setSelectedBank] = useState('wallet');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  
  const [bankAccounts, setBankAccounts] = useState<{ id: string, name: string, last4: string }[]>([]);
  const [savedPin, setSavedPin] = useState<string | null>(null);

  const otherProfiles = allProfiles.filter((p) => p.user_id !== user?.id);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('target');
    if (target) setRecipientIdentifier(target);
    
    // Load banks and PIN
    if (user) {
      const banks = localStorage.getItem(`nap_banks_${user.id}`);
      if (banks) setBankAccounts(JSON.parse(banks));
      const sp = localStorage.getItem(`nap_pin_${user.id}`);
      if (sp) setSavedPin(sp);
    }
  }, [user]);

  const triggerPinAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const receiver = otherProfiles.find((p) => p.email === recipientIdentifier || p.upi_id === recipientIdentifier);
    if (!receiver) {
      toast.error('Recipient not found. They must have a NAP account.');
      return;
    }
    
    // Open the PIN modal instead of directly sending
    setShowPinModal(true);
    setPin('');
  };

  const handleSend = async () => {
    if (pin.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }
    if (savedPin && pin !== savedPin) {
      toast.error('Incorrect Security PIN');
      setPin('');
      return;
    }
    
    setShowPinModal(false);
    setLoading(true);
    setResult(null);

    const amt = parseFloat(amount);

    // Always verify latest balance from DB before allowing transaction
    const { data: freshProfile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('user_id', user!.id)
      .single();

    const availableBalance = Number(freshProfile?.balance || 0);

    if (amt > availableBalance) {
      toast.error('Insufficient balance');
      setLoading(false);
      return;
    }

    // Find receiver (already validated above, but keeping for flow)
    const receiver = otherProfiles.find((p) => p.email === recipientIdentifier || p.upi_id === recipientIdentifier);
    if (!receiver) {
      toast.error('Recipient not found. They must have a NAP account.');
      setLoading(false);
      return;
    }
    const { data: receiverProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', receiver.user_id)
      .single();

    if (!receiverProfile) {
      toast.error('Could not load recipient profile');
      setLoading(false);
      return;
    }

    // Get historical data
    const { data: historicalTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('sender_id', user!.id)
      .order('created_at', { ascending: false });

    const sharedTx = (historicalTx || []).filter(
      (t) => t.receiver_id === receiver.user_id
    );

    const amounts = (historicalTx || []).map((t) => Number(t.amount));
    const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;

    // Today's transaction count
    const today = new Date().toISOString().split('T')[0];
    const dailyCount = (historicalTx || []).filter(
      (t) => t.created_at.startsWith(today)
    ).length;

    // Capture real-time geolocation (fallback to home location if denied)
    let newLocation = {
      lat: Number(profile.home_lat) || 19.076,
      lng: Number(profile.home_lng) || 72.8777,
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });

        newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (error) {
        console.warn('Geolocation unavailable, using fallback location');
      }
    }

    const senderLocs = Array.isArray(profile.recent_locations) ? profile.recent_locations : [];
    const updatedLocs = [newLocation, ...senderLocs].slice(0, 5);
    await supabase.from('profiles').update({ recent_locations: updatedLocs }).eq('user_id', user!.id);

    // Build context for risk engine
    const ctx: TransactionContext = {
      amount: amt,
      senderProfile: {
        user_id: user!.id,
        name: profile.name,
        balance: Number(profile.balance),
        trust_score: Number(profile.trust_score),
        account_age_days: Number(profile.account_age_days),
        home_lat: Number(profile.home_lat),
        home_lng: Number(profile.home_lng),
        workplace_lat: profile.workplace_lat,
        workplace_lng: profile.workplace_lng,
        travel_route: Array.isArray(profile.travel_route) ? profile.travel_route : [],
        recent_locations: updatedLocs,
        flagged_exposure_score: Number(profile.flagged_exposure_score),
      },
      receiverProfile: {
        user_id: receiver.user_id,
        name: receiverProfile.name,
        balance: Number(receiverProfile.balance),
        trust_score: Number(receiverProfile.trust_score),
        account_age_days: Number(receiverProfile.account_age_days),
        home_lat: Number(receiverProfile.home_lat),
        home_lng: Number(receiverProfile.home_lng),
        workplace_lat: receiverProfile.workplace_lat,
        workplace_lng: receiverProfile.workplace_lng,
        travel_route: Array.isArray(receiverProfile.travel_route) ? receiverProfile.travel_route as any[] : [],
        recent_locations: Array.isArray(receiverProfile.recent_locations) ? receiverProfile.recent_locations as any[] : [],
        flagged_exposure_score: Number(receiverProfile.flagged_exposure_score),
      },
      historicalTransactionCount: (historicalTx || []).length,
      sharedTransactionCount: sharedTx.length,
      avgTransactionAmount: avgAmount,
      maxTransactionAmount: maxAmount,
      dailyTransactionCount: dailyCount,
    };

    // Compute Trust Gravity Score
    const riskFactors = await computeTrustGravityScore(ctx);

    // Determine status based on risk level
    let status: string;
    if (riskFactors.riskLevel === 'LOW') {
      status = 'SETTLED';
    } else if (riskFactors.riskLevel === 'MEDIUM') {
      status = 'BUFFERED';
    } else {
      status = 'BUFFERED';
    }

    // Create transaction
    const hash = generateTransactionHash();
    const { data: newTx, error: txError } = await supabase.from('transactions').insert({
      transaction_hash: hash,
      sender_id: user!.id,
      receiver_id: receiver.user_id,
      amount: amt,
      risk_score: riskFactors.overallScore,
      risk_level: riskFactors.riskLevel,
      status,
      sender_lat: newLocation.lat,
      sender_lng: newLocation.lng,
      risk_factors: riskFactors as any,
    }).select().single();

    if (txError || !newTx) {
      toast.error('Transaction failed: ' + (txError?.message || 'Unknown error'));
      setLoading(false);
      return;
    }


    // Only settle balances if LOW risk (server-side RPC for atomic update)
    if (status === 'SETTLED') {
      const { error: settleError } = await (supabase as any).rpc('settle_transaction', {
        sender: user!.id,
        receiver: receiver.user_id,
        amount: amt,
      });

      if (settleError) {
        toast.error('Settlement failed: ' + settleError.message);
        setLoading(false);
        return;
      }
      await refetchProfile();
    }

    // If HIGH risk, decrease sender trust score
    if (riskFactors.riskLevel === 'HIGH') {
      await supabase.from('profiles').update({
        trust_score: Math.max(0, Number(profile.trust_score) - 5),
        flagged_exposure_score: Number(profile.flagged_exposure_score) + 3,
      }).eq('user_id', user!.id);
    }

    setResult({ riskFactors, status, hash });
    refetchProfile();
    setLoading(false);

    if (status === 'SETTLED') {
      toast.success('Payment settled instantly — LOW risk');
      // Navigate to success receipt
      navigate('/success', {
        state: { tx: { ...newTx, receiverProfile } }
      });
    } else {
      toast.warning(`Payment moved to Trust Buffer — ${riskFactors.riskLevel} risk`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Send Money</h2>
          <p className="text-sm text-muted-foreground">
            Transactions pass through the Dynamic Trust Shell before settlement
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Send form */}
          <div className="rounded-2xl border border-border bg-card p-6 relative">
            
            {showPinModal && (
              <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                <LockKeyhole className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-1">Enter NAP PIN</h3>
                <p className="text-xs text-muted-foreground mb-6 text-center">
                  To securely transfer ₹{amount} to {recipientIdentifier}
                </p>
                <div className="flex gap-2 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-12 h-14 rounded-xl border-2 border-primary/30 flex items-center justify-center text-2xl bg-black/20">
                      {pin[i] ? '•' : ''}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`h-12 rounded-xl text-lg font-medium transition-colors ${
                        key === '✓' ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)]' :
                        key === 'C' ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' :
                        'bg-white/5 hover:bg-white/10 text-foreground border border-white/5'
                      }`}
                      onClick={() => {
                        if (key === 'C') setPin('');
                        else if (key === '✓') handleSend();
                        else if (pin.length < 4) setPin(p => p + key);
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
                <button 
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={() => setShowPinModal(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            <form onSubmit={triggerPinAuth} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="receiver">Recipient UPI ID or Email</Label>
                <div className="relative">
                  <Input
                    id="receiver"
                    type="text"
                    value={recipientIdentifier}
                    onChange={(e) => setRecipientIdentifier(e.target.value)}
                    placeholder="user@nap or recipient@example.com"
                    required
                    list="profiles-list"
                    className="pr-10"
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                    onClick={() => window.location.href = '/scan'}
                    title="Scan QR Code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-qr-code"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
                  </button>
                </div>
                <datalist id="profiles-list">
                  {otherProfiles.map((p) => (
                    <option key={p.user_id} value={p.upi_id || p.email}>
                      {p.name}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" /> Play From
                </Label>
                <select 
                  id="bank"
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                >
                  <option value="wallet">NAP Wallet (₹{Number(profile?.balance || 0).toLocaleString('en-IN')})</option>
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - XX{b.last4}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="text-2xl font-bold"
                />
                <p className="text-xs text-muted-foreground">
                  Available: ₹{Number(profile?.balance || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Processing through Risk Engine...' : 'Send Payment'}
              </Button>
            </form>
          </div>

          {/* Risk analysis result */}
          {result && (
            <div className="animate-slide-up rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                {result.riskFactors.riskLevel === 'LOW' ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : result.riskFactors.riskLevel === 'MEDIUM' ? (
                  <AlertTriangle className="h-6 w-6 text-warning" />
                ) : (
                  <Shield className="h-6 w-6 text-destructive" />
                )}
                <div>
                  <h3 className="font-semibold text-foreground">Risk Analysis</h3>
                  <RiskBadge
                    level={result.riskFactors.riskLevel}
                    score={result.riskFactors.overallScore}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-mono">{result.hash}</p>

              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status: <span className="text-foreground">{result.status}</span>
              </div>

              {/* Factor breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Trust Gravity Factors
                </p>
                {[
                  ['Account Age', result.riskFactors.accountAgeScore],
                  ['History Frequency', result.riskFactors.historyFrequencyScore],
                  ['Shared Transactions', result.riskFactors.sharedTransactionScore],
                  ['Amount Anomaly', result.riskFactors.amountAnomalyScore],
                  ['Time Anomaly', result.riskFactors.timeAnomalyScore],
                  ['Network Exposure', result.riskFactors.networkExposureScore],
                  ['Address Proximity', result.riskFactors.addressProximityScore],
                  ['Workplace Proximity', result.riskFactors.workplaceProximityScore],
                  ['Route Similarity', result.riskFactors.travelRouteSimilarityScore],
                  ['Location Overlap (5-pt)', result.riskFactors.locationOverlapScore],
                ].map(([label, score]) => (
                  <div key={label as string} className="flex items-center gap-2">
                    <div className="flex-1 text-xs text-muted-foreground">{label as string}</div>
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${score as number}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-mono text-foreground">
                      {(score as number).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Details */}
              {result.riskFactors.details.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Flags & Details
                  </p>
                  {result.riskFactors.details.map((d: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {d}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
