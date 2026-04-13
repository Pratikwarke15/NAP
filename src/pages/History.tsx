import { AppLayout } from '@/components/AppLayout';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/lib/authContext';
import { RiskBadge } from '@/components/RiskBadge';
import { ArrowUpRight, ArrowDownLeft, Clock, Filter, Receipt, X } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  SETTLED: 'text-success',
  PENDING: 'text-warning',
  BUFFERED: 'text-warning',
  REVERSED: 'text-destructive',
};

export default function History() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions();
  const [filter, setFilter] = useState<'ALL' | 'SENT' | 'RECEIVED' | 'BUFFERED'>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const filtered = transactions.filter(tx => {
    const isSender = tx.sender_id === user?.id;
    if (filter === 'SENT') return isSender;
    if (filter === 'RECEIVED') return !isSender;
    if (filter === 'BUFFERED') return tx.status === 'BUFFERED';
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
              <p className="text-sm text-muted-foreground">{filtered.length} transactions</p>
            </div>
          </div>
          
          <div className="flex gap-2 text-sm bg-card/50 p-1 rounded-xl border border-white/5">
            {['ALL', 'SENT', 'RECEIVED', 'BUFFERED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === f ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hash</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => {
                    const isSender = tx.sender_id === user?.id;
                    return (
                      <tr 
                        key={tx.id} 
                        onClick={() => setSelectedReceipt(tx)}
                        className="border-b border-border last:border-0 cursor-pointer hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isSender ? (
                              <ArrowUpRight className="h-4 w-4 text-destructive" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 text-success" />
                            )}
                            <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                              {isSender ? 'Sent' : 'Received'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-muted-foreground">
                            {tx.transaction_hash.slice(0, 16)}...
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${isSender ? 'text-destructive' : 'text-success'}`}>
                            {isSender ? '-' : '+'}₹{Number(tx.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RiskBadge level={tx.risk_level} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold ${statusColors[tx.status]}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-8 flex flex-col items-center justify-center relative bg-gradient-to-b from-primary/10 to-transparent">
              <Receipt className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">NAP E-Receipt</h3>
              <h1 className="text-4xl font-bold mt-2">₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}</h1>
              <p className="text-xs text-muted-foreground mt-2">{format(new Date(selectedReceipt.created_at), 'MMMM dd, yyyy - HH:mm:ss')}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`font-bold ${statusColors[selectedReceipt.status]}`}>{selectedReceipt.status}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Risk Level</span>
                <RiskBadge level={selectedReceipt.risk_level} score={selectedReceipt.risk_score} />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Transaction Hash</span>
                <span className="text-xs font-mono text-foreground">{selectedReceipt.transaction_hash.slice(0,24)}...</span>
              </div>
              
              {selectedReceipt.risk_factors?.details && (
                <div className="mt-6 pt-4 border-t border-dashed border-white/20">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">NAP Risk Deductions applied</span>
                  <ul className="mt-2 space-y-1">
                    {selectedReceipt.risk_factors.details.map((detail: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDUsMCAxMCwxMCIgZmlsbD0iIzA5MDkwYiIvPjwvc3ZnPg==')] bg-repeat-x rotate-180 absolute bottom-0 w-full" />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
