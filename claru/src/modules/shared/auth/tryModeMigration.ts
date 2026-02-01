/**
 * @file tryModeMigration.ts
 * @description F029 Try Mode migration logic
 * @module shared/auth
 *
 * Handles migration of trial messages to the authenticated user's database.
 * Called during the signup flow to preserve trial conversation.
 *
 * Per bounded-contexts.mdc: Part of User Identity context.
 * Per domain-language.mdc: "Try Mode" is the guest experience.
 */

import { TryModeMessage } from '@/hooks/useTryMode';

/**
 * Result of the migration attempt.
 */
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  error?: string;
}

/**
 * Validates a trial message has required fields.
 *
 * @param message - Message to validate
 * @returns True if message is valid for migration
 */
function isValidMessage(message: TryModeMessage): boolean {
  return (
    typeof message.id === 'string' &&
    message.id.length > 0 &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    typeof message.createdAt === 'string'
  );
}

/**
 * Migrates trial messages to the authenticated user's database.
 *
 * This function is called after successful signup to preserve the
 * conversation the user had during their trial session.
 *
 * Per error-handling.mdc: Returns result object instead of throwing.
 *
 * @param messages - Trial messages to migrate
 * @returns Migration result with success status and count
 *
 * @example
 * ```ts
 * const result = await migrateTrialMessages(trialMessages);
 * if (result.success) {
 *   clearTrialMessages(); // Clear localStorage
 *   redirect('/chat');
 * } else {
 *   console.error('Migration failed:', result.error);
 * }
 * ```
 */
export async function migrateTrialMessages(
  messages: TryModeMessage[]
): Promise<MigrationResult> {
  // Fast path: no messages to migrate
  if (messages.length === 0) {
    return { success: true, migratedCount: 0 };
  }

  // Filter out invalid messages
  const validMessages = messages.filter(isValidMessage);

  if (validMessages.length === 0) {
    return { success: true, migratedCount: 0 };
  }

  try {
    const response = await fetch('/api/chat/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: validMessages }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        migratedCount: 0,
        error: errorData.error || 'Migration failed',
      };
    }

    const data = await response.json();
    return {
      success: true,
      migratedCount: data.migratedCount ?? validMessages.length,
    };
  } catch (error) {
    // Per error-handling.mdc: Log with context, return user-friendly error
    console.error('Trial message migration failed:', error);
    return {
      success: false,
      migratedCount: 0,
      error: error instanceof Error ? error.message : 'Migration failed',
    };
  }
}
