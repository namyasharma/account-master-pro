import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'admin' | 'user' | null;
  onboardingCompleted: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    setUserRole(data?.role || 'user');
  };

  const fetchOnboardingStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();
    
    setOnboardingCompleted(data?.onboarding_completed || false);
  };

  const refreshOnboardingStatus = async () => {
    if (user) {
      await fetchOnboardingStatus(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchOnboardingStatus(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setOnboardingCompleted(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchOnboardingStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('Auth signup failed', error);
      return { error };
    }

    if (!data.user) {
      const creationError = new Error('User creation failed: missing user in response');
      console.error('Auth signup returned no user', creationError);
      return { error: creationError };
    }

    const user = data.user;

    const isDuplicateError = (e: any) => {
      if (!e) return false;
      const code = (e.code ?? e.errno ?? '').toString();
      const message = `${e.message ?? ''} ${e.details ?? ''} ${e.hint ?? ''}`.toLowerCase();
      return (
        code === '23505' ||
        message.includes('duplicate key') ||
        message.includes('unique constraint')
      );
    };

    try {
      // Explicitly create profile record and wait for completion
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email || email,
        full_name: fullName,
        onboarding_completed: false,
      });

      if (profileError && !isDuplicateError(profileError)) {
        console.error('Profile creation failed during signup', profileError);
        throw profileError;
      }

      // Explicitly create user_roles record and wait for completion
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'user',
      });

      if (roleError && !isDuplicateError(roleError)) {
        console.error('User role creation failed during signup', roleError);
        throw roleError;
      }

      // Ensure onboarding and role state are up to date immediately after signup
      try {
        await Promise.all([
          fetchUserRole(user.id),
          fetchOnboardingStatus(user.id),
        ]);
      } catch (stateError) {
        // Do not block signup on state fetch issues, but log for debugging
        console.error('Failed to refresh onboarding/role state after signup', stateError);
      }
    } catch (err) {
      console.error('Unexpected error during signup profile/role creation', err);
      return { error: err };
    }

    return { error: null };
  };
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, onboardingCompleted, signUp, signIn, signOut, loading, refreshOnboardingStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};