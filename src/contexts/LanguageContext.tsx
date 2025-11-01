import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Placeholder translations structure for future localization
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
    
    // Business
    'business.select': 'Select Business',
    'business.create': 'Create New Business',
    'business.name': 'Business Name',
    'business.gstin': 'GSTIN',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalSales': 'Total Sales',
    'dashboard.totalPurchases': 'Total Purchases',
    'dashboard.netGST': 'Net GST',
    'dashboard.payable': 'Payable',
    'dashboard.refundable': 'Refundable',
    
    // Items
    'items.title': 'Items',
    'items.add': 'Add Item',
    'items.name': 'Item Name',
    'items.sku': 'SKU',
    'items.hsnSac': 'HSN/SAC Code',
    'items.gstRate': 'GST Rate (%)',
    'items.unitPrice': 'Unit Price',
    'items.unitOfMeasure': 'Unit of Measure',
    
    // Invoices
    'invoices.title': 'Invoices',
    'invoices.create': 'Create Invoice',
    'invoices.number': 'Invoice Number',
    'invoices.date': 'Date',
    'invoices.buyerName': 'Buyer Name',
    'invoices.buyerGSTIN': 'Buyer GSTIN',
    'invoices.total': 'Total',
    
    // Purchases
    'purchases.title': 'Purchases',
    'purchases.add': 'Add Purchase',
    'purchases.entryNumber': 'Entry Number',
    'purchases.supplierName': 'Supplier Name',
    'purchases.supplierGSTIN': 'Supplier GSTIN',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.logout': 'Logout',
  },
  hi: {},
  ta: {}
};

// Initialize Hindi and Tamil translations as copies of English
translations.hi = { ...translations.en };
translations.ta = { ...translations.en };

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};