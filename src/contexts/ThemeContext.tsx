import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const { user } = useAuth();

  // Load theme from profile or localStorage
  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        // Load from profile
        const { data } = await supabase
          .from('profiles')
          .select('theme')
          .eq('id', user.id)
          .single();
        
        if (data?.theme) {
          setTheme(data.theme as Theme);
          document.documentElement.classList.toggle('dark', data.theme === 'dark');
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('theme') as Theme;
        if (stored) {
          setTheme(stored);
          document.documentElement.classList.toggle('dark', stored === 'dark');
        }
      }
    };
    
    loadTheme();
  }, [user]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Persist to profile if user is logged in
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('id', user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
