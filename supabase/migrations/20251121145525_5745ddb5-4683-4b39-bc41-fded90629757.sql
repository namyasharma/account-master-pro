-- Add theme preference to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';

-- Add constraint to ensure only valid themes
ALTER TABLE public.profiles ADD CONSTRAINT valid_theme CHECK (theme IN ('light', 'dark'));

-- Update existing profiles to have default theme
UPDATE public.profiles SET theme = 'light' WHERE theme IS NULL;