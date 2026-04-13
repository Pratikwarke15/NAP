import { AppLayout } from '@/components/AppLayout';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, Share2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const tx = location.state?.tx;

  if (!tx) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p>No transaction details found.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">Go Home</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 text-center animate-slide-up">
      <div className="w-full max-w-md mt-12 bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-success/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-24 w-24 bg-success text-success-foreground rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(var(--success),0.5)] mb-6 animate-pulse-ring">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          
          <h2 className="text-xl font-bold text-foreground">Payment Successful</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(tx.created_at), 'dd MMM yyyy, hh:mm a')}
          </p>
          
          <div className="text-5xl font-black mt-6 mb-8 text-foreground">
            ₹{Number(tx.amount).toLocaleString('en-IN')}
          </div>
          
          <div className="w-full space-y-4 bg-background/50 rounded-2xl p-4 border border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">To</span>
              <span className="font-bold text-foreground">
                {tx.receiverProfile?.name || 'NAP User'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">UPI ID</span>
              <span className="font-mono text-foreground">
                {tx.receiverProfile?.upi_id || 'user@nap'}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-4 border-t border-border">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-[10px] text-foreground break-all max-w-[150px] text-right">
                {tx.transaction_hash}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mt-8 grid grid-cols-2 gap-4">
        <Button onClick={() => navigate('/history')} variant="outline" className="h-14 rounded-xl border-border bg-card hover:bg-muted/50">
          <Receipt className="w-5 h-5 mr-2" /> View Details
        </Button>
        <Button onClick={() => navigate('/dashboard')} className="h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)]">
          <Home className="w-5 h-5 mr-2" /> Home
        </Button>
      </div>
      
      <Button variant="ghost" className="mt-6 text-primary hover:text-primary hover:bg-primary/10 rounded-full px-6">
        <Share2 className="w-4 h-4 mr-2" /> Share Receipt
      </Button>
    </div>
  );
}
