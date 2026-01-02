-- Daily notes (Obsidian-style) per user + date
CREATE TABLE public.daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,

  -- Freeform capture
  raw_dump TEXT,

  -- Structured sections (flexible, evolve without migrations)
  morning_prompts JSONB NOT NULL DEFAULT '{}'::jsonb,
  top3 JSONB NOT NULL DEFAULT '[]'::jsonb,
  organized_tasks JSONB NOT NULL DEFAULT '{}'::jsonb,
  end_of_day JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE(user_id, note_date)
);

ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily notes"
ON public.daily_notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily notes"
ON public.daily_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily notes"
ON public.daily_notes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily notes"
ON public.daily_notes
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_daily_notes_user_date ON public.daily_notes(user_id, note_date DESC);

CREATE TRIGGER update_daily_notes_updated_at
  BEFORE UPDATE ON public.daily_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


