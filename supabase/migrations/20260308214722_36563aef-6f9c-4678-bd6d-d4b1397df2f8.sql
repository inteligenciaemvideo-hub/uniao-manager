
CREATE TABLE public.event_guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage event guests"
  ON public.event_guests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
