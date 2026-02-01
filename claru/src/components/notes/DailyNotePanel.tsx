/**
 * @file DailyNotePanel.tsx
 * @description Daily note panel with morning prompts, Top 3, organized tasks, and end of day.
 * @module components/notes
 * 
 * F006: Ported from old src/ with adaptations for Next.js.
 * Matches the user's Obsidian daily note workflow.
 */

'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Loader2, Lock, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDailyNote } from '@/hooks/useDailyNote';

/**
 * Helper to convert string array to newline-separated text.
 */
function listToText(items: string[]): string {
  return (items ?? []).join('\n');
}

/**
 * Daily note panel component.
 * Displays and allows editing of:
 * - Morning brain dump
 * - Morning prompts (weighingOnMe, avoiding, meetings, followUps, win)
 * - Top 3 priorities
 * - Organized tasks (actionsToday, thisWeek, decisionsNeeded, quickWins, notes)
 * - End of day reflection
 */
export function DailyNotePanel() {
  const {
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
  } = useDailyNote();

  const title = useMemo(() => {
    try {
      return format(parseISO(draft.noteDate), 'yyyy-MM-dd');
    } catch {
      return draft.noteDate;
    }
  }, [draft.noteDate]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading daily note...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto-fill info banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs text-foreground">
          <span className="font-medium">Auto-fills from your check-ins.</span>{' '}
          <span className="text-muted-foreground">Chat with Claru and these fields populate automatically. You can also edit manually.</span>
        </p>
      </div>

      {/* Header section */}
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            <h3 className="text-base font-semibold text-foreground">Daily Note</h3>
            <span className="text-xs text-muted-foreground">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <button
                onClick={requireAuth}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                Sign in to save
              </button>
            )}
            {isAuthenticated && (
              <span className={cn('text-xs', saving ? 'text-muted-foreground' : 'text-emerald-500')}>
                {saving ? 'Saving...' : 'Saved'}
              </span>
            )}
          </div>
        </div>

        {/* Morning brain dump and prompts */}
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Morning brain dump</div>
            <Textarea
              value={draft.rawDump}
              onChange={(e) => setRawDump(e.target.value)}
              placeholder="Dump everything on your mind..."
              className="min-h-[100px]"
              disabled={!isAuthenticated}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-medium text-foreground mb-1">What&apos;s weighing on me?</div>
              <Input
                value={draft.morningPrompts.weighingOnMe}
                onChange={(e) => setMorningPrompt('weighingOnMe', e.target.value)}
                placeholder="One sentence is fine"
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground mb-1">What am I avoiding?</div>
              <Input
                value={draft.morningPrompts.avoiding}
                onChange={(e) => setMorningPrompt('avoiding', e.target.value)}
                placeholder="Name the thing"
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground mb-1">Meetings / commitments</div>
              <Input
                value={draft.morningPrompts.meetings}
                onChange={(e) => setMorningPrompt('meetings', e.target.value)}
                placeholder="Short list is fine"
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground mb-1">Who do I need to follow up with?</div>
              <Input
                value={draft.morningPrompts.followUps}
                onChange={(e) => setMorningPrompt('followUps', e.target.value)}
                placeholder="Names + what"
                disabled={!isAuthenticated}
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-foreground mb-1">What would make today a win?</div>
            <Input
              value={draft.morningPrompts.win}
              onChange={(e) => setMorningPrompt('win', e.target.value)}
              placeholder="Define success for today"
              disabled={!isAuthenticated}
            />
          </div>
        </div>
      </div>

      {/* Top 3 section */}
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <div className="text-sm font-semibold text-foreground mb-2">Today&apos;s Top 3 (Highest Impact)</div>
        <div className="space-y-2">
          {draft.top3.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) => setTop3Item(idx, { completed: e.target.checked })}
                disabled={!isAuthenticated}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Input
                value={item.text}
                onChange={(e) => setTop3Item(idx, { text: e.target.value })}
                placeholder={`Priority ${idx + 1}`}
                disabled={!isAuthenticated}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Organized tasks section */}
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <div className="text-sm font-semibold text-foreground mb-2">Organized Tasks</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Actions (Do Today)</div>
            <Textarea
              value={listToText(draft.organizedTasks.actionsToday)}
              onChange={(e) => setListFieldFromText('actionsToday', e.target.value)}
              placeholder="- one per line"
              className="min-h-[92px]"
              disabled={!isAuthenticated}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-1">This Week</div>
            <Textarea
              value={listToText(draft.organizedTasks.thisWeek)}
              onChange={(e) => setListFieldFromText('thisWeek', e.target.value)}
              placeholder="- one per line"
              className="min-h-[92px]"
              disabled={!isAuthenticated}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Decisions Needed</div>
            <Textarea
              value={listToText(draft.organizedTasks.decisionsNeeded)}
              onChange={(e) => setListFieldFromText('decisionsNeeded', e.target.value)}
              placeholder="- one per line"
              className="min-h-[92px]"
              disabled={!isAuthenticated}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Quick Wins (&lt; 5 min)</div>
            <Textarea
              value={listToText(draft.organizedTasks.quickWins)}
              onChange={(e) => setListFieldFromText('quickWins', e.target.value)}
              placeholder="- one per line"
              className="min-h-[92px]"
              disabled={!isAuthenticated}
            />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-sm font-medium text-foreground mb-1">Notes / Thoughts</div>
          <Textarea
            value={draft.organizedTasks.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else..."
            className="min-h-[92px]"
            disabled={!isAuthenticated}
          />
        </div>
      </div>

      {/* End of day section */}
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <div className="text-sm font-semibold text-foreground mb-2">End of Day</div>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-foreground mb-1">What got done?</div>
            <Textarea
              value={draft.endOfDay.gotDone}
              onChange={(e) => setEndOfDay('gotDone', e.target.value)}
              className="min-h-[72px]"
              disabled={!isAuthenticated}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-1">What&apos;s carrying over? Why?</div>
            <Textarea
              value={draft.endOfDay.carryingOver}
              onChange={(e) => setEndOfDay('carryingOver', e.target.value)}
              className="min-h-[72px]"
              disabled={!isAuthenticated}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Any wins or insights?</div>
            <Textarea
              value={draft.endOfDay.wins}
              onChange={(e) => setEndOfDay('wins', e.target.value)}
              className="min-h-[72px]"
              disabled={!isAuthenticated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
