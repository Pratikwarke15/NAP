import { AppLayout } from '@/components/AppLayout';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ScanQR() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize Scanner on mount
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      false // verbose
    );

    const onScanSuccess = (decodedText: string) => {
      setScannedResult(decodedText);
      scanner.clear().then(() => {
        toast.success('QR Code Detected!');
        
        let targetUpi = decodedText;
        if (decodedText.includes('pa=')) {
          try {
            const url = new URL(decodedText);
            const pa = url.searchParams.get('pa');
            if (pa) targetUpi = pa;
          } catch (e) {
            // fallback
            const queryParams = new URLSearchParams(decodedText.split('?')[1]);
            const pa = queryParams.get('pa');
            if (pa) targetUpi = pa;
          }
        }
        
        setTimeout(() => {
          navigate(`/send?target=${encodeURIComponent(targetUpi)}`);
        }, 1000);
      }).catch(err => {
        console.error("Failed to clear scanner", err);
      });
    };

    const onScanFailure = (error: any) => {
      // Html5QrcodeScanner continuously throws failure when no QR is in frame
      // We can ignore this for typical UX
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, [navigate]);

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-10 animate-slide-up">
        
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-foreground">Scan any QR</h2>
          <p className="text-sm text-muted-foreground">
            Point your camera at a UPI QR code or any friend's MyQR page
          </p>
        </div>

        <div className="relative w-full max-w-sm p-4 rounded-3xl border border-white/10 bg-card/60 backdrop-blur-md shadow-2xl flex flex-col items-center">
          {/* Reader container required by html5-qrcode */}
          <div id="qr-reader" className="w-full bg-black rounded-2xl overflow-hidden shadow-inner" style={{ minHeight: '300px' }} />
          
          {scannedResult && (
            <div className="absolute inset-0 bg-background/90 rounded-3xl backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
              <QrCode className="w-20 h-20 text-success animate-bounce" />
              <p className="font-mono text-sm text-success px-4 text-center">
                Success! Targeting: {scannedResult}
              </p>
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          size="lg" 
          className="rounded-full w-full max-w-xs mt-8"
          onClick={() => navigate('/dashboard')}
        >
          <X className="w-4 h-4 mr-2" /> Cancel Scan
        </Button>
      </div>
    </AppLayout>
  );
}
