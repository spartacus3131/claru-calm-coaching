-- Create table for custom hotspot areas per user
CREATE TABLE public.hotspot_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  area_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'text-violet-500',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, area_id)
);

-- Enable RLS
ALTER TABLE public.hotspot_areas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own hotspot areas"
ON public.hotspot_areas
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hotspot areas"
ON public.hotspot_areas
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hotspot areas"
ON public.hotspot_areas
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hotspot areas"
ON public.hotspot_areas
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_hotspot_areas_updated_at
BEFORE UPDATE ON public.hotspot_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();