export interface ChallengeNudgeContext {
  currentChallengeNumber?: number;
  currentChallengeTitle?: string;
  challengeStatus?: 'not_started' | 'in_progress' | 'completed' | 'ready_for_next';
  daysSinceLastUpdate?: number;
  totalChallengesCompleted?: number;
}

/**
 * Get morning challenge nudge based on user's challenge state
 */
export function getMorningChallengeNudge(context: ChallengeNudgeContext): string {
  const {
    currentChallengeNumber = 1,
    currentChallengeTitle = 'The Values Foundation',
    challengeStatus = 'not_started',
    daysSinceLastUpdate = 0,
    totalChallengesCompleted = 0
  } = context;

  // First time user - no challenges started yet
  if (challengeStatus === 'not_started' && totalChallengesCompleted === 0) {
    return `

---

## FOUNDATION NUDGE (First Time)

**Connect this to something they mentioned.** Don't pitch - coach.

If they mentioned avoiding something, procrastinating, or struggling with focus:
> "You mentioned [specific thing they said]. There's actually a foundation from Chris Bailey's research that addresses exactly that. Want to hear about it?"

If nothing specific came up, but they seem engaged:
> "Now that you've got your day mapped out - I'd like to start introducing you to something that can help build lasting habits. Chris Bailey's 22 productivity foundations. They're small experiments, not big overhauls. Interested in hearing about the first one?"

**Key:** This should feel like a natural extension of the conversation, not a sales pitch. If the moment doesn't feel right, skip it.`;
  }

  // Ready for next challenge
  if (challengeStatus === 'ready_for_next') {
    return `

---

## FOUNDATION NUDGE (Ready for Next)

Acknowledge their progress, then invite:
> "You finished the last foundation. Nice work. Ready for the next one?"

If yes:
> "This one's called '${currentChallengeTitle}' (Foundation ${currentChallengeNumber})."

Keep it brief. They know the drill.`;
  }

  // In progress but stale (3+ days without update)
  if (challengeStatus === 'in_progress' && daysSinceLastUpdate > 3) {
    return `

---

## FOUNDATION NUDGE (Check-In Needed)

It's been ${daysSinceLastUpdate} days. Check in without guilt:
> "Hey, quick check - how's '${currentChallengeTitle}' going? Haven't heard about it in a few days."

If they forgot or dropped it:
> "No worries. Want to pick it back up, or is something else more pressing right now?"

Meet them where they are.`;
  }

  // In progress and active
  if (challengeStatus === 'in_progress') {
    return `

---

## FOUNDATION NUDGE (In Progress)

Brief check-in:
> "How's '${currentChallengeTitle}' going?"

If they're making progress, celebrate briefly and move on.
If they're stuck, offer to help work through it.
If they're ready to complete it, help them reflect on what they learned.`;
  }

  return '';
}

/**
 * Get evening challenge nudge based on user's challenge state
 */
export function getEveningChallengeNudge(context: ChallengeNudgeContext): string {
  const {
    currentChallengeTitle = 'The Values Foundation',
    challengeStatus = 'not_started',
    totalChallengesCompleted = 0
  } = context;

  // In progress - gentle check
  if (challengeStatus === 'in_progress') {
    return `

---

## FOUNDATION CHECK-IN (Evening - Optional)

If the moment feels right, briefly ask:
> "By the way, did you get a chance to work on '${currentChallengeTitle}' today?"

If yes: "Nice. How'd it go?"
If no: "No worries - tomorrow's another chance."

Keep it light. They're winding down. Don't add pressure.`;
  }

  // Ready for next
  if (challengeStatus === 'ready_for_next') {
    return `

---

## FOUNDATION MENTION (Evening)

If they had a good day, you can mention:
> "You're ready for the next foundation when you're up for it. We can start it tomorrow if you'd like."

Plant the seed, but don't push. Evening is for closure.`;
  }

  // First time - soft teaser
  if (challengeStatus === 'not_started' && totalChallengesCompleted === 0) {
    return `

---

## FOUNDATION TEASER (Evening - First Time)

If they seem engaged and positive:
> "Tomorrow, I'd like to introduce you to something that could help - a series of productivity foundations backed by research. Think of them as small experiments. Interested?"

Soft teaser for morning. No details needed tonight.`;
  }

  return '';
}
