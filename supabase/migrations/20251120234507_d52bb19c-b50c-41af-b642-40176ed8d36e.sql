-- Fix Critical Security Issues: RLS Policies

-- ============================================
-- 1. FIX INVOICES PUBLIC ACCESS (CRITICAL)
-- ============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can create and view invoices" ON invoices;

-- Create proper business-scoped SELECT policy
CREATE POLICY "Users can view their business invoices"
ON invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b 
    WHERE b.id = invoices.business_id 
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add missing UPDATE and DELETE policies for invoices
CREATE POLICY "Users can update their business invoices"
ON invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b 
    WHERE b.id = invoices.business_id 
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can delete their business invoices"
ON invoices FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses b 
    WHERE b.id = invoices.business_id 
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- ============================================
-- 2. FIX PURCHASE ENTRIES MISSING RLS (CRITICAL)
-- ============================================

-- Add SELECT policy for business owners
CREATE POLICY "Users can view their business purchases"
ON purchase_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = purchase_entries.business_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add INSERT policy for business owners
CREATE POLICY "Users can create purchases for their business"
ON purchase_entries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = purchase_entries.business_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add UPDATE policy for business owners
CREATE POLICY "Users can update their business purchases"
ON purchase_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = purchase_entries.business_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add DELETE policy for business owners
CREATE POLICY "Users can delete their business purchases"
ON purchase_entries FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = purchase_entries.business_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- ============================================
-- 3. FIX INVOICE LINE ITEMS EXPOSURE (CRITICAL)
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can view line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Users can insert line items" ON invoice_line_items;

-- Create proper business-scoped SELECT policy
CREATE POLICY "Users can view their business invoice line items"
ON invoice_line_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    JOIN businesses b ON b.id = i.business_id
    WHERE i.id = invoice_line_items.invoice_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Create proper business-scoped INSERT policy
CREATE POLICY "Users can insert line items for their business invoices"
ON invoice_line_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    JOIN businesses b ON b.id = i.business_id
    WHERE i.id = invoice_line_items.invoice_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add missing UPDATE and DELETE policies
CREATE POLICY "Users can update their business invoice line items"
ON invoice_line_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    JOIN businesses b ON b.id = i.business_id
    WHERE i.id = invoice_line_items.invoice_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can delete their business invoice line items"
ON invoice_line_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    JOIN businesses b ON b.id = i.business_id
    WHERE i.id = invoice_line_items.invoice_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- ============================================
-- 4. ADD MISSING UPDATE/DELETE POLICIES
-- ============================================

-- Businesses: Add UPDATE and DELETE policies
CREATE POLICY "Users can update their own businesses"
ON businesses FOR UPDATE
USING (
  auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete their own businesses"
ON businesses FOR DELETE
USING (
  auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Items: Add UPDATE and DELETE policies
CREATE POLICY "Users can update their own items"
ON items FOR UPDATE
USING (
  auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete their own items"
ON items FOR DELETE
USING (
  auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Customers: Add DELETE policy
CREATE POLICY "Users can delete their business customers"
ON customers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = customers.business_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Suppliers: Add DELETE policy
CREATE POLICY "Users can delete their business suppliers"
ON suppliers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = suppliers.business_id
    AND (b.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);