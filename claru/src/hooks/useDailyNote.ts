/**
 * @file useDailyNote.ts
 * @description Hook for managing daily note state with auto-save.
 * @module hooks
 * 
 * F006: Ported from old src/ with adaptations for Next.js fetch API.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  type DailyNoteDraft,
  type DailyNoteTop3Item,
  createDefaultDailyNoteDraft,
} from '@/modules/context-store/types';

/**
 * Hook for managing daily note state.
 * 
 * Features:
 * - Auto-saves with debounce (800ms)
 * - Supports unauthenticated mode (read-only)
 * - Provides field-level setters for form binding
 * - Supports merge from chat extraction
 */
export function useDailyNote(noteDate?: string) {
  const effectiveDate = useMemo(() => noteDate ?? format(new Date(), 'yyyy-MM-dd'), [noteDate]);

  const [draft, setDraft] = useState<DailyNoteDraft>(() => createDefaultDailyNoteDraft(effectiveDate));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoadedDateRef = useRef<string | null>(null);

  // Reset state when date changes
  useEffect(() => {
    setDraft(createDefaultDailyNoteDraft(effectiveDate));
    dirtyRef.current = false;
    setLoading(true);
    lastLoadedDateRef.current = null;
  }, [effectiveDate]);

  // Load existing note from API
  useEffect(() => {
    // Avoid double-load for same date
    if (lastLoadedDateRef.current === effectiveDate) {
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/daily-notes?date=${effectiveDate}&format=draft`);
        
        if (response.status === 401) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        if (!response.ok) {
          console.error('Failed to load daily note:', response.statusText);
          setLoading(false);
          return;
        }

        const { data } = await response.json();
        lastLoadedDateRef.current = effectiveDate;

        if (!data) {
          setDraft(createDefaultDailyNoteDraft(effectiveDate));
          setLoading(false);
          return;
        }

        setDraft(data);
        dirtyRef.current = false;
        setLoading(false);
      } catch (e) {
        console.error('Error loading daily note:', e);
        setLoading(false);
      }
    };

    load();
  }, [effectiveDate]);

  const scheduleSave = useCallback(() => {
    if (!isAuthenticated) return;
    if (!dirtyRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const response = await fetch('/api/daily-notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });

        if (!response.ok) {
          throw new Error('Failed to save');
        }

        dirtyRef.current = false;
      } catch (e) {
        console.error('Error saving daily note:', e);
        toast.error('Failed to save daily note');
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [isAuthenticated, draft]);

  // Auto-save on changes
  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
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
      if (field === 'notes') {
        // notes is a string, not an array
        markDirtyAndUpdate((prev) => ({
          ...prev,
          organizedTasks: { ...prev.organizedTasks, notes: text },
        }));
        return;
      }
      
      const list = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
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

      // Merge top3 (replace if provided with items)
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

      // Merge organizedTasks (replace arrays if provided, replace notes)
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
    isAuthenticated,
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
