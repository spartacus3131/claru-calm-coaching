/**
 * @file page.tsx
 * @description Notes page displaying the daily note panel.
 * @module app/(app)/notes
 * 
 * F006: Daily Note Panel implementation.
 */

import { Metadata } from 'next';
import { DailyNotePanel } from '@/components/notes';

export const metadata: Metadata = {
  title: 'Daily Notes | Claru',
  description: 'Your daily notes and reflections',
};

/**
 * Notes Page - F006 (Daily Note Panel)
 *
 * Displays the daily note with:
 * - Morning brain dump and prompts
 * - Top 3 priorities
 * - Organized tasks
 * - End of day reflection
 */
export default function NotesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <DailyNotePanel />
    </div>
  );
}
