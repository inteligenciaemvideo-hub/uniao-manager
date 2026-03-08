CREATE OR REPLACE FUNCTION public.check_duplicate_registration(_cpf text, _phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE cpf = _cpf AND _cpf IS NOT NULL AND _cpf != '') THEN
    result := json_build_object('duplicate', true, 'field', 'cpf');
    RETURN result;
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE phone = _phone AND _phone IS NOT NULL AND _phone != '') THEN
    result := json_build_object('duplicate', true, 'field', 'phone');
    RETURN result;
  END IF;
  RETURN json_build_object('duplicate', false);
END;
$$;