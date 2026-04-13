import { AppLayout } from '@/components/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import QRCode from 'react-qr-code';
import { Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MyQR() {
  const { profile } = useProfile();

  const upiId = profile?.upi_id || `${profile?.email?.split('@')[0]}@nap`;
  const qrValue = `upi://pay?pa=${upiId}&pn=${profile?.name || 'User'}`;

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId);
    toast.success('UPI ID copied to clipboard');
  };

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center space-y-8 animate-slide-up pb-10">
        
        <div className="text-center space-y-2 mt-4">
          <h2 className="text-2xl font-bold text-foreground">My QR Code</h2>
          <p className="text-sm text-muted-foreground">
            Allow anyone to scan and pay you securely
          </p>
        </div>

        <div className="relative p-8 rounded-[2rem] border border-white/10 bg-card/60 backdrop-blur-md shadow-2xl flex flex-col items-center group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none" />
          
          <div className="bg-white p-6 rounded-2xl shadow-inner z-10">
            <QRCode 
              value={qrValue} 
              size={220}
              level="H"
              fgColor="#111827"
              className="drop-shadow-lg"
            />
          </div>

          <div className="mt-8 text-center z-10 w-full space-y-1">
            <h3 className="text-xl font-bold text-foreground truncate max-w-[250px] mx-auto">
              {profile?.name}
            </h3>
            <p className="text-muted-foreground font-mono text-sm break-all">
              {upiId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full max-w-xs">
          <Button 
            variant="outline" 
            className="flex-1 rounded-full bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/50"
            onClick={copyUpi}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy ID
          </Button>
          <Button 
            variant="default" 
            className="flex-1 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.3)]"
            onClick={() => {
              toast.info('Sharing options coming soon');
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}
