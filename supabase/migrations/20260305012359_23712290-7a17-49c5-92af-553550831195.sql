
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  positions TEXT[] NOT NULL DEFAULT '{}',
  number INTEGER NOT NULL,
  photo_url TEXT DEFAULT '',
  dominant_foot TEXT NOT NULL DEFAULT 'Direito' CHECK (dominant_foot IN ('Direito', 'Esquerdo', 'Ambos')),
  birth_date TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  injured BOOLEAN NOT NULL DEFAULT false,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  red_cards INTEGER NOT NULL DEFAULT 0,
  satisfaction TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monthly payments table
CREATE TABLE public.monthly_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, month)
);

-- Player comments
CREATE TABLE public.player_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Player fees
CREATE TABLE public.player_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Treino', 'Amistoso', 'Torneio')),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  opponent TEXT DEFAULT NULL,
  opponent_logo_url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event attendance
CREATE TABLE public.event_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('presente', 'falta_justificada', 'falta')),
  absence_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, player_id)
);

-- Event convocations
CREATE TABLE public.event_convocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, player_id)
);

-- Scheduled absences
CREATE TABLE public.scheduled_absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, player_id)
);

-- Financial entries
CREATE TABLE public.financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  player_id UUID DEFAULT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team settings
CREATE TABLE public.team_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_logo_url TEXT DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_convocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;

-- Allow all access (no auth for now - team management app)
CREATE POLICY "Allow all access to players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to monthly_payments" ON public.monthly_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to player_comments" ON public.player_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to player_fees" ON public.player_fees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to event_attendance" ON public.event_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to event_convocations" ON public.event_convocations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scheduled_absences" ON public.scheduled_absences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to financials" ON public.financials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to team_settings" ON public.team_settings FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_team_settings_updated_at BEFORE UPDATE ON public.team_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

CREATE POLICY "Photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Anyone can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Anyone can update photos" ON storage.objects FOR UPDATE USING (bucket_id = 'photos');
CREATE POLICY "Anyone can delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos');

-- Insert initial team settings row
INSERT INTO public.team_settings (id) VALUES (gen_random_uuid());
