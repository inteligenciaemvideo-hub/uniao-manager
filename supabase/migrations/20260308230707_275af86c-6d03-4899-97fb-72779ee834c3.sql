
CREATE TABLE public.team_sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sponsors" ON public.team_sponsors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sponsors" ON public.team_sponsors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
