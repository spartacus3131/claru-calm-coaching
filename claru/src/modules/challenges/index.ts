/**
 * @file index.ts
 * @description Challenge Engine module exports
 * @module challenges
 *
 * This module provides the 22 productivity challenge definitions and related
 * types for the Claru coaching experience.
 */

// Types and schemas (challenge definitions)
export {
  JourneyPartSchema,
  ChallengeStepSchema,
  ChallengeDefinitionSchema,
  PartInfoSchema,
  PartInfoMapSchema,
  type JourneyPart,
  type ChallengeStep,
  type ChallengeDefinition,
  type PartInfo,
  type PartInfoMap,
} from './types';

// Data and helpers (challenge definitions)
export {
  CHALLENGES,
  PART_INFO,
  getChallengeById,
  getChallengesByPart,
} from './data';

// State machine (user challenge progress)
export {
  ChallengeStatusSchema,
  UserChallengeSchema,
  canTransition,
  getValidTransitions,
  daysSince,
  isCooldownExpired,
  getCooldownDaysRemaining,
  InvalidTransitionError,
  CooldownNotExpiredError,
  DECLINE_COOLDOWN_DAYS,
  type ChallengeStatus,
  type UserChallenge,
} from './stateMachine';

// F021: Values Challenge (Challenge 1) specific logic
export {
  VALUES_CHALLENGE_ID,
  ValuesDataSchema,
  parseValuesData,
  addStepResponse,
  extractValuesFromText,
  formatValuesForPrompt,
  isValuesComplete,
  getNextValuesStep,
  VALUES_STEP_INSTRUCTIONS,
  type ValuesData,
} from './valuesChallenge';

// F022: Impact Challenge (Challenge 2) specific logic
export {
  IMPACT_CHALLENGE_ID,
  ImpactDataSchema,
  parseImpactData,
  addImpactStepResponse,
  extractHighImpactTasks,
  formatImpactForPrompt,
  isImpactComplete,
  getNextImpactStep,
  IMPACT_STEP_INSTRUCTIONS,
  type ImpactData,
} from './impactChallenge';

// F023: Prime Time Challenge (Challenge 4) specific logic
export {
  PRIME_TIME_CHALLENGE_ID,
  MINIMUM_LOGS_FOR_BPT,
  EnergyLogEntrySchema,
  PeakSchema,
  BPTPeaksSchema,
  PrimeTimeDataSchema,
  parsePrimeTimeData,
  addEnergyLog,
  calculateBPT,
  formatPrimeTimeForPrompt,
  isPrimeTimeComplete,
  getNextPrimeTimeStep,
  getLoggingProgress,
  PRIME_TIME_STEP_INSTRUCTIONS,
  type EnergyLogEntry,
  type Peak,
  type BPTPeaks,
  type PrimeTimeData,
  type LoggingProgress,
} from './primeTimeChallenge';
