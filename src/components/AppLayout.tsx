import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-20">
      <div className="container-responsive">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
