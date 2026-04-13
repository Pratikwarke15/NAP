/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppLayout } from '@/components/AppLayout';
import { useBufferedTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, CheckCircle2, RotateCcw, Clock, User, Banknote, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';

export default function TrustBuffer() {
  const { user } = useAuth();
  const { buffered, loading, refetch } = useBufferedTransactions();
  const { refetch: refetchProfile } = useProfile();
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAction = async (tx: any, action: 'accept' | 'reverse') => {
    setProcessing(tx.id);

    if (action === 'accept') {
      const { error: settleError } = await (supabase as any).rpc('settle_transaction', {
        sender: tx.sender_id,
        receiver: user!.id,
        amount: Number(tx.amount),
      });

      if (settleError) {
        toast.error('Settlement failed: ' + settleError.message);
        setProcessing(null);
        return;
      }

      await supabase
        .from('transactions')
        .update({ status: 'SETTLED' })
        .eq('id', tx.id);

      toast.success(`₹${Number(tx.amount).toLocaleString('en-IN')} accepted and settled to your wallet`);
    } else {
      await supabase
        .from('transactions')
        .update({ status: 'REVERSED' })
        .eq('id', tx.id);

      toast.success('Payment rejected and returned to sender');
    }

    refetch();
    refetchProfile();
    setProcessing(null);
  };

  const totalBuffered = buffered.reduce((acc, tx) => acc + Number(tx.amount), 0);

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 border border-warning/20">
              <Shield className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Trust Buffer</h2>
              <p className="text-sm text-muted-foreground">
                Incoming payments awaiting your decision
              </p>
            </div>
          </div>
          {buffered.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Pending</p>
              <p className="text-xl font-bold text-warning font-mono">
                ₹{totalBuffered.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : buffered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-muted-foreground">No pending payments</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Payments sent to you will appear here first</p>
          </div>
        ) : (
          <div className="space-y-4">
            {buffered.map((tx) => {
              const factors = tx.risk_factors as any;
              const expanded = expandedId === tx.id;
              const sender = tx.sender_profile;
              const senderName = sender?.name || 'Unknown Sender';
              const senderUpi = sender?.upi_id || sender?.email || tx.sender_id?.slice(0, 8) + '...';
              const senderInitial = senderName.charAt(0).toUpperCase();

              return (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  {/* Top accent strip color coded by risk */}
                  <div className={`h-1 w-full ${
                    tx.risk_level === 'HIGH' ? 'bg-destructive' :
                    tx.risk_level === 'MEDIUM' ? 'bg-warning' : 'bg-success'
                  }`} />

                  <div className="p-5">
                    {/* Sender Info Row */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-md flex-shrink-0">
                        {senderInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-foreground truncate">{senderName}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{senderUpi}</p>
                        {sender?.mobile && (
                          <p className="text-xs text-muted-foreground">📱 {sender.mobile}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-3xl font-bold text-foreground font-mono">
                          ₹{Number(tx.amount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Transaction Detail Strip */}
                    <div className="flex items-center gap-3 flex-wrap mb-5 bg-muted/40 rounded-xl px-4 py-3">
                      <RiskBadge level={tx.risk_level} score={tx.risk_score} />
                      <span className="text-xs px-3 py-1 rounded-full border border-warning/30 bg-warning/10 text-warning font-semibold uppercase tracking-wide">
                        {tx.status}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto font-mono">
                        {format(new Date(tx.created_at), 'dd MMM yyyy, hh:mm a')}
                      </span>
                    </div>

                    {/* Payment Note (if any) */}
                    {tx.note && (
                      <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/30 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-0.5">Note from sender</p>
                        <p className="text-sm font-medium text-foreground">"{tx.note}"</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        size="lg"
                        onClick={() => handleAction(tx, 'accept')}
                        disabled={processing === tx.id}
                        className="flex-1 h-12 rounded-xl font-bold bg-success text-success-foreground hover:bg-success/90 shadow-lg shadow-success/20 transition-all hover:scale-[1.02]"
                      >
                        {processing === tx.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                        )}
                        Accept ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleAction(tx, 'reverse')}
                        disabled={processing === tx.id}
                        variant="outline"
                        className="flex-1 h-12 rounded-xl font-bold border-destructive/40 text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <RotateCcw className="mr-2 h-5 w-5" />
                        Reject
                      </Button>
                    </div>

                    {/* Expandable Risk Details */}
                    {factors?.details && (
                      <button
                        onClick={() => setExpandedId(expanded ? null : tx.id)}
                        className="w-full mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          View NAP Risk Analysis
                        </span>
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded Risk Factor Panel */}
                  {expanded && factors && (
                    <div className="border-t border-border bg-muted/30 p-5 space-y-4">
                      <p className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> NAP Risk Breakdown
                      </p>
                      <div className="grid gap-2">
                        {[
                          ['Account Age', factors.accountAgeScore],
                          ['Transaction History', factors.historyFrequencyScore],
                          ['Shared History', factors.sharedTransactionScore],
                          ['Amount Anomaly', factors.amountAnomalyScore],
                          ['Time Anomaly', factors.timeAnomalyScore],
                          ['Network Exposure', factors.networkExposureScore],
                          ['Address Proximity', factors.addressProximityScore],
                          ['Workplace Proximity', factors.workplaceProximityScore],
                          ['Route Similarity', factors.travelRouteSimilarityScore],
                          ['Location Overlap', factors.locationOverlapScore],
                        ].map(([label, score]) => score !== undefined && (
                          <div key={label as string} className="flex items-center gap-3">
                            <div className="w-32 text-xs text-muted-foreground flex-shrink-0">{label as string}</div>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  (score as number) >= 70 ? 'bg-success' :
                                  (score as number) >= 40 ? 'bg-warning' : 'bg-destructive'
                                }`}
                                style={{ width: `${score as number}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs font-mono text-foreground">
                              {Number(score).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {factors.details && (
                        <div className="space-y-1 pt-2 border-t border-border">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Analysis Notes</p>
                          {factors.details.map((d: string, i: number) => (
                            <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              {d.replace('→', '').trim()}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
