/**
 * @file retry.test.ts
 * @description Tests for retry logic with exponential backoff - F030 Fallback Responses.
 * @module coaching
 *
 * Per ai-claude.mdc:
 * - ALWAYS retry transient failures
 * - Don't retry auth errors
 * - Use exponential backoff
 */

import {
  withRetry,
  isRetryableError,
  calculateBackoff,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from './retry';

describe('Retry Logic - F030', () => {
  describe('calculateBackoff', () => {
    it('returns base delay on first attempt (attempt 0)', () => {
      const delay = calculateBackoff(0, 1000, 5000);

      // Jitter is ±10%, so delay should be between 900-1100
      expect(delay).toBeGreaterThanOrEqual(900);
      expect(delay).toBeLessThanOrEqual(1100);
    });

    it('doubles delay on each attempt (exponential)', () => {
      const delay0 = calculateBackoff(0, 1000, 10000);
      const delay1 = calculateBackoff(1, 1000, 10000);
      const delay2 = calculateBackoff(2, 1000, 10000);

      // Each should roughly double (with some jitter)
      expect(delay1).toBeGreaterThan(delay0 * 1.5);
      expect(delay2).toBeGreaterThan(delay1 * 1.5);
    });

    it('caps delay at maxDelay', () => {
      const delay = calculateBackoff(10, 1000, 5000);

      expect(delay).toBeLessThanOrEqual(5000 * 1.1); // Max + jitter
    });

    it('adds jitter to prevent thundering herd', () => {
      // Run multiple times to verify jitter
      const delays = Array.from({ length: 10 }, () => calculateBackoff(0, 1000, 5000));
      const uniqueDelays = new Set(delays);

      // Should have some variance (not all identical)
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('isRetryableError', () => {
    it('returns false for 401 auth errors', () => {
      const error = new Error('401 Unauthorized');

      expect(isRetryableError(error)).toBe(false);
    });

    it('returns false for 403 forbidden errors', () => {
      const error = new Error('403 Forbidden');

      expect(isRetryableError(error)).toBe(false);
    });

    it('returns true for 500 server errors', () => {
      const error = new Error('500 Internal Server Error');

      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for 502 bad gateway errors', () => {
      const error = new Error('502 Bad Gateway');

      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for 503 service unavailable', () => {
      const error = new Error('503 Service Unavailable');

      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for 429 rate limit errors', () => {
      const error = new Error('429 Too Many Requests');

      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for network errors', () => {
      const error = new Error('ECONNREFUSED');

      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for timeout errors', () => {
      const error = new Error('Request timeout');

      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for generic errors (default retryable)', () => {
      const error = new Error('Something went wrong');

      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns result on first successful attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const resultPromise = withRetry(fn);
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on transient failure and succeeds', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockResolvedValue('success');

      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
      };

      const resultPromise = withRetry(fn, config);
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws after exhausting all retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('503 Service Unavailable'));

      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
      };

      const resultPromise = withRetry(fn, config);

      // Run all timers to completion (handles all retry delays)
      for (let i = 0; i < 10; i++) {
        await Promise.resolve(); // Let microtasks run
        jest.advanceTimersByTime(2000);
      }

      await expect(resultPromise).rejects.toThrow('503 Service Unavailable');
      expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('does NOT retry auth errors (401)', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('401 Unauthorized'));

      const resultPromise = withRetry(fn);

      // Auth errors should reject immediately without retry
      await expect(resultPromise).rejects.toThrow('401 Unauthorized');
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('does NOT retry forbidden errors (403)', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('403 Forbidden'));

      const resultPromise = withRetry(fn);

      await expect(resultPromise).rejects.toThrow('403 Forbidden');
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('uses default config when none provided', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      await withRetry(fn);

      // Just verify it doesn't throw
      expect(fn).toHaveBeenCalled();
    });

    it('calls onRetry callback when retrying', async () => {
      const onRetry = jest.fn();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValue('success');

      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        onRetry,
      };

      const resultPromise = withRetry(fn, config);
      await jest.runAllTimersAsync();
      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        1,
        expect.any(Number)
      );
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(5000);
    });
  });
});
