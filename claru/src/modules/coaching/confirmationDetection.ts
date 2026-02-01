/**
 * @file confirmationDetection.ts
 * @description Detects when user confirms their plan in a morning check-in.
 * @module coaching
 * 
 * Used to trigger auto-save of daily notes when user says "yes", "looks good", etc.
 */

/**
 * Patterns that indicate user is confirming their plan.
 * Note: These are checked against trimmed input up to 80 chars.
 */
const CONFIRMATION_PATTERNS = [
  /^(yes|yep|yeah|yup|sure|ok|okay)[.!,]?$/i,
  /^sounds? good[.!]?$/i,
  /^looks? good[.!]?$/i,
  /^that('?s| is)? (good|great|perfect|right|correct)[.!]?$/i,
  /^(let'?s? )?do it[.!]?$/i,
  /^(that'?s? )?the plan[.!]?$/i,
  /^confirmed?[.!]?$/i,
  /^(sounds?|looks?) right[.!]?$/i,
  /^all good[.!]?$/i,
  /^perfect[.!]?$/i,
  /^(that )?works( for me)?[.!]?$/i,
  /lock it in[.!]?$/i,
  /^yes[,.]? .{0,40}(perfect|good|great|sounds|works)[.!]?$/i,
  /^(yep|yeah)[,.]? .{0,40}(perfect|good|great|sounds|works)[.!]?$/i,
];

/**
 * Checks if a user message is confirming their plan.
 * 
 * @param userMessage - The user's message content
 * @returns True if the message appears to be a confirmation
 * 
 * @example
 * isConfirmation("Yes") // true
 * isConfirmation("Sounds good") // true
 * isConfirmation("Actually, can we change #2?") // false
 */
export function isConfirmation(userMessage: string): boolean {
  const trimmed = userMessage.trim();
  
  // Short to medium affirmative messages (up to 80 chars)
  if (trimmed.length < 80) {
    for (const pattern of CONFIRMATION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Checks if the last assistant message was asking for plan confirmation.
 * 
 * @param assistantMessage - The last assistant message content
 * @returns True if the assistant was asking for confirmation
 */
export function isAskingForConfirmation(assistantMessage: string): boolean {
  const lower = assistantMessage.toLowerCase();
  return (
    lower.includes('sound right') ||
    lower.includes('sounds right') ||
    lower.includes('look right') ||
    lower.includes('looks right') ||
    lower.includes('does this') ||
    lower.includes('does that') ||
    lower.includes('sound good') ||
    lower.includes('look good') ||
    lower.includes('priority order feel right') ||
    lower.includes('your top 3') ||
    lower.includes('can you block') ||
    lower.includes('ready to lock') ||
    lower.includes('confirm your') ||
    lower.includes("here's what i'd suggest") ||
    lower.includes('what i suggest')
  );
}

/**
 * Determines if a plan should be saved based on conversation state.
 * 
 * @param lastUserMessage - The user's latest message
 * @param lastAssistantMessage - The assistant's previous message
 * @returns True if the plan should be saved
 */
export function shouldSavePlan(
  lastUserMessage: string,
  lastAssistantMessage: string
): boolean {
  return (
    isConfirmation(lastUserMessage) &&
    isAskingForConfirmation(lastAssistantMessage)
  );
}
