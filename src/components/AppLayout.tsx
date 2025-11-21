import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import BusinessSwitcher from './BusinessSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-20">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-responsive flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              GST Billing
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <BusinessSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container-responsive pt-4">
        {children}
      </div>
      
      <BottomNav />
    </div>
  );
}
