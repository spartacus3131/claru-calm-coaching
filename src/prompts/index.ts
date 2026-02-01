// Core personality - included in every prompt
export { CORE_PERSONALITY } from './core-personality';

// Mode-specific prompts
export { buildMorningPrompt } from './morning-check-in';
export type { MorningPromptContext } from './morning-check-in';

export { buildEveningPrompt } from './evening-reflection';
export type { EveningPromptContext } from './evening-reflection';

// Challenge/foundation prompts
export { buildFoundationIntroPrompt } from './foundation-intro';
export type { FoundationDetails } from './foundation-intro';

export { getMorningChallengeNudge, getEveningChallengeNudge } from './challenge-nudges';
export type { ChallengeNudgeContext } from './challenge-nudges';

// Extraction
export { 
  DAILY_NOTE_EXTRACTION_INSTRUCTION, 
  parseDailyNoteExtraction 
} from './extraction';
export type { DailyNoteExtraction } from './extraction';

// Fallbacks
export { FALLBACK_RESPONSES, getFallbackResponse } from './fallbacks';
export type { FallbackType } from './fallbacks';

// Utility
export function getCountGuidance(turnCount: number): string {
  return turnCount > 10
    ? "\n\nNote: You're several exchanges in. Consider closing soon with a short summary and the user's next concrete step."
    : '';
}
