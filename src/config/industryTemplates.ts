// src/config/industryTemplates.ts
export type IndustryType = "retail" | "restaurant" | "services" | "general";

export interface IndustryConfig {
  industry: IndustryType;
  displayName: string;
  gstRates: number[];
  defaultGstRate: number;
  invoiceFields: {
    showDiscount: boolean;
    showTableNumber: boolean;
    showServicePeriod: boolean;
    showHSNSAC: boolean;
    itemLabel: string; // "Items", "Menu Items", "Services", etc.
  };
}

export const industryConfigs: Record<IndustryType, IndustryConfig> = {
  retail: {
    industry: "retail",
    displayName: "Retail",
    gstRates: [0, 5, 12, 18, 28],
    defaultGstRate: 18,
    invoiceFields: {
      showDiscount: true,
      showTableNumber: false,
      showServicePeriod: false,
      showHSNSAC: true,
      itemLabel: "Items",
    },
  },

  restaurant: {
    industry: "restaurant",
    displayName: "Restaurant",
    gstRates: [0, 5],
    defaultGstRate: 5,
    invoiceFields: {
      showDiscount: false,
      showTableNumber: true,
      showServicePeriod: false,
      showHSNSAC: false,
      itemLabel: "Menu Items",
    },
  },

  services: {
    industry: "services",
    displayName: "Professional Services",
    gstRates: [18],
    defaultGstRate: 18,
    invoiceFields: {
      showDiscount: false,
      showTableNumber: false,
      showServicePeriod: true,
      showHSNSAC: true,
      itemLabel: "Services",
    },
  },

  general: {
    industry: "general",
    displayName: "General Business",
    gstRates: [0, 5, 12, 18, 28],
    defaultGstRate: 18,
    invoiceFields: {
      showDiscount: true,
      showTableNumber: false,
      showServicePeriod: false,
      showHSNSAC: true,
      itemLabel: "Items",
    },
  },
};

export const getIndustryConfig = (industry: IndustryType): IndustryConfig => {
  return industryConfigs[industry] || industryConfigs.general;
};
