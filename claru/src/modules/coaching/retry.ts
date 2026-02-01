/**
 * @file retry.ts
 * @description Retry logic with exponential backoff for F030 Fallback Responses.
 * @module coaching
 *
 * Per ai-claude.mdc:
 * - ALWAYS retry transient failures
 * - Don't retry auth errors (401, 403)
 * - Use exponential backoff
 * - Max delay capped at 5 seconds
 */

/**
 * Configuration for retry behavior.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts. Default: 3 */
  maxRetries: number;
  /** Base delay in milliseconds. Default: 1000 */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds. Default: 5000 */
  maxDelayMs: number;
  /** Optional callback called before each retry */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

/**
 * Default retry configuration.
 * Per ai-claude.mdc: 3 retries, 1s base, 5s max.
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 5000,
};

/**
 * Non-retryable error codes (auth and permission errors).
 * These errors indicate issues that won't resolve with retries.
 */
const NON_RETRYABLE_PATTERNS = [
  '401',
  '403',
  'Unauthorized',
  'Forbidden',
] as const;

/**
 * Determines if an error is retryable.
 * Auth errors (401, 403) are not retryable per ai-claude.mdc.
 *
 * @param error - The error to check
 * @returns True if the error should be retried
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message || '';

  // Check for non-retryable patterns
  for (const pattern of NON_RETRYABLE_PATTERNS) {
    if (message.includes(pattern)) {
      return false;
    }
  }

  // All other errors are considered retryable
  return true;
}

/**
 * Calculates the backoff delay for a retry attempt.
 * Uses exponential backoff with jitter to prevent thundering herd.
 *
 * @param attempt - The current attempt number (0-indexed)
 * @param baseDelayMs - The base delay in milliseconds
 * @param maxDelayMs - The maximum delay cap
 * @returns The delay in milliseconds to wait before retrying
 *
 * @example
 * calculateBackoff(0, 1000, 5000) // ~1000ms
 * calculateBackoff(1, 1000, 5000) // ~2000ms
 * calculateBackoff(2, 1000, 5000) // ~4000ms
 * calculateBackoff(3, 1000, 5000) // ~5000ms (capped)
 */
export function calculateBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  // Exponential: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

  // Cap at max
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (±10%) to prevent thundering herd
  const jitter = 1 + (Math.random() * 0.2 - 0.1);

  return Math.floor(cappedDelay * jitter);
}

/**
 * Wraps an async function with retry logic and exponential backoff.
 * Per ai-claude.mdc: ALWAYS retry transient failures.
 *
 * @param fn - The async function to execute
 * @param config - Optional retry configuration
 * @returns The result of the function if successful
 * @throws The last error if all retries are exhausted
 *
 * @example
 * const result = await withRetry(
 *   () => fetchFromAI(prompt),
 *   { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 5000 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    onRetry,
  } = { ...DEFAULT_RETRY_CONFIG, ...config };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry non-retryable errors (auth errors)
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      // If this was our last attempt, throw
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const delayMs = calculateBackoff(attempt, baseDelayMs, maxDelayMs);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt + 1, delayMs);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError ?? new Error('Unexpected retry loop exit');
}
