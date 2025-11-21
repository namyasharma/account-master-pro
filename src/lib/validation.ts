import { z } from 'zod';

// GSTIN validation (15 characters, specific format)
export const gstinSchema = z.string().regex(
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  'Invalid GSTIN format (must be 15 characters)'
).optional().or(z.literal(''));

// Phone validation
export const phoneSchema = z.string().regex(
  /^[0-9]{10,15}$/,
  'Phone number must be 10-15 digits'
).optional().or(z.literal(''));

// Email validation
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .optional()
  .or(z.literal(''));

// Business validation
export const businessSchema = z.object({
  name: z.string().trim().min(1, 'Business name is required').max(200, 'Name must be less than 200 characters'),
  gstin: gstinSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
});

// Customer/Supplier validation
export const customerSupplierSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  gstin: gstinSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
});

// Invoice validation
export const invoiceSchema = z.object({
  invoice_number: z.string().trim().min(1, 'Invoice number is required').max(50, 'Invoice number must be less than 50 characters'),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  buyer_name: z.string().trim().min(1, 'Buyer name is required').max(200, 'Buyer name must be less than 200 characters'),
  buyer_gstin: gstinSchema,
  subtotal: z.number().min(0, 'Subtotal cannot be negative').max(999999999, 'Subtotal is too large'),
  gst_amount: z.number().min(0, 'GST amount cannot be negative').max(999999999, 'GST amount is too large'),
  total: z.number().min(0, 'Total cannot be negative').max(999999999, 'Total is too large'),
});

// Purchase entry validation
export const purchaseSchema = z.object({
  entry_number: z.string().trim().min(1, 'Entry number is required').max(50, 'Entry number must be less than 50 characters'),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  supplier_name: z.string().trim().min(1, 'Supplier name is required').max(200, 'Supplier name must be less than 200 characters'),
  supplier_gstin: gstinSchema,
  subtotal: z.number().min(0, 'Subtotal cannot be negative').max(999999999, 'Subtotal is too large'),
  gst_amount: z.number().min(0, 'GST amount cannot be negative').max(999999999, 'GST amount is too large'),
  total: z.number().min(0, 'Total cannot be negative').max(999999999, 'Total is too large'),
});

// Item validation
export const itemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(200, 'Item name must be less than 200 characters'),
  sku: z.string().max(50, 'SKU must be less than 50 characters').optional().or(z.literal('')),
  hsn_sac_code: z.string().max(20, 'HSN/SAC code must be less than 20 characters').optional().or(z.literal('')),
  unit_price: z.number().min(0, 'Unit price cannot be negative').max(999999999, 'Unit price is too large'),
  gst_rate: z.number().min(0, 'GST rate cannot be negative').max(100, 'GST rate cannot exceed 100%'),
  unit_of_measure: z.string().min(1, 'Unit of measure is required').max(50, 'Unit of measure must be less than 50 characters'),
});
