-- Add owner_id column to items table
ALTER TABLE public.items
ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing items to have owner_id (set to the business owner)
UPDATE public.items
SET owner_id = (
  SELECT owner_id 
  FROM public.businesses 
  WHERE businesses.id = items.business_id
  LIMIT 1
);

-- Make owner_id NOT NULL after populating existing rows
ALTER TABLE public.items
ALTER COLUMN owner_id SET NOT NULL;

-- Add RLS policy for users to insert their own items
CREATE POLICY "Users can create their own items"
ON public.items
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Update SELECT policy to allow users to see their own items
DROP POLICY IF EXISTS "Users can view items" ON public.items;

CREATE POLICY "Users can view their own items"
ON public.items
FOR SELECT
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));