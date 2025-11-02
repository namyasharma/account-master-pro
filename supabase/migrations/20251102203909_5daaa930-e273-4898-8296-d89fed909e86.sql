-- Allow users to create businesses where they are the owner
CREATE POLICY "Users can create businesses for themselves"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Allow users to view their own businesses
CREATE POLICY "Users can view their own businesses"
ON public.businesses
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));