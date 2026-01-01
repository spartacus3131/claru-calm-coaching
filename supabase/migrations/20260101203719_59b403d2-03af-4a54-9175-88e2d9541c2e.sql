-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Chat messages table (stores conversation history)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_chat_messages_user_date ON public.chat_messages(user_id, created_at DESC);

-- Hot Spots weekly ratings
CREATE TABLE public.hotspot_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('mind', 'body', 'emotions', 'career', 'finances', 'relationships', 'fun')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start, area)
);

ALTER TABLE public.hotspot_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ratings"
ON public.hotspot_ratings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings"
ON public.hotspot_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.hotspot_ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE INDEX idx_hotspot_ratings_user_week ON public.hotspot_ratings(user_id, week_start DESC);

-- Parking Lot items
CREATE TABLE public.parking_lot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.parking_lot_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own parking lot items"
ON public.parking_lot_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own parking lot items"
ON public.parking_lot_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parking lot items"
ON public.parking_lot_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own parking lot items"
ON public.parking_lot_items FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_parking_lot_user ON public.parking_lot_items(user_id, created_at DESC);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hotspot_ratings_updated_at
  BEFORE UPDATE ON public.hotspot_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parking_lot_items_updated_at
  BEFORE UPDATE ON public.parking_lot_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();