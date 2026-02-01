/**
 * Token Usage Tracking Tests - F010
 * 
 * Tests for AI usage logging and cost calculation.
 */

import {
  calculateCost,
  type TokenUsage,
} from './tokenTracking';

describe('Token Usage Tracking', () => {
  describe('calculateCost', () => {
    it('calculates cost for typical check-in (3K in, 700 out)', () => {
      const usage: TokenUsage = {
        tokensIn: 3000,
        tokensOut: 700,
      };
      
      // Claude Sonnet: $3/M input, $15/M output
      // 3000 * $3/1M = $0.009
      // 700 * $15/1M = $0.0105
      // Total: $0.0195
      const cost = calculateCost(usage);
      expect(cost).toBeCloseTo(0.0195, 4);
    });

    it('calculates cost for zero tokens', () => {
      const usage: TokenUsage = {
        tokensIn: 0,
        tokensOut: 0,
      };
      
      expect(calculateCost(usage)).toBe(0);
    });

    it('calculates cost for large conversation (10K in, 2K out)', () => {
      const usage: TokenUsage = {
        tokensIn: 10000,
        tokensOut: 2000,
      };
      
      // 10000 * $3/1M = $0.03
      // 2000 * $15/1M = $0.03
      // Total: $0.06
      const cost = calculateCost(usage);
      expect(cost).toBeCloseTo(0.06, 4);
    });
  });

  describe('daily budget calculations', () => {
    it('$5 daily budget allows ~250 typical check-ins', () => {
      // Typical check-in: ~$0.02
      // $5 / $0.02 = 250 check-ins
      const typicalCost = calculateCost({ tokensIn: 3000, tokensOut: 700 });
      const checksPerDay = 5 / typicalCost;
      
      expect(checksPerDay).toBeGreaterThan(200);
    });

    it('even heavy usage stays well under $5/day', () => {
      // 20 check-ins per day (excessive)
      const heavyUsageCost = 20 * calculateCost({ tokensIn: 5000, tokensOut: 1000 });
      
      expect(heavyUsageCost).toBeLessThan(5);
    });
  });
});
