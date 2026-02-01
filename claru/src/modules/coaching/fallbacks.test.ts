/**
 * @file fallbacks.test.ts
 * @description Tests for F030 Fallback Responses - graceful handling when AI is unavailable.
 * @module coaching
 *
 * Per ai-claude.mdc:
 * - ALWAYS have static fallbacks for API failures
 * - Fallbacks should be phase-aware (greeting, dump, priority, reflect)
 */

import {
  getFallbackResponse,
  isFallbackError,
  FallbackError,
  type CoachingPhase,
} from './fallbacks';

describe('Fallback Responses - F030', () => {
  describe('getFallbackResponse', () => {
    it('returns morning-appropriate response for morning flow', () => {
      const response = getFallbackResponse('morning', 'default');

      expect(response).toContain('morning');
      expect(response).not.toContain('evening');
      expect(response.length).toBeGreaterThan(20);
    });

    it('returns evening-appropriate response for evening flow', () => {
      const response = getFallbackResponse('evening', 'default');

      expect(response).toContain('trouble connecting');
      expect(response.length).toBeGreaterThan(20);
    });

    it('returns greeting phase response', () => {
      const response = getFallbackResponse('morning', 'greeting');

      expect(response).toContain('connection issue');
      expect(response).toContain("What's on your mind");
    });

    it('returns dump phase response encouraging brain dump', () => {
      const response = getFallbackResponse('morning', 'dump');

      expect(response).toContain('type');
      expect(response).toContain('organize');
    });

    it('returns priority phase response asking for Top 3', () => {
      const response = getFallbackResponse('morning', 'priority');

      expect(response).toContain('top 3');
    });

    it('returns reflect phase response for evening reflection', () => {
      const response = getFallbackResponse('evening', 'reflect');

      expect(response).toContain('wins');
    });

    it('returns default response for unknown phase', () => {
      const response = getFallbackResponse('morning', 'unknown' as CoachingPhase);

      expect(response.length).toBeGreaterThan(20);
    });

    it('all fallbacks are concise (under 280 chars)', () => {
      const phases: CoachingPhase[] = ['greeting', 'dump', 'priority', 'reflect', 'default'];
      const flows = ['morning', 'evening'] as const;

      for (const flow of flows) {
        for (const phase of phases) {
          const response = getFallbackResponse(flow, phase);
          expect(response.length).toBeLessThan(280);
        }
      }
    });

    it('no fallbacks contain em-dashes (per voice guide)', () => {
      const phases: CoachingPhase[] = ['greeting', 'dump', 'priority', 'reflect', 'default'];
      const flows = ['morning', 'evening'] as const;

      for (const flow of flows) {
        for (const phase of phases) {
          const response = getFallbackResponse(flow, phase);
          expect(response).not.toContain('—');
        }
      }
    });
  });

  describe('FallbackError', () => {
    it('creates error with fallback response', () => {
      const error = new FallbackError('AI unavailable', 'morning', 'greeting');

      expect(error.message).toBe('AI unavailable');
      expect(error.fallbackResponse).toContain('connection issue');
      expect(error.flow).toBe('morning');
      expect(error.phase).toBe('greeting');
    });

    it('is an instance of Error', () => {
      const error = new FallbackError('test', 'morning', 'default');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('FallbackError');
    });
  });

  describe('isFallbackError', () => {
    it('returns true for FallbackError instances', () => {
      const error = new FallbackError('test', 'morning', 'default');

      expect(isFallbackError(error)).toBe(true);
    });

    it('returns false for regular Error', () => {
      const error = new Error('test');

      expect(isFallbackError(error)).toBe(false);
    });

    it('returns false for non-Error objects', () => {
      expect(isFallbackError({ message: 'test' })).toBe(false);
      expect(isFallbackError('test')).toBe(false);
      expect(isFallbackError(null)).toBe(false);
      expect(isFallbackError(undefined)).toBe(false);
    });
  });
});
