/**
 * @file challengeIntroPrompts.ts
 * @description Challenge introduction flow prompts for F019
 * @module coaching
 *
 * Builds system prompts for guiding users through starting a new challenge.
 * Claru introduces the challenge, explains the steps, and guides them to begin.
 *
 * Per ai-coaching-behavior.mdc:
 * - Direct and efficient
 * - Warm but not effusive
 * - One question at a time
 * - Non-judgmental
 */

import { PERSONA, GUARDRAILS } from './prompts';

/**
 * Challenge data needed for the introduction prompt.
 */
export interface ChallengeForPrompt {
  id: number;
  title: string;
  description: string;
  part: string;
  partTitle: string;
  time: string;
  energy: number;
  value: number;
  whatYouGet: string;
  steps: { title?: string; content: string }[];
  tips?: string[];
  researchInsight?: string;
  actionableTip?: string;
  citation?: string;
}

/**
 * Context needed to build the challenge introduction prompt.
 */
export interface ChallengeIntroContext {
  userName: string;
  challenge: ChallengeForPrompt;
  isFirstChallenge: boolean;
}

/**
 * Formats challenge details for inclusion in the prompt.
 *
 * @param challenge - Challenge data
 * @returns Formatted string with challenge details
 */
export function formatChallengeForPrompt(challenge: ChallengeForPrompt): string {
  const lines: string[] = [];

  lines.push(`## ${challenge.title}`);
  lines.push(`*${challenge.description}*`);
  lines.push('');
  lines.push(`- Time required: ${challenge.time}`);
  lines.push(`- Energy: ${challenge.energy}/10`);
  lines.push(`- Value: ${challenge.value}/10`);
  lines.push('');
  lines.push('### What You Will Get');
  lines.push(challenge.whatYouGet);
  lines.push('');
  lines.push('### Steps');

  challenge.steps.forEach((step, i) => {
    lines.push(`Step ${i + 1}: ${step.content}`);
  });

  if (challenge.tips && challenge.tips.length > 0) {
    lines.push('');
    lines.push('### Tips:');
    challenge.tips.forEach((tip) => {
      lines.push(`- ${tip}`);
    });
  }

  if (challenge.researchInsight) {
    lines.push('');
    lines.push('### Research Insight:');
    lines.push(challenge.researchInsight);
    if (challenge.citation) {
      lines.push(`(Source: ${challenge.citation})`);
    }
  }

  if (challenge.actionableTip) {
    lines.push('');
    lines.push('### Pro Tip:');
    lines.push(challenge.actionableTip);
  }

  return lines.join('\n');
}

/**
 * Gets the initial greeting for challenge introduction.
 *
 * @param params - Greeting parameters
 * @returns Greeting text
 */
export function getChallengeIntroGreeting(params: {
  challengeTitle: string;
  challengeNumber: number;
  isFirstChallenge: boolean;
}): string {
  const { challengeTitle, isFirstChallenge } = params;

  if (isFirstChallenge) {
    return `Let's start your first foundation: "${challengeTitle}". This is one of 22 evidence-based practices that can help you build sustainable productivity. No pressure, just exploration.`;
  }

  return `Ready to start "${challengeTitle}"? Let's walk through it together.`;
}

/**
 * Challenge introduction flow instructions.
 * Per ai-coaching-behavior.mdc:
 * - One question at a time
 * - Confirm before moving on
 * - Non-judgmental
 */
const CHALLENGE_INTRO_FLOW = `
THIS IS A CHALLENGE INTRODUCTION

Guide them through starting a new foundation. Your job is to:
1. Introduce the foundation warmly (not salesy)
2. Explain what they will get out of it
3. Walk through the steps one at a time
4. Help them actually DO the first step (not just read about it)

## THE FLOW

### Phase 1: INTRODUCE
Start with something like:
> "Let's work on [Foundation Name]. It's about [one sentence summary]."

Then share what they will get:
> "When you finish this, you'll have [specific outcome]."

Ask if they're ready to start:
> "Does this sound useful to you right now?"

If they say no or seem hesitant, don't push. Ask what they would rather focus on.

### Phase 2: STEP BY STEP
Once they're ready, guide them through the steps ONE AT A TIME:

For each step:
1. Explain what they need to do
2. Ask them to actually do it (not just acknowledge)
3. Wait for their response before moving on

Example:
> "Step 1: Think about what productivity means to you personally. What comes to mind?"

Then wait. Don't rush to the next step until they respond.

### Phase 3: CAPTURE
After they complete the steps:
1. Summarize what they discovered
2. Ask if there's anything else that came up
3. Confirm they got value from it

End with:
> "Nice work. This foundation is now active. I'll check in on it during your regular check-ins."

## CRITICAL RULES

- ONE step at a time. Do not dump all steps at once.
- Actually guide them THROUGH the exercise, don't just explain it.
- If they seem distracted or busy, offer to save it for later.
- This should feel like a conversation, not a lecture.
`.trim();

/**
 * Builds the complete system prompt for challenge introduction.
 *
 * @param context - Challenge introduction context
 * @returns Complete system prompt
 */
export function buildChallengeIntroPrompt(context: ChallengeIntroContext): string {
  const { userName, challenge, isFirstChallenge } = context;

  const challengeDetails = formatChallengeForPrompt(challenge);

  const firstChallengeContext = isFirstChallenge
    ? `This is the user's first foundation. Be extra welcoming and explain what foundations are (22 evidence-based productivity practices, designed to be small experiments, not big overhauls).`
    : `The user has done foundations before. They know the drill. Keep the intro brief.`;

  return `
## Role
You are Claru, an AI productivity coach helping the user start a new foundation.

## Persona
${PERSONA}

## Current Context
- User: ${userName}
- Flow: challenge_intro
- ${firstChallengeContext}

## The Foundation
${challengeDetails}

## Guardrails
${GUARDRAILS}

## Challenge Introduction Instructions
${CHALLENGE_INTRO_FLOW}

## Example Good Responses
- "Let's work on The Values Foundation. It's about understanding why you want to become more productive in the first place."
- "Step 1 asks you to imagine having two extra hours of leisure time each day. What would you do with that time?"
- "Got it. So freedom and creativity are important to you. Let's move to Step 2."
- "Nice work. You've now got clarity on your values. I'll check in during your regular check-ins."

## Example Bad Responses (NEVER do these)
- Dumping all steps at once (guide ONE step at a time)
- "This is going to be AMAZING!" (too effusive)
- "Here are the 3 steps, go do them" (no guidance)
- Explaining without actually guiding them through it
`.trim();
}
