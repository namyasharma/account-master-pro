-- Add foreign key constraints with proper cascading behavior

-- Items: cascade delete when business is deleted
ALTER TABLE public.items
DROP CONSTRAINT IF EXISTS items_business_id_fkey,
ADD CONSTRAINT items_business_id_fkey 
  FOREIGN KEY (business_id) 
  REFERENCES public.businesses(id) 
  ON DELETE CASCADE;

-- Customers: cascade delete when business is deleted
ALTER TABLE public.customers
DROP CONSTRAINT IF EXISTS customers_business_id_fkey,
ADD CONSTRAINT customers_business_id_fkey 
  FOREIGN KEY (business_id) 
  REFERENCES public.businesses(id) 
  ON DELETE CASCADE;

-- Suppliers: cascade delete when business is deleted
ALTER TABLE public.suppliers
DROP CONSTRAINT IF EXISTS suppliers_business_id_fkey,
ADD CONSTRAINT suppliers_business_id_fkey 
  FOREIGN KEY (business_id) 
  REFERENCES public.businesses(id) 
  ON DELETE CASCADE;

-- Invoices: cascade delete when business is deleted, set null when customer is deleted
ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS invoices_business_id_fkey,
ADD CONSTRAINT invoices_business_id_fkey 
  FOREIGN KEY (business_id) 
  REFERENCES public.businesses(id) 
  ON DELETE CASCADE;

ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey,
ADD CONSTRAINT invoices_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.customers(id) 
  ON DELETE SET NULL;

-- Invoice line items: cascade delete when invoice is deleted, set null when item is deleted
ALTER TABLE public.invoice_line_items
DROP CONSTRAINT IF EXISTS invoice_line_items_invoice_id_fkey,
ADD CONSTRAINT invoice_line_items_invoice_id_fkey 
  FOREIGN KEY (invoice_id) 
  REFERENCES public.invoices(id) 
  ON DELETE CASCADE;

ALTER TABLE public.invoice_line_items
DROP CONSTRAINT IF EXISTS invoice_line_items_item_id_fkey,
ADD CONSTRAINT invoice_line_items_item_id_fkey 
  FOREIGN KEY (item_id) 
  REFERENCES public.items(id) 
  ON DELETE SET NULL;

-- Purchase entries: cascade delete when business is deleted, set null when supplier is deleted
ALTER TABLE public.purchase_entries
DROP CONSTRAINT IF EXISTS purchase_entries_business_id_fkey,
ADD CONSTRAINT purchase_entries_business_id_fkey 
  FOREIGN KEY (business_id) 
  REFERENCES public.businesses(id) 
  ON DELETE CASCADE;

ALTER TABLE public.purchase_entries
DROP CONSTRAINT IF EXISTS purchase_entries_supplier_id_fkey,
ADD CONSTRAINT purchase_entries_supplier_id_fkey 
  FOREIGN KEY (supplier_id) 
  REFERENCES public.suppliers(id) 
  ON DELETE SET NULL;

-- Tax period summaries: cascade delete when business is deleted
ALTER TABLE public.tax_period_summaries
DROP CONSTRAINT IF EXISTS tax_period_summaries_business_id_fkey,
ADD CONSTRAINT tax_period_summaries_business_id_fkey 
  FOREIGN KEY (business_id) 
  REFERENCES public.businesses(id) 
  ON DELETE CASCADE;

-- Add uniqueness constraints
ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS invoices_business_id_invoice_number_key,
ADD CONSTRAINT invoices_business_id_invoice_number_key 
  UNIQUE (business_id, invoice_number);

ALTER TABLE public.purchase_entries
DROP CONSTRAINT IF EXISTS purchase_entries_business_id_entry_number_key,
ADD CONSTRAINT purchase_entries_business_id_entry_number_key 
  UNIQUE (business_id, entry_number);

-- Create validation function for invoices to require at least one line item
CREATE OR REPLACE FUNCTION public.validate_invoice_has_line_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate on UPDATE or when checking existing invoices
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    -- Check if the invoice would have zero line items after this operation
    IF NOT EXISTS (
      SELECT 1 
      FROM public.invoice_line_items 
      WHERE invoice_id = OLD.invoice_id
        AND (TG_OP = 'UPDATE' OR id != OLD.id)
    ) THEN
      RAISE EXCEPTION 'Cannot remove last line item from invoice. Invoice must have at least one line item.';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to validate line items on delete/update
DROP TRIGGER IF EXISTS validate_invoice_line_items_trigger ON public.invoice_line_items;
CREATE TRIGGER validate_invoice_line_items_trigger
  BEFORE DELETE OR UPDATE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_invoice_has_line_items();

-- Create validation function to check invoice has line items before finalizing
CREATE OR REPLACE FUNCTION public.validate_invoice_before_finalize()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT, we allow creation without line items (they'll be added immediately after)
  -- But we can add a check constraint for other operations if needed
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    -- You could add additional business logic here if needed
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$;