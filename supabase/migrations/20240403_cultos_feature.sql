-- Migration: Add Cultos (Services/Events) feature tables

-- 1. Service Categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own service categories"
  ON public.service_categories
  FOR ALL
  USING (auth.uid() = user_id);

-- 2. Service Events (Pai) - Ex: Culto Online, Culto Presencial
CREATE TABLE IF NOT EXISTS public.service_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.service_categories(id),
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.service_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own service events"
  ON public.service_events
  FOR ALL
  USING (auth.uid() = user_id);

-- 3. Service Details (Filho) - Ex: Culto Dominical
CREATE TABLE IF NOT EXISTS public.service_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.service_events(id) ON DELETE CASCADE,
  title TEXT, -- TEMA/TÍTULO - Opcional
  church_name TEXT, -- Nome da Igreja
  youtube_url TEXT,
  external_link TEXT,
  address TEXT,
  notes TEXT, -- Reflexões/Anotações
  frequencies JSONB NOT NULL DEFAULT '[]', -- [{type: 'weekly', days: [1,3], time: '19:00'}]
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.service_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own service details"
  ON public.service_details
  FOR ALL
  USING (auth.uid() = user_id);
