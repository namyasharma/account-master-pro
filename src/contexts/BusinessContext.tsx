import { createContext, useContext, useState, ReactNode } from 'react';

interface Business {
  id: string;
  name: string;
  gstin?: string;
}

interface BusinessContextType {
  selectedBusiness: Business | null;
  setSelectedBusiness: (business: Business | null) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  return (
    <BusinessContext.Provider value={{ selectedBusiness, setSelectedBusiness }}>
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