/**
 * Product Lookup Service
 * Uses Open Food Facts API (free, no API key required)
 * Supports multiple barcode formats: EAN-13, UPC-A, etc.
 */

export interface ProductInfo {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  image?: string;
  barcode: string;
  found: boolean;
}

/**
 * Look up product information from a barcode
 * @param barcode - The scanned barcode string
 * @returns Product information or null if not found
 */
export const lookupProduct = async (barcode: string): Promise<ProductInfo | null> => {
  try {
    // Clean barcode (remove any whitespace)
    const cleanBarcode = barcode.trim();

    // Try Open Food Facts API (free, worldwide database)
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;
      
      return {
        name: product.product_name || 'Unknown Product',
        description: product.generic_name || product.categories || '',
        category: product.categories_tags?.[0]?.replace('en:', '') || '',
        brand: product.brands || '',
        image: product.image_url || product.image_front_url || '',
        barcode: cleanBarcode,
        found: true,
      };
    }

    // Product not found in database
    return {
      name: 'Unknown Product',
      description: '',
      barcode: cleanBarcode,
      found: false,
    };
  } catch (error) {
    console.error('Product lookup error:', error);
    return null;
  }
};

/**
 * Search for products by name (useful for manual search)
 * @param searchTerm - The search term
 * @returns Array of product results
 */
export const searchProducts = async (searchTerm: string): Promise<ProductInfo[]> => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&json=1&page_size=10`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (data.products && Array.isArray(data.products)) {
      return data.products.map((product: any) => ({
        name: product.product_name || 'Unknown Product',
        description: product.generic_name || product.categories || '',
        category: product.categories_tags?.[0]?.replace('en:', '') || '',
        brand: product.brands || '',
        image: product.image_url || product.image_front_url || '',
        barcode: product.code || '',
        found: true,
      }));
    }

    return [];
  } catch (error) {
    console.error('Product search error:', error);
    return [];
  }
};

/**
 * Validate if a barcode format is valid
 * @param barcode - The barcode to validate
 * @returns Boolean indicating if valid
 */
export const isValidBarcode = (barcode: string): boolean => {
  // Remove whitespace
  const clean = barcode.trim();
  
  // Check common barcode lengths
  // EAN-13: 13 digits
  // UPC-A: 12 digits
  // EAN-8: 8 digits
  // Code-128: variable length
  const validLengths = [8, 12, 13];
  
  // Must be numeric for EAN/UPC
  const isNumeric = /^\d+$/.test(clean);
  
  if (isNumeric && validLengths.includes(clean.length)) {
    return true;
  }
  
  // For other formats (Code-128, etc.), accept alphanumeric
  if (/^[A-Z0-9]+$/.test(clean) && clean.length >= 6) {
    return true;
  }
  
  return false;
};