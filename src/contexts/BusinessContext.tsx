import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Business {
  id: string;
  name: string;
  gstin?: string;
}

interface BusinessContextType {
  selectedBusiness: Business | null;
  setSelectedBusiness: (business: Business | null) => void;
  refreshBusinessData: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const STORAGE_KEY = 'selected_business_id';

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBusiness, setSelectedBusinessState] = useState<Business | null>(null);
  const { user } = useAuth();

  // Load from localStorage on mount
  useEffect(() => {
    const loadSavedBusiness = async () => {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && user) {
        try {
          const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', savedId)
            .eq('owner_id', user.id)
            .maybeSingle();

          if (!error && data) {
            setSelectedBusinessState(data);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (error) {
          console.error('Error loading saved business:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    };

    loadSavedBusiness();
  }, [user]);

  const setSelectedBusiness = async (business: Business | null) => {
    setSelectedBusinessState(business);
    
    if (business) {
      localStorage.setItem(STORAGE_KEY, business.id);
      
      // Update user profile with selected business
      if (user) {
        try {
          await supabase
            .from('profiles')
            .update({ 
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        } catch (error) {
          console.error('Error updating profile:', error);
        }
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const refreshBusinessData = async () => {
    // This will trigger refetch in components using business data
    if (selectedBusiness) {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', selectedBusiness.id)
        .maybeSingle();
      
      if (data) {
        setSelectedBusinessState(data);
      }
    }
  };

  return (
    <BusinessContext.Provider value={{ selectedBusiness, setSelectedBusiness, refreshBusinessData }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};