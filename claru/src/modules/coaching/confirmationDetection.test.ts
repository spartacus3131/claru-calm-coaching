/**
 * Confirmation Detection Tests - F010
 */

import {
  isConfirmation,
  isAskingForConfirmation,
  shouldSavePlan,
} from './confirmationDetection';

describe('Confirmation Detection', () => {
  describe('isConfirmation', () => {
    it('detects simple affirmatives', () => {
      expect(isConfirmation('yes')).toBe(true);
      expect(isConfirmation('Yes')).toBe(true);
      expect(isConfirmation('yep')).toBe(true);
      expect(isConfirmation('yeah')).toBe(true);
      expect(isConfirmation('sure')).toBe(true);
      expect(isConfirmation('ok')).toBe(true);
      expect(isConfirmation('okay')).toBe(true);
    });

    it('detects "sounds good" variations', () => {
      expect(isConfirmation('sounds good')).toBe(true);
      expect(isConfirmation('Sounds good')).toBe(true);
      expect(isConfirmation('sounds good.')).toBe(true);
      expect(isConfirmation('sound good')).toBe(true);
    });

    it('detects "looks good" variations', () => {
      expect(isConfirmation('looks good')).toBe(true);
      expect(isConfirmation('Looks good')).toBe(true);
      expect(isConfirmation('look good')).toBe(true);
    });

    it('detects other confirmations', () => {
      expect(isConfirmation("that's right")).toBe(true);
      expect(isConfirmation('perfect')).toBe(true);
      expect(isConfirmation('confirmed')).toBe(true);
      expect(isConfirmation("let's do it")).toBe(true);
      expect(isConfirmation('works for me')).toBe(true);
    });

    it('rejects non-confirmations', () => {
      expect(isConfirmation('Actually, can we change #2?')).toBe(false);
      expect(isConfirmation('Wait, I forgot something')).toBe(false);
      expect(isConfirmation('No, that is not right')).toBe(false);
      expect(isConfirmation('Let me think about it')).toBe(false);
    });

    it('rejects long messages even with confirmation words', () => {
      expect(
        isConfirmation('Yes, but I also need to add the investor meeting to the list')
      ).toBe(false);
    });
  });

  describe('isAskingForConfirmation', () => {
    it('detects confirmation questions', () => {
      expect(isAskingForConfirmation('Does this priority order feel right?')).toBe(true);
      expect(isAskingForConfirmation('Sound right?')).toBe(true);
      expect(isAskingForConfirmation('Sounds right?')).toBe(true);
      expect(isAskingForConfirmation('Does that look good?')).toBe(true);
    });

    it('detects Top 3 mentions', () => {
      expect(
        isAskingForConfirmation('So your Top 3 are: 1. Deck, 2. Meeting, 3. Review')
      ).toBe(true);
    });

    it('rejects non-confirmation questions', () => {
      expect(isAskingForConfirmation("What's on your mind today?")).toBe(false);
      expect(isAskingForConfirmation('Tell me more about that meeting')).toBe(false);
    });
  });

  describe('shouldSavePlan', () => {
    it('returns true when user confirms after assistant asks', () => {
      expect(
        shouldSavePlan('yes', 'So your Top 3 are: 1. Deck, 2. Meeting, 3. Review. Sound right?')
      ).toBe(true);

      expect(
        shouldSavePlan('sounds good', 'Does this priority order feel right?')
      ).toBe(true);
    });

    it('returns false when user did not confirm', () => {
      expect(
        shouldSavePlan('Actually, change #2', 'Does this priority order feel right?')
      ).toBe(false);
    });

    it('returns false when assistant was not asking for confirmation', () => {
      expect(
        shouldSavePlan('yes', "What's on your mind today?")
      ).toBe(false);
    });
  });
});
