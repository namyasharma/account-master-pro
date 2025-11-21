import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to sync theme preference with user profile in database
 * Must be used within both AuthProvider and ThemeProvider
 */
export const useThemeSync = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Load theme from profile when user logs in
  useEffect(() => {
    const loadThemeFromProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('theme')
          .eq('id', user.id)
          .single();
        
        if (data?.theme && data.theme !== theme) {
          setTheme(data.theme as 'light' | 'dark');
        }
      }
    };
    
    loadThemeFromProfile();
  }, [user?.id]);

  // Save theme to profile when it changes and user is logged in
  useEffect(() => {
    const saveThemeToProfile = async () => {
      if (user) {
        await supabase
          .from('profiles')
          .update({ theme })
          .eq('id', user.id);
      }
    };
    
    saveThemeToProfile();
  }, [theme, user?.id]);
};
