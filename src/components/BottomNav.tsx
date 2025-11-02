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
  ];

  const visibleItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1',
                'text-muted-foreground hover:text-foreground',
                isActive && 'text-primary'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
