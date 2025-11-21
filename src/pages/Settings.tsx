import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeSync } from '@/hooks/useThemeSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, userRole, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Sync theme with user profile
  useThemeSync();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="p-responsive max-w-2xl mx-auto space-y-4 md:space-y-6">
      <h1 className="font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Account</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-sm md:text-base font-medium">{user?.email}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Role</Label>
            <p className="text-sm md:text-base font-medium capitalize">{userRole}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="theme-toggle" className="text-sm md:text-base font-medium">Dark Mode</Label>
              <p className="text-xs md:text-sm text-muted-foreground">Switch between light and dark theme</p>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSignOut} variant="destructive" className="w-full" size="default">
        Sign Out
      </Button>
    </div>
  );
}
