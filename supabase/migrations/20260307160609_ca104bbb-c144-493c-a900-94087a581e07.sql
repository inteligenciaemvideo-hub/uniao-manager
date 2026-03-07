
-- Create documents bucket for ID uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Allow authenticated users to upload to documents bucket
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');

-- Allow public read access
CREATE POLICY "Public read access to documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Update handle_new_user to save cpf and birth_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, cpf, birth_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'birth_date'
  );
  RETURN NEW;
END;
$$;
