ALTER TABLE public.events ADD COLUMN IF NOT EXISTS home_score integer DEFAULT NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS away_score integer DEFAULT NULL;