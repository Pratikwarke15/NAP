import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import {
  LayoutDashboard,
  Send,
  Shield,
  Clock,
  LogOut,
  User,
  ScanLine,
  QrCode,
  Files,
  LineChart,
  Gift,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/send', label: 'Payments', icon: Send },
  { path: '/scan', label: 'Scan', icon: ScanLine },
  { path: '/myqr', label: 'QR', icon: QrCode },
  { path: '/utilities', label: 'Bills', icon: Files },
  { path: '/finance', label: 'Wealth', icon: LineChart },
  { path: '/rewards', label: 'Rewards', icon: Gift },
  { path: '/buffer', label: 'Buffer', icon: Shield },
  { path: '/history', label: 'History', icon: Clock },
];

const bottomNavItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/scan', label: 'Scan Any QR', icon: ScanLine, primary: true },
  { path: '/finance', label: 'Wealth', icon: LineChart },
  { path: '/history', label: 'History', icon: Clock },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">NAP</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Negative Acceptance Protocol</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {[
          { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
          { path: '/history', label: 'History', icon: Clock },
          { path: '/scan', label: 'Scan', icon: ScanLine, primary: true },
          { path: '/buffer', label: 'Buffer', icon: Shield },
          { path: '/finance', label: 'Wealth', icon: LineChart }
        ].map((item) => {
          const active = location.pathname === item.path;
          if (item.primary) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-1 flex-col items-center justify-center -mt-6 group"
              >
                <div className="h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-[6px] border-card shadow-xl group-hover:scale-105 transition-transform">
                  <item.icon className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-bold text-primary mt-1">{item.label}</span>
              </button>
            )
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:bg-white/5'
              )}
            >
              <item.icon className={`h-6 w-6 ${active ? 'fill-primary/20' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-auto">
        <div className="mx-auto max-w-4xl p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
