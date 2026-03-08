
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, cpf, birth_date, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'birth_date',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;
