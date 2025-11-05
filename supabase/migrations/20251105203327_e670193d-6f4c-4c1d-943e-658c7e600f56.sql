-- Create hsn_codes table for storing GST/HSN master data
CREATE TABLE IF NOT EXISTS public.hsn_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hsn_code text NOT NULL UNIQUE,
  description text,
  gst_rate numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on hsn_codes
ALTER TABLE public.hsn_codes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read HSN codes
CREATE POLICY "Anyone can view HSN codes"
ON public.hsn_codes
FOR SELECT
USING (true);

-- Only admins can manage HSN codes
CREATE POLICY "Admins can manage HSN codes"
ON public.hsn_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hsn_codes_hsn_code ON public.hsn_codes(hsn_code);
CREATE INDEX IF NOT EXISTS idx_hsn_codes_description ON public.hsn_codes USING gin(to_tsvector('english', description));

-- Add trigger for updated_at
CREATE TRIGGER update_hsn_codes_updated_at
BEFORE UPDATE ON public.hsn_codes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();