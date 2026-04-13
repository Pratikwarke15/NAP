-- Add upi_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id TEXT UNIQUE;

-- Update the handle_new_user trigger to generate a upi_id automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_name TEXT;
  generated_upi TEXT;
BEGIN
  -- Get base name from metadata or email
  base_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  -- Convert to lowercase, remove spaces and non-alphanumeric chars
  base_name := regexp_replace(lower(base_name), '[^a-z0-9]', '', 'g');
  
  -- Generate UPI ID: name + random 4 digits + @nap
  generated_upi := base_name || floor(random() * 8999 + 1000)::text || '@nap';

  INSERT INTO public.profiles (user_id, email, name, upi_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    generated_upi
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill existing users with a generated UPI ID if they don't have one
UPDATE public.profiles
SET upi_id = regexp_replace(lower(name), '[^a-z0-9]', '', 'g') || floor(random() * 8999 + 1000)::text || '@nap'
WHERE upi_id IS NULL;
