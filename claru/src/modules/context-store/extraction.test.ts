import { extractPlanFromConversation, type ExtractionResult } from './extraction';
import type { Message } from '@/modules/coaching/types';
import { createMessage } from '@/modules/coaching/types';

describe('User Context Store - Extraction', () => {
  describe('extractPlanFromConversation', () => {
    it('extracts Top 3 from AI confirmation message', () => {
      const messages: Message[] = [
        createMessage({
          role: 'user',
          content: 'I need to finish the investor deck, do competitor analysis, and follow up on candidates',
        }),
        createMessage({
          role: 'assistant',
          content: `Got it. Here's what I'm capturing:

**Top 3:**
1. Finish investor deck
2. Competitor analysis for Sarah
3. Candidate follow-ups

Does this priority order feel right?`,
        }),
        createMessage({ role: 'user', content: 'Yes, looks good' }),
        createMessage({
          role: 'assistant',
          content: `Perfect. Your plan is locked in:

**Top 3:**
1. Finish investor deck (deep focus)
2. Competitor analysis (deep focus)
3. Candidate follow-ups (admin)

Go get it!`,
        }),
      ];

      const result = extractPlanFromConversation(messages);

      expect(result.top3).toHaveLength(3);
      expect(result.top3[0].text).toContain('investor deck');
      expect(result.top3[1].text).toContain('analysis');
      expect(result.top3[2].text).toContain('follow-ups');
    });

    it('extracts admin batch items', () => {
      const messages: Message[] = [
        createMessage({
          role: 'assistant',
          content: `Here's your plan:

**Top 3:**
1. Write blog post

**Admin Batch:**
- Reply to emails
- Schedule dentist
- Update Slack status

Focus block: 9:00 AM - 11:00 AM`,
        }),
      ];

      const result = extractPlanFromConversation(messages);

      expect(result.adminBatch).toContain('Reply to emails');
      expect(result.adminBatch).toContain('Schedule dentist');
    });

    it('extracts raw dump from user messages', () => {
      const messages: Message[] = [
        createMessage({
          role: 'user',
          content: 'Today I need to work on the roadmap, also dentist at 2pm and call mom',
        }),
        createMessage({
          role: 'assistant',
          content: 'Got it. Let me organize that for you.',
        }),
      ];

      const result = extractPlanFromConversation(messages);

      expect(result.rawDump).toContain('roadmap');
      expect(result.rawDump).toContain('dentist');
    });

    it('returns empty result for empty conversation', () => {
      const result = extractPlanFromConversation([]);

      expect(result.top3).toHaveLength(0);
      expect(result.adminBatch).toHaveLength(0);
      expect(result.rawDump).toBe('');
    });

    it('detects work types from context clues', () => {
      const messages: Message[] = [
        createMessage({
          role: 'assistant',
          content: `Your Top 3:
1. Write technical spec (deep focus - needs 2 hours)
2. Team standup at 10am (meeting)
3. Clear email inbox (admin - 15 min batch)`,
        }),
      ];

      const result = extractPlanFromConversation(messages);

      expect(result.top3[0].workType).toBe('deep_focus');
      expect(result.top3[1].workType).toBe('meeting');
      expect(result.top3[2].workType).toBe('admin');
    });
  });
});
