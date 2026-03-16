
-- Update handle_new_user to auto-approve all users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, cpf, birth_date, phone, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'birth_date',
    NEW.raw_user_meta_data->>'phone',
    true
  );
  RETURN NEW;
END;
$$;

-- Also approve all existing unapproved users
UPDATE public.profiles SET approved = true WHERE approved = false;
