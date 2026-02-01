import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { backend } from '@/backend';
import type { DailyNoteDraft, DailyNoteTop3Item } from '@/types/dailyNote';

function defaultDraft(noteDate: string): DailyNoteDraft {
  return {
    noteDate,
    rawDump: '',
    morningPrompts: {
      weighingOnMe: '',
      avoiding: '',
      meetings: '',
      followUps: '',
      win: '',
    },
    top3: [
      { text: '', completed: false },
      { text: '', completed: false },
      { text: '', completed: false },
    ],
    organizedTasks: {
      actionsToday: [],
      thisWeek: [],
      decisionsNeeded: [],
      quickWins: [],
      notes: '',
    },
    endOfDay: {
      gotDone: '',
      carryingOver: '',
      wins: '',
    },
  };
}

function normalizeLinesToList(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export function useDailyNote(noteDate?: string) {
  const { user } = useAuth();
  const effectiveDate = useMemo(() => noteDate ?? format(new Date(), 'yyyy-MM-dd'), [noteDate]);

  const [draft, setDraft] = useState<DailyNoteDraft>(() => defaultDraft(effectiveDate));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastLoadedDateRef = useRef<string | null>(null);

  // Reset state when date changes
  useEffect(() => {
    setDraft(defaultDraft(effectiveDate));
    dirtyRef.current = false;
    setLoading(true);
  }, [effectiveDate]);

  // Load existing note from DB
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Avoid double-load for same date
    if (lastLoadedDateRef.current === effectiveDate) {
      setLoading(false);
      return;
    }
    lastLoadedDateRef.current = effectiveDate;

    const load = async () => {
      try {
        const loaded = await backend.dailyNotes.getByDate(user.id, effectiveDate);
        if (!loaded) {
          setDraft(defaultDraft(effectiveDate));
          setLoading(false);
          return;
        }

        setDraft(loaded);
        dirtyRef.current = false;
        setLoading(false);
      } catch (e) {
        console.error('Error loading daily note:', e);
        setDraft(defaultDraft(effectiveDate));
        setLoading(false);
        return;
      }
    };

    load();
  }, [user, effectiveDate]);

  const scheduleSave = useCallback(() => {
    if (!user) return;
    if (!dirtyRef.current) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        await backend.dailyNotes.upsert(user.id, draft);

        dirtyRef.current = false;
      } catch (e) {
        console.error('Error saving daily note:', e);
        toast.error('Failed to save daily note');
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [user, draft]);

  // Auto-save on changes
  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [scheduleSave]);

  const markDirtyAndUpdate = useCallback((updater: (prev: DailyNoteDraft) => DailyNoteDraft) => {
    dirtyRef.current = true;
    setDraft(updater);
  }, []);

  const setRawDump = useCallback((rawDump: string) => {
    markDirtyAndUpdate((prev) => ({ ...prev, rawDump }));
  }, [markDirtyAndUpdate]);

  const setMorningPrompt = useCallback(
    (key: keyof DailyNoteDraft['morningPrompts'], value: string) => {
      markDirtyAndUpdate((prev) => ({
        ...prev,
        morningPrompts: { ...prev.morningPrompts, [key]: value },
      }));
    },
    [markDirtyAndUpdate]
  );

  const setTop3Item = useCallback(
    (index: number, updates: Partial<DailyNoteTop3Item>) => {
      markDirtyAndUpdate((prev) => {
        const next = [...prev.top3];
        const existing = next[index] ?? { text: '', completed: false };
        next[index] = { ...existing, ...updates };
        return { ...prev, top3: next };
      });
    },
    [markDirtyAndUpdate]
  );

  const setListFieldFromText = useCallback(
    (field: keyof DailyNoteDraft['organizedTasks'], text: string) => {
      const list = normalizeLinesToList(text);
      markDirtyAndUpdate((prev) => ({
        ...prev,
        organizedTasks: { ...prev.organizedTasks, [field]: list },
      }));
    },
    [markDirtyAndUpdate]
  );

  const setNotes = useCallback((notes: string) => {
    markDirtyAndUpdate((prev) => ({
      ...prev,
      organizedTasks: { ...prev.organizedTasks, notes },
    }));
  }, [markDirtyAndUpdate]);

  const setEndOfDay = useCallback(
    (key: keyof DailyNoteDraft['endOfDay'], value: string) => {
      markDirtyAndUpdate((prev) => ({
        ...prev,
        endOfDay: { ...prev.endOfDay, [key]: value },
      }));
    },
    [markDirtyAndUpdate]
  );

  const requireAuth = useCallback(() => {
    toast.error('Sign in to save your daily notes', {
      action: { label: 'Sign in', onClick: () => (window.location.href = '/auth') },
    });
  }, []);

  // Merge partial data from chat extraction (only updates non-empty fields)
  const mergeChatExtraction = useCallback((extraction: Partial<{
    rawDump?: string;
    morningPrompts?: Partial<DailyNoteDraft['morningPrompts']>;
    top3?: Array<{ text: string; completed: boolean }>;
    organizedTasks?: Partial<DailyNoteDraft['organizedTasks']>;
    endOfDay?: Partial<DailyNoteDraft['endOfDay']>;
  }>) => {
    if (!extraction || Object.keys(extraction).length === 0) return;

    markDirtyAndUpdate((prev) => {
      const next = { ...prev };

      // Merge rawDump (replace if provided)
      if (extraction.rawDump) {
        next.rawDump = extraction.rawDump;
      }

      // Merge morningPrompts (individual fields)
      if (extraction.morningPrompts) {
        next.morningPrompts = {
          ...prev.morningPrompts,
          ...(extraction.morningPrompts.weighingOnMe && { weighingOnMe: extraction.morningPrompts.weighingOnMe }),
          ...(extraction.morningPrompts.avoiding && { avoiding: extraction.morningPrompts.avoiding }),
          ...(extraction.morningPrompts.meetings && { meetings: extraction.morningPrompts.meetings }),
          ...(extraction.morningPrompts.followUps && { followUps: extraction.morningPrompts.followUps }),
          ...(extraction.morningPrompts.win && { win: extraction.morningPrompts.win }),
        };
      }

      // Merge top3 (replace if provided with 3 items)
      if (extraction.top3 && extraction.top3.length > 0) {
        next.top3 = extraction.top3.slice(0, 3).map((item) => ({
          text: item.text || '',
          completed: item.completed || false,
        }));
        // Pad to 3 items if needed
        while (next.top3.length < 3) {
          next.top3.push({ text: '', completed: false });
        }
      }

      // Merge organizedTasks (append to arrays, replace notes)
      if (extraction.organizedTasks) {
        const org = extraction.organizedTasks;
        next.organizedTasks = {
          actionsToday: org.actionsToday?.length ? org.actionsToday : prev.organizedTasks.actionsToday,
          thisWeek: org.thisWeek?.length ? org.thisWeek : prev.organizedTasks.thisWeek,
          decisionsNeeded: org.decisionsNeeded?.length ? org.decisionsNeeded : prev.organizedTasks.decisionsNeeded,
          quickWins: org.quickWins?.length ? org.quickWins : prev.organizedTasks.quickWins,
          notes: org.notes || prev.organizedTasks.notes,
        };
      }

      // Merge endOfDay (individual fields)
      if (extraction.endOfDay) {
        next.endOfDay = {
          ...prev.endOfDay,
          ...(extraction.endOfDay.gotDone && { gotDone: extraction.endOfDay.gotDone }),
          ...(extraction.endOfDay.carryingOver && { carryingOver: extraction.endOfDay.carryingOver }),
          ...(extraction.endOfDay.wins && { wins: extraction.endOfDay.wins }),
        };
      }

      return next;
    });
  }, [markDirtyAndUpdate]);

  return {
    draft,
    loading,
    saving,
    isAuthenticated: !!user,
    requireAuth,
    setRawDump,
    setMorningPrompt,
    setTop3Item,
    setListFieldFromText,
    setNotes,
    setEndOfDay,
    mergeChatExtraction,
  };
}


