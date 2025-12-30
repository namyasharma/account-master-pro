import { Home, Package, FileText, Settings, ShoppingCart } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNav() {
  const { userRole } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'user'] },
    { to: '/items', icon: Package, label: 'Items', roles: ['admin', 'user'] },
    { to: '/invoices', icon: FileText, label: 'Invoices', roles: ['admin', 'user'] },
    { to: '/purchases', icon: ShoppingCart, label: 'Purchases', roles: ['admin'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'user'] },
    { to: '/barcode-test', icon: Settings, label: 'Barcode Test', roles: ['admin', 'user'] },
  ];

  const visibleItems = navItems.filter(item =>
    userRole && item.roles.includes(userRole)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 z-50 shadow-[var(--shadow-light)] dark:shadow-[var(--shadow-dark)]">
      <div className="flex justify-around items-center min-h-[64px] md:min-h-[72px] max-w-screen-xl mx-auto px-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 min-h-[56px] gap-1 px-2 rounded-xl transition-all duration-200',
                'text-muted-foreground hover:text-foreground',
                isActive && 'text-primary bg-primary/10'
              )
            }
          >
            <item.icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.5} />
            <span className="text-[10px] md:text-xs font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
