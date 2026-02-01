# Claru - Event Storming

> **Repo Path:** `claru/docs/event-storming.md`
> **Related Docs:** 
> - `claru/docs/prd.md` — Product Requirements Document
> - `claru/docs/context-map.md` — Bounded Contexts (Phase 2B output)
> - `claru/docs/technical-architecture.md` — Tech Stack & Data Model (Phase 3 output)

**Product:** Claru
**Phase:** Domain Architecture - Event Storming
**Status:** Complete (MVP Scope)
**Last Updated:** January 2026

---

## Overview

This document maps everything that HAPPENS in Claru—events, commands, actors, and policies. Based on competitive research of 20+ AI coaching apps and the core insight that **the conversation IS the product**.

**Core Design Principles:**
- Onboarding should be indistinguishable from using the product
- Voice-first input (text available for those who can't speak)
- No button-pressing flows — open-ended prompts that pull users in
- Value delivery through actual coaching, not demo
- **The same core process applies Day 1 through Day 200** — AI just has more context over time

---

## The Core Process (The Process That Works)

This is the value loop that drives Claru. It should be followed every session, whether it's Day 1 onboarding or Day 200 check-in.

| Step | What Happens | Why It Matters |
|------|--------------|----------------|
| **1. Dump** | "What's on your mind?" — get everything out, unfiltered | User often doesn't realize what's weighing on them until they say it |
| **2. Weight Clarification** | "What's weighing on you the most?" | Surfaces emotional load, not just tasks. Some stuff is just noise taking up mental RAM |
| **3. Work Type Sort** | Categorize into Deep Focus / Admin / Meetings | Not all tasks are equal. "Send a text" ≠ "Write the investor deck" |
| **4. Impact Identification** | "Which deep work drives the most impact?" | What you WANT to work on ≠ what drives IMPACT. AI challenges assumptions |
| **5. Organize** | Today vs Parking Lot | Clear separation so parking lot stuff stops taking mental RAM |
| **6. Time Reality Check** | "When can you actually do this?" | The confrontation with reality. "You want to do X, Y, Z but you have 90 minutes of focus time" |
| **7. Match Work to Time** | Deep work → focus blocks, Admin → gaps, Meetings → prep time | Right work at right time |
| **8. Lock It In** | "Your #1 is X. Go." | Clear, committed, done |

---

## Work Type Classification

The AI must understand work types, not just "tasks":

| Type | Characteristics | Time Needed | When to Do |
|------|-----------------|-------------|------------|
| **Deep Focus Work** | Requires uninterrupted concentration, creative/analytical, moves the needle | 45+ min blocks, no distractions | During BPT, protected time |
| **Admin/Quick Tasks** | Takes 2-5 min each, low cognitive load, feels productive but isn't high-impact | Batch into 15-30 min "maintenance" blocks | Gaps between meetings, low energy times |
| **High-Stakes Meetings** | Decisions get made, relationships built, deals closed | The meeting itself + PREP TIME | Scheduled, but AI should flag prep needs |

**Critical Insight:** The deep focus work is often PREP for the meeting. Client call at 3pm → the impact is being PREPARED, not just showing up.

**Red Flag Detection:** If someone's "Top 3" is all admin tasks (send text, reply to email, schedule appointment), the AI should catch this:
> "Hold on — those are all quick admin tasks. You could knock all three out in 10 minutes. What's the actual deep work that would move the needle today?"

---

## User Flows Event-Stormed

1. First-Time User Onboarding (Day 1) — Conversational, follows Core Process
2. Daily Check-In (Day 2+) — Same Core Process with more context
3. Evening Check-In
4. Brain Dump Capture (Standalone)
5. Challenge Progression
6. Parking Lot Management
7. Insight Delivery
8. Skipped Day Recovery

---

## Event Storm 1: First-Time User Onboarding (Day 1)

### Source
PRD User Flow + Core Process + Research

### Critical Design Decisions
- Voice is default, text option for those who can't speak
- Account creation at session wrap-up, after value delivered
- **Follows the same Core Process** — user experiences real coaching, not a demo
- The "holy fuck" moment (time reality check) should happen in onboarding

---

### Timeline

**Phase 1: Minimal Friction Entry (10 seconds)**

**1. User**
- **Command:** LaunchApp
- **Event:** AppLaunched [DETERMINISTIC]

**2. System**
- **Command:** ShowValuePropWithChat
- **Event:** ChatInterfaceDisplayed [DETERMINISTIC]
- **Visual:** "Turn chaos into clarity in 5 minutes a day"
- **Below:** Chat interface with voice button prominent, text input available
- **Note:** Voice is default. Text option shown as "Can't talk? Type instead"

**Phase 2: The Core Process — First Experience**

**Step 1: Dump**

**3. AI System**
- **Command:** GenerateOpeningPrompt
- **Event:** OpeningPromptGenerated [AI-POWERED]
- **Delivery:** Voice (AI speaks) + text displayed
- **Examples:**
  - "You came here for a reason. What's on your mind right now? Everything — work, personal, whatever's floating around. Just dump it out."
  - "Hey. What's weighing on you today? Don't filter, just tell me."

**4. User**
- **Command:** ShareInitialDump
- **Event:** InitialDumpReceived [DETERMINISTIC]
- **Data:** {rawText OR voiceTranscript, inputMethod: "voice" | "text"}
- **Policy:** When InitialDumpReceived → ProcessDump

**5. AI System**
- **Command:** ProcessDump
- **Event:** DumpProcessed [AI-POWERED]
- **Note:** Transcribe if voice, clean up, extract items
- **Possible Outcomes:**
  - Rich input → DumpProcessed
  - Minimal input → GentleFollowUpGenerated
  - Resistance detected → MotivationalStoryOffered

**Step 2: Weight Clarification**

**6. AI System**
- **Command:** PromptWeightClarification
- **Event:** WeightClarificationPrompted [AI-POWERED]
- **Example:**
  > "Got it. That's a lot. Of everything you just said — what's weighing on you the most right now? Not what's most urgent, what's actually taking up mental space."

**7. User**
- **Command:** ShareWeight
- **Event:** WeightShared [DETERMINISTIC]
- **Data:** {weightDescription}

**8. AI System**
- **Command:** AcknowledgeWeight
- **Event:** WeightAcknowledged [AI-POWERED]
- **Example:**
  > "The investor deck. Yeah, that makes sense — it's been hanging over you. Let's deal with that."

**Step 3: Work Type Sort**

**9. AI System**
- **Command:** ClassifyWorkTypes
- **Event:** WorkTypesClassified [AI-POWERED]
- **Data:** {deepFocusWork[], adminTasks[], meetings[], noise[]}
- **Example:**
  > "Let me sort what you shared:
  > 
  > **Deep focus work:** The investor deck, the proposal draft — these need real concentration.
  > **Quick admin:** The emails to Sarah, scheduling the dentist — this is 15 minutes of quick hits.
  > **Meetings:** You mentioned a client call later?
  > **Just noise:** That thing about whether you should have said something different in yesterday's meeting — let that go."

**10. AI System**
- **Command:** IdentifyAdminBatch
- **Event:** AdminBatchIdentified [AI-POWERED]
- **Data:** {adminTasks[], estimatedTime}
- **Note:** Group quick tasks for batching

**11. AI System**
- **Command:** CheckMeetingPrepNeeds
- **Event:** MeetingPrepChecked [AI-POWERED]
- **Example:**
  > "That client call — do you need prep time for it, or are you ready?"

**12. User**
- **Command:** RespondToMeetingPrepCheck
- **Event:** MeetingPrepResponseReceived [DETERMINISTIC]
- **Data:** {needsPrep: boolean, prepDescription?}

**Step 4: Impact Identification**

**13. AI System**
- **Command:** PromptImpactIdentification
- **Event:** ImpactIdentificationPrompted [AI-POWERED]
- **Example:**
  > "Of the deep focus work — the investor deck and the proposal — which one actually moves the needle the most right now? Not which one you want to do, which one drives the most impact."

**14. User**
- **Command:** IdentifyHighImpactWork
- **Event:** HighImpactWorkIdentified [DETERMINISTIC]
- **Data:** {highImpactItem, reasoning?}

**15. AI System**
- **Command:** ValidateOrChallengeImpact
- **Event:** ImpactValidated OR ImpactChallenged [AI-POWERED]
- **Note:** AI may push back if user's choice seems off
- **Challenge Example:**
  > "You said the emails, but those are admin — you could knock them out in 10 minutes. The investor deck is what actually moves things forward. Is there a reason you're avoiding it?"
- **Validation Example:**
  > "The investor deck. Yeah, that's the one. Everything else can wait."

**Step 5: Organize — Today vs Parking Lot**

**16. AI System**
- **Command:** OrganizeIntoBuckets
- **Event:** BucketsOrganized [AI-POWERED]
- **Data:** {today[], parkingLot[], noise[]}
- **Example:**
  > "Here's how I'd organize it:
  > 
  > **Today:** Investor deck (the deep work), admin batch (emails, scheduling)
  > **Parking lot:** The proposal can wait until the deck is done. The blog post idea — that's a someday thing.
  > **Let go:** Yesterday's meeting thing. Done. Move on."

**Step 6 & 7: Time Reality Check + Match Work to Time**

**17. AI System**
- **Command:** PromptTimeReality
- **Event:** TimeRealityPrompted [AI-POWERED]
- **Example:**
  > "Now let's get real. What does your day actually look like? Any meetings? Appointments? When do you have actual focus time?"

**18. User**
- **Command:** ShareDayStructure
- **Event:** DayStructureShared [DETERMINISTIC]
- **Data:** {meetings[], appointments[], constraints[]}

**19. AI System**
- **Command:** IdentifyFocusBlocks
- **Event:** FocusBlocksIdentified [AI-POWERED]
- **Data:** {focusBlocks[], totalFocusTime, gaps[]}
- **Example:**
  > "Okay, so you've got meetings until 11, then a gap until the client call at 3pm. That's about 3.5 hours. But you need 30 minutes for lunch and probably 30 minutes to prep for the client call. So realistically — 2.5 hours of focus time."

**20. AI System**
- **Command:** MatchWorkToTime
- **Event:** WorkToTimeMatched [AI-POWERED]
- **Data:** {schedule: {time, workType, task}[]}
- **Example:**
  > "Here's the plan:
  > 
  > **11:00 - 1:00:** Investor deck (your deep work, your #1)
  > **1:00 - 1:30:** Lunch
  > **1:30 - 2:00:** Admin batch — knock out the emails, scheduling
  > **2:30 - 3:00:** Prep for client call
  > **3:00:** Client call
  > 
  > The proposal? Parking lot. Not today."

**21. User**
- **Command:** RespondToTimeMatch
- **Event:** TimeMatchResponseReceived [DETERMINISTIC]
- **Note:** User confirms, adjusts, or pushes back

**Step 8: Lock It In**

**22. AI System**
- **Command:** LockInPlan
- **Event:** PlanLockedIn [AI-POWERED]
- **Example:**
  > "Locked in. Your #1 is the investor deck. 11am. Two hours of focus. Go crush it."

**23. System**
- **Command:** MarkQuickWinAchieved
- **Event:** QuickWinAchieved [DETERMINISTIC]
- **Note:** User has experienced the full value: dump → clarity → plan → reality check

**Phase 3: Session Wrap-Up & Account Creation**

**24. User**
- **Command:** SignalSessionEnd
- **Event:** SessionEndSignaled [DETERMINISTIC]
- **Triggers:** User says "thanks" / "gotta go" / tries to close app / natural conversation end

**25. AI System**
- **Command:** OfferToSaveSession
- **Event:** SaveSessionOffered [AI-POWERED]
- **Example:**
  > "Before you go — I've captured everything. Your #1 is the investor deck at 11am. Want to save this so I can check in with you tomorrow? Takes 10 seconds."

**26a. User (If Accepts)**
- **Command:** CreateAccount
- **Event:** AccountCreated [DETERMINISTIC]
- **Data:** {email, authMethod}

**26b. User (If Declines)**
- **Command:** DeclineAccountCreation
- **Event:** AccountCreationDeclined [DETERMINISTIC]

**27. AI System (If Declined)**
- **Command:** AcknowledgeDecline
- **Event:** DeclineAcknowledged [AI-POWERED]
- **Example:**
  > "No problem. Just know this session won't save — if you come back, we're starting fresh. But you're welcome anytime. Go crush that deck."

**Phase 4: Set Up Continuity (If Account Created)**

**28. AI System**
- **Command:** AskCheckInTime
- **Event:** CheckInTimeAsked [AI-POWERED]
- **Example:**
  > "One more thing — when do you usually start your day? I'll check in then to help you get clear."

**29. User**
- **Command:** SetCheckInPreference
- **Event:** CheckInPreferenceSet [DETERMINISTIC]
- **Data:** {morningTime, timezone}

**30. AI System**
- **Command:** ConfirmAndClose
- **Event:** Day1SessionClosed [AI-POWERED]
- **Example:**
  > "Perfect. I'll ping you at 8am. Now go — investor deck, 11am. You've got this."

**31. System**
- **Command:** CompleteDay1Onboarding
- **Event:** Day1OnboardingCompleted [DETERMINISTIC]

---

### [AI-POWERED] Fallback Paths

**Fallback 1: Minimal Initial Dump**
- **Trigger:** User gives very short response ("idk", "nothing much", "just checking it out")
- **Events:** MinimalDumpReceived → GentleFollowUpGenerated
- **Recovery:**
  > "Totally fine. What's one thing — even small — that's been on your mind this week?"

**Fallback 2: All Admin Tasks (No Deep Work)**
- **Trigger:** User's dump is all quick tasks, no meaningful deep work
- **Events:** NoDeepWorkDetected → DeepWorkPromptGenerated
- **Recovery:**
  > "Those are all quick wins — you could knock them out in 20 minutes. But what's the bigger thing you've been putting off? The thing that actually matters but feels hard to start?"

**Fallback 3: User Goes Deep on Emotions**
- **Trigger:** Input is heavy on feelings, light on tasks
- **Events:** EmotionalInputDetected → EmotionalAcknowledgmentGenerated
- **Recovery:** Acknowledge feelings first, then gently guide:
  > "That sounds really heavy. I hear you. What's one thing — even tiny — that would help with that today?"

**Fallback 4: User Is Resistant / Skeptical**
- **Trigger:** User pushes back ("this won't work", "I've tried everything")
- **Events:** ResistanceDetected → MotivationalStoryOffered [AI-POWERED]
- **Recovery:**

> "I get it. Most people don't actually change their lives. They read a book, try something for a week, then drift back to the same routines.
>
> But I watched a close friend do the opposite.
>
> Not long ago, his spare time looked like most of ours — games, TV, scrolling. Totally normal. Then something clicked. He decided to be more intentional with his time.
>
> It started with a book — The Productivity Project. Ten weeks later:
> - Lost 15 pounds
> - Built multiple real projects using AI tools
> - Finished several books
> - Created a tool that won his company's AI Innovation Award
>
> The wildest part? He now wakes up between 4-5am without an alarm. Has a consistent morning routine. His weeks are structured. His mental energy is protected.
>
> This wasn't about grinding harder. It was about designing his life on purpose.
>
> Change doesn't require a dramatic life event. Sometimes it just starts with a decision — and actually following through.
>
> So... what's one thing you'd change if you could actually follow through?"

**Fallback 5: No Focus Time Available**
- **Trigger:** User's day is completely packed with meetings/appointments
- **Events:** NoFocusTimeDetected → RealityAcknowledged
- **Recovery:**
  > "Okay, real talk — you have zero focus time today. That's the reality. Your only win today is surviving the meetings. But let's look at tomorrow. When's your first open block?"

---

### [AI-POWERED] Guardrail Triggers

**Guardrail 1: Distress Signals**
- **Trigger:** User mentions crisis, severe overwhelm, mental health concerns
- **Events:** DistressSignalDetected → SupportResponseGenerated
- **Example:**
  > "That sounds really tough. I want to make sure you're okay. If you're going through something serious, talking to a professional could really help. I'm here for productivity stuff, but your wellbeing comes first. Want to continue, or would it help to take a break?"

---

### Events Summary

**[DETERMINISTIC] Events:**
- AppLaunched
- ChatInterfaceDisplayed
- InitialDumpReceived
- WeightShared
- MeetingPrepResponseReceived
- HighImpactWorkIdentified
- DayStructureShared
- TimeMatchResponseReceived
- QuickWinAchieved
- SessionEndSignaled
- AccountCreated / AccountCreationDeclined
- CheckInPreferenceSet
- Day1OnboardingCompleted

**[AI-POWERED] Events:**
- OpeningPromptGenerated
- DumpProcessed
- WeightClarificationPrompted
- WeightAcknowledged
- WorkTypesClassified
- AdminBatchIdentified
- MeetingPrepChecked
- ImpactIdentificationPrompted
- ImpactValidated / ImpactChallenged
- BucketsOrganized
- TimeRealityPrompted
- FocusBlocksIdentified
- WorkToTimeMatched
- PlanLockedIn
- SaveSessionOffered
- DeclineAcknowledged
- CheckInTimeAsked
- Day1SessionClosed
- (Fallback) GentleFollowUpGenerated, DeepWorkPromptGenerated, EmotionalAcknowledgmentGenerated, MotivationalStoryOffered, RealityAcknowledged
- (Guardrail) SupportResponseGenerated

---

## Event Storm 2: Daily Check-In (Day 2+)

### Source
Core Process — Same flow as Day 1, with accumulated context

### Critical Design Decision
**The process is the same every day.** What changes is the AI has more context:
- Day 2: AI knows yesterday's #1 and can reference it
- Day 7: AI knows your patterns, can suggest BPT
- Day 30: AI knows your high-impact work, challenges your choices more effectively

---

### Timeline

**Phase 1: Quick Context (30 seconds)**

**1. System (Timer)**
- **Command:** TriggerMorningNotification
- **Event:** MorningNotificationSent [DETERMINISTIC]

**2. User**
- **Command:** OpenApp
- **Event:** AppOpened [DETERMINISTIC]

**3. System**
- **Command:** LoadDailyContext
- **Event:** DailyContextLoaded [DETERMINISTIC]
- **Data:** {yesterdayTop1, yesterdayCompletion, carryover[], userProfile, patterns[], focusBlocksHistory}

**4. AI System**
- **Command:** GenerateContextualOpening
- **Event:** ContextualOpeningGenerated [AI-POWERED]
- **Note:** Brief reference to yesterday, then forward motion
- **Examples:**
  - Completed: "Morning. You crushed the investor deck yesterday. What's today look like?"
  - Didn't complete: "Morning. The investor deck carried over. What happened, and what's today look like?"
  - Pattern detected: "Morning. I've noticed you're most focused before 11am. Something to keep in mind today."

**Phase 2: The Core Process**

**Step 1: Dump**

**5. AI System**
- **Command:** PromptDump
- **Event:** DumpPrompted [AI-POWERED]
- **Example:**
  > "What's on your mind today? Everything — dump it out."

**6. User**
- **Command:** ShareDump
- **Event:** DumpReceived [DETERMINISTIC]
- **Data:** {rawText OR voiceTranscript}

**7. AI System**
- **Command:** ProcessDump
- **Event:** DumpProcessed [AI-POWERED]

**Step 2: Weight Clarification**

**8. AI System**
- **Command:** PromptWeight
- **Event:** WeightPrompted [AI-POWERED]
- **Example:**
  > "What's weighing on you the most right now?"

**9. User**
- **Command:** ShareWeight
- **Event:** WeightShared [DETERMINISTIC]

**10. AI System**
- **Command:** AcknowledgeWeight
- **Event:** WeightAcknowledged [AI-POWERED]

**Step 3: Work Type Sort**

**11. AI System**
- **Command:** ClassifyWorkTypes
- **Event:** WorkTypesClassified [AI-POWERED]
- **Data:** {deepFocusWork[], adminTasks[], meetings[], prepNeeded[], noise[]}

**12. AI System**
- **Command:** IdentifyAdminBatch
- **Event:** AdminBatchIdentified [AI-POWERED]
- **Data:** {adminTasks[], estimatedTime}

**13. AI System**
- **Command:** CheckMeetingPrepNeeds
- **Event:** MeetingPrepNeedsIdentified [AI-POWERED]
- **Data:** {meetingsNeedingPrep[], prepTimeEstimates[]}
- **Example:**
  > "You've got that board presentation at 2pm. When did you last look at the deck? Do you need prep time?"

**14. User**
- **Command:** RespondToPrepCheck
- **Event:** PrepCheckResponseReceived [DETERMINISTIC]

**Step 4: Impact Identification**

**15. AI System**
- **Command:** PromptImpactIdentification
- **Event:** ImpactPrompted [AI-POWERED]
- **Example:**
  > "Of the deep work — which one actually moves the needle the most today?"

**16. User**
- **Command:** IdentifyHighImpact
- **Event:** HighImpactIdentified [DETERMINISTIC]

**17. AI System**
- **Command:** ValidateOrChallengeImpact
- **Event:** ImpactValidatedOrChallenged [AI-POWERED]
- **Note:** AI uses accumulated context to challenge more effectively
- **Example (Day 14+):**
  > "You've said 'clear inbox' is your priority 4 times this week, but you told me last Monday that shipping the feature is what actually matters for the quarter. What's really driving impact here?"

**Step 5: Organize — Today vs Parking Lot**

**18. AI System**
- **Command:** OrganizeIntoBuckets
- **Event:** BucketsOrganized [AI-POWERED]
- **Example:**
  > "Here's how I'd organize it:
  > 
  > **Today:** 
  > - Feature spec (deep work)
  > - Board deck prep (deep work, for the 2pm meeting)
  > - Admin batch: 3 emails, expense report
  > 
  > **Parking lot:** The hiring plan — important but not today
  > 
  > **Let go:** The Slack drama. Not your problem."

**Step 6 & 7: Time Reality Check + Match Work to Time**

**19. AI System**
- **Command:** PromptTimeReality
- **Event:** TimeRealityPrompted [AI-POWERED]
- **Note:** If calendar connected, AI may already know
- **Example:**
  > "What does your day look like? Walk me through your meetings and any hard commitments."

**20. User**
- **Command:** ShareDayStructure
- **Event:** DayStructureShared [DETERMINISTIC]
- **Data:** {meetings[], appointments[], constraints[]}

**21. AI System**
- **Command:** IdentifyFocusBlocks
- **Event:** FocusBlocksIdentified [AI-POWERED]
- **Data:** {focusBlocks[], totalFocusMinutes, adminGaps[]}
- **Example:**
  > "You've got back-to-back meetings 9-11am, then the board presentation at 2pm. That gives you:
  > - 11am - 1pm: 2 hours (deep work)
  > - 1pm - 1:30pm: 30 min (lunch or admin)
  > - 1:30pm - 2pm: 30 min (board prep)
  > 
  > Total focus time: about 2 hours."

**22. AI System**
- **Command:** MatchWorkToTime
- **Event:** WorkToTimeMatched [AI-POWERED]
- **Example:**
  > "Here's the plan:
  > 
  > **11:00 - 1:00:** Feature spec (your #1, needs the focus)
  > **1:00 - 1:30:** Admin batch — knock out emails, expense report
  > **1:30 - 2:00:** Board prep — review deck, anticipate questions
  > **2:00:** Board presentation
  > 
  > The hiring plan stays parked. Realistic?"

**23. User**
- **Command:** ConfirmOrAdjustPlan
- **Event:** PlanConfirmed [DETERMINISTIC]
- **Data:** {confirmed: boolean, adjustments[]}

**Step 8: Lock It In**

**24. AI System**
- **Command:** LockInPlan
- **Event:** PlanLockedIn [AI-POWERED]
- **Example:**
  > "Locked in. Your #1 is the feature spec. 11am. Two hours. Go."

**25. System**
- **Command:** SaveDailyNote
- **Event:** DailyNoteSaved [DETERMINISTIC]
- **Data:** {date, dump, weight, workTypes, today[], parkingLot[], focusBlocks[], plan}

**26. System**
- **Command:** CompleteCheckIn
- **Event:** MorningCheckInCompleted [DETERMINISTIC]
- **Policy:** When MorningCheckInCompleted → UpdateHabitStrength, ScheduleEveningCheckIn

---

### How Context Accumulates Over Time

| Day | What AI Knows | How It Uses It |
|-----|---------------|----------------|
| Day 2 | Yesterday's #1, whether completed | References it: "How'd the deck go?" |
| Day 3-6 | Multiple days of dumps, patterns emerging | Notices: "You mention email a lot. That might be avoidance." |
| Day 7 | Week of data, completion rates | Delivers first weekly insight |
| Day 14+ | BPT data (if tracking), recurring tasks, values | Challenges: "You said shipping matters, but you keep prioritizing admin." |
| Day 30+ | Strong patterns, success/failure correlations | Predicts: "Days you do deep work before 11am have 2x completion rate." |

---

### [AI-POWERED] Fallback Paths

**Fallback 1: User's Top 3 Is All Admin**
- **Trigger:** User identifies only quick tasks as priorities
- **Events:** AllAdminDetected → DeepWorkChallenge
- **Recovery:**
  > "Hold up — those are all 5-minute tasks. You could batch them after lunch. What's the actual hard thing you're avoiding?"

**Fallback 2: User Has Zero Focus Time**
- **Trigger:** Calendar is wall-to-wall meetings
- **Events:** NoFocusTimeDetected → SurvivalModeAcknowledged
- **Recovery:**
  > "Real talk — you have no focus time today. Your only job is surviving the meetings. But let's protect tomorrow. What time can you block for deep work?"

**Fallback 3: Chronic Carryover**
- **Trigger:** Same item has carried over 3+ days
- **Events:** ChronicCarryoverDetected → CarryoverIntervention
- **Recovery:**
  > "The proposal has carried over 4 days now. Something's blocking you. Is it actually important, or should we just park it?"

**Fallback 4: User Seems Overwhelmed**
- **Trigger:** Massive dump, scattered energy, stress signals
- **Events:** OverwhelmDetected → SimplificationOffered
- **Recovery:**
  > "That's a lot. Let's not try to solve everything. What's the ONE thing that would make today feel like a win? Just one."

---

### Events Summary

**[DETERMINISTIC] Events:**
- MorningNotificationSent
- AppOpened
- DailyContextLoaded
- DumpReceived
- WeightShared
- PrepCheckResponseReceived
- HighImpactIdentified
- DayStructureShared
- PlanConfirmed
- DailyNoteSaved
- MorningCheckInCompleted

**[AI-POWERED] Events:**
- ContextualOpeningGenerated
- DumpPrompted
- DumpProcessed
- WeightPrompted
- WeightAcknowledged
- WorkTypesClassified
- AdminBatchIdentified
- MeetingPrepNeedsIdentified
- ImpactPrompted
- ImpactValidatedOrChallenged
- BucketsOrganized
- TimeRealityPrompted
- FocusBlocksIdentified
- WorkToTimeMatched
- PlanLockedIn
- (Fallback) DeepWorkChallenge, SurvivalModeAcknowledged, CarryoverIntervention, SimplificationOffered

---

## Event Storm 3: Evening Check-In

### Source
PRD + Research: reflection + release focus, closure not planning

### Critical Design Decision
Evening is for **reflection and release**, not re-planning. Keep it short. Focus on wins, not failures.

---

### Timeline

**1. System (Timer)**
- **Command:** TriggerEveningNotification
- **Event:** EveningNotificationSent [DETERMINISTIC]

**2. User**
- **Command:** OpenApp
- **Event:** AppOpenedEvening [DETERMINISTIC]

**3. System**
- **Command:** LoadTodayContext
- **Event:** TodayContextLoaded [DETERMINISTIC]
- **Data:** {todayPlan, todayTop1}

**4. AI System**
- **Command:** GenerateEveningOpening
- **Event:** EveningOpeningGenerated [AI-POWERED]
- **Example:**
  > "End of day. How'd it go with the feature spec?"

**5. User**
- **Command:** ShareDayReview
- **Event:** DayReviewShared [DETERMINISTIC]

**6. AI System**
- **Command:** AcknowledgeAndSummarize
- **Event:** DaySummaryGenerated [AI-POWERED]
- **Example:**
  > "Nice — you got the feature spec done. That was the priority. Board prep ran long but you handled it. The admin batch got pushed — that's fine, it's admin."

**7. AI System**
- **Command:** PromptWins
- **Event:** WinsPrompted [AI-POWERED]
- **Example:**
  > "What went well today?"

**8. User**
- **Command:** ShareWins
- **Event:** WinsShared [DETERMINISTIC]

**9. AI System**
- **Command:** PromptLearning
- **Event:** LearningPrompted [AI-POWERED]
- **Example:**
  > "What would have made today even better?"

**10. User**
- **Command:** ShareLearning
- **Event:** LearningShared [DETERMINISTIC]

**11. AI System**
- **Command:** PromptRelease
- **Event:** ReleasePrompted [AI-POWERED]
- **Example:**
  > "Anything you need to let go of before tomorrow?"

**12. User**
- **Command:** ShareRelease
- **Event:** ReleaseShared [DETERMINISTIC]

**13. AI System**
- **Command:** OfferTomorrowPreview
- **Event:** TomorrowPreviewOffered [AI-POWERED]
- **Note:** Quick, optional — not a full planning session
- **Example:**
  > "Admin batch is carrying over. Want to make it your first task tomorrow, or save it for an afternoon gap?"

**14. User**
- **Command:** RespondToTomorrowPreview
- **Event:** TomorrowPreviewHandled [DETERMINISTIC]

**15. System**
- **Command:** UpdateDailyNote
- **Event:** DailyNoteUpdated [DETERMINISTIC]

**16. AI System**
- **Command:** GenerateEveningClose
- **Event:** EveningCloseGenerated [AI-POWERED]
- **Example:**
  > "Good day. Rest up. See you tomorrow morning."

**17. System**
- **Command:** CompleteEveningCheckIn
- **Event:** EveningCheckInCompleted [DETERMINISTIC]

---

### Events Summary

**[DETERMINISTIC] Events:**
- EveningNotificationSent
- AppOpenedEvening
- TodayContextLoaded
- DayReviewShared
- WinsShared
- LearningShared
- ReleaseShared
- TomorrowPreviewHandled
- DailyNoteUpdated
- EveningCheckInCompleted

**[AI-POWERED] Events:**
- EveningOpeningGenerated
- DaySummaryGenerated
- WinsPrompted
- LearningPrompted
- ReleasePrompted
- TomorrowPreviewOffered
- EveningCloseGenerated

---

## Event Storm 4: Brain Dump Capture (Standalone)

### Source
Research: Single-tap capture, zero friction, voice-first

### When This Happens
User captures a thought outside of check-in — random moment during the day, idea in the shower, something they need to remember.

---

### Timeline

**1. User**
- **Command:** InitiateBrainDump
- **Event:** BrainDumpInitiated [DETERMINISTIC]
- **Trigger:** Quick-add button, widget, "Hey Claru...", shake gesture

**2. System**
- **Command:** ShowCaptureInterface
- **Event:** CaptureInterfaceDisplayed [DETERMINISTIC]
- **Note:** Voice recording active immediately, text available

**3. User**
- **Command:** ProvideInput
- **Event:** InputReceived [DETERMINISTIC]

**4. System**
- **Command:** AcknowledgeCapture
- **Event:** CaptureAcknowledged [DETERMINISTIC]
- **Note:** Immediate "Got it!" — user can leave

**5. AI System (Background)**
- **Command:** ProcessCapture
- **Event:** CaptureProcessed [AI-POWERED]
- **Note:** Transcribe, clean, categorize, extract actions

**6. System**
- **Command:** SaveToInbox
- **Event:** SavedToInbox [DETERMINISTIC]

**7. System (Next Check-In)**
- **Command:** SurfaceInboxItems
- **Event:** InboxItemsSurfaced [DETERMINISTIC]
- **Note:** AI incorporates into next morning dump: "You captured some thoughts yesterday — let me add those in..."

---

### Events Summary

**[DETERMINISTIC] Events:**
- BrainDumpInitiated
- CaptureInterfaceDisplayed
- InputReceived
- CaptureAcknowledged
- SavedToInbox
- InboxItemsSurfaced

**[AI-POWERED] Events:**
- CaptureProcessed

---

## Event Storm 5: Challenge Progression

### Source
PRD Challenges + Core insight: Challenges emerge naturally through coaching

### Critical Design Decision
**Challenges are not separate exercises.** They surface through conversation when relevant. User doesn't know they're "doing a challenge."

---

### How Challenges Surface

| Challenge | Natural Trigger | How It Appears |
|-----------|-----------------|----------------|
| **Values** | Day 1 onboarding | Inferred from initial dump — what matters to them |
| **Impact** | Any time user lists tasks | "Of these, which actually moves the needle?" |
| **Rule of 3** | Every morning | "What's your Top 1 for today?" (we don't even need to call it Top 3) |
| **Capture** | When user mentions feeling scattered | "Want to do a full brain dump? Get everything out." |
| **Prime-Time** | When user mentions energy, or after 2 weeks | "Want to track your energy? I can help you find your peak hours." |

---

### Timeline (BPT Challenge Example)

**1. AI System**
- **Command:** DetectChallengeTrigger
- **Event:** ChallengeTriggerDetected [AI-POWERED]
- **Trigger:** User says "I just don't have energy in the afternoons" or similar

**2. AI System**
- **Command:** OfferChallengeNaturally
- **Event:** ChallengeOfferedNaturally [AI-POWERED]
- **Example:**
  > "You mentioned energy levels. Want to track that for a week or two? I'll check in a few times a day, and then I can show you when your peak focus hours actually are. Might help with scheduling the deep work."

**3. User**
- **Command:** AcceptOrDecline
- **Event:** ChallengeResponseReceived [DETERMINISTIC]

**4. System (If Accepted)**
- **Command:** ActivateChallenge
- **Event:** ChallengeActivated [DETERMINISTIC]

**5. System (Over Time)**
- **Command:** CollectChallengeData
- **Event:** ChallengeDataCollected [DETERMINISTIC]

**6. AI System (After Sufficient Data)**
- **Command:** AnalyzeChallengeResults
- **Event:** ChallengeResultsAnalyzed [AI-POWERED]

**7. AI System**
- **Command:** DeliverChallengeInsight
- **Event:** ChallengeInsightDelivered [AI-POWERED]
- **Example:**
  > "Got your energy data. Your Biological Prime Time is 9:30am - 11:30am — that's when you're sharpest. Afternoons around 2-3pm are your low point. Let's schedule deep work in the mornings from now on."

**8. System**
- **Command:** IntegrateIntoProfile
- **Event:** ChallengeIntegratedIntoProfile [DETERMINISTIC]

**9. AI System (Ongoing)**
- **Command:** ReferenceChallengeLearning
- **Event:** ChallengeLearningReferenced [AI-POWERED]
- **Example:** "You're in your prime time right now — good window for the feature spec."

---

### Events Summary

**[DETERMINISTIC] Events:**
- ChallengeResponseReceived
- ChallengeActivated
- ChallengeDataCollected
- ChallengeIntegratedIntoProfile

**[AI-POWERED] Events:**
- ChallengeTriggerDetected
- ChallengeOfferedNaturally
- ChallengeResultsAnalyzed
- ChallengeInsightDelivered
- ChallengeLearningReferenced

---

## Event Storm 6: Parking Lot Management

### Source
Research + Core Process: Clear separation between today and someday

---

### Timeline

**Phase 1: Parking an Item**

**1. AI System**
- **Command:** SuggestParking
- **Event:** ParkingSuggested [AI-POWERED]
- **Triggers:** Overflow, item keeps carrying over, user says "someday"
- **Example:**
  > "The blog post keeps getting pushed. Want to park it? I'll bring it back when you have bandwidth."

**2. User**
- **Command:** ConfirmParking
- **Event:** ParkingConfirmed [DETERMINISTIC]

**3. System**
- **Command:** SaveToParkingLot
- **Event:** SavedToParkingLot [DETERMINISTIC]

**Phase 2: Weekly Review**

**4. System (Timer)**
- **Command:** TriggerWeeklyReview
- **Event:** WeeklyReviewTriggered [DETERMINISTIC]
- **Policy:** Sunday evening, if parked items exist

**5. AI System**
- **Command:** SummarizeParkedItems
- **Event:** ParkedItemsSummarized [AI-POWERED]
- **Example:**
  > "Quick parking lot check:
  > - Blog post (2 weeks)
  > - SQL course (1 month)
  > - Call mom about trip (3 days)
  > 
  > Any of these ready to come back?"

**6. User**
- **Command:** ReviewParkedItems
- **Event:** ParkedItemsReviewed [DETERMINISTIC]

**Phase 3: AI-Triggered Resurfacing**

**7. AI System**
- **Command:** DetectRelevantParkedItem
- **Event:** RelevantParkedItemDetected [AI-POWERED]
- **Trigger:** Context match in conversation

**8. AI System**
- **Command:** SuggestReactivation
- **Event:** ReactivationSuggested [AI-POWERED]
- **Example:**
  > "You mentioned wanting to learn new skills. You've had 'SQL course' parked for a month. Want to bring it back?"

---

### Events Summary

**[DETERMINISTIC] Events:**
- ParkingConfirmed
- SavedToParkingLot
- WeeklyReviewTriggered
- ParkedItemsReviewed

**[AI-POWERED] Events:**
- ParkingSuggested
- ParkedItemsSummarized
- RelevantParkedItemDetected
- ReactivationSuggested

---

## Event Storm 7: Insight Delivery

### Source
Research: Wait for sufficient data, then deliver meaningful insights

---

### Timeline

**Daily Insights (Light Touch)**

**1. AI System**
- **Command:** GenerateDailyInsight
- **Event:** DailyInsightGenerated [AI-POWERED]
- **Note:** Only if meaningful; skip if nothing notable
- **Example:**
  > "Quick insight: You've hit your #1 priority 5 days straight. That's a pattern worth protecting."

**Weekly Insights (After Day 7)**

**2. System (Timer)**
- **Command:** TriggerWeeklyInsights
- **Event:** WeeklyInsightsTriggered [DETERMINISTIC]

**3. AI System**
- **Command:** AnalyzeWeekPatterns
- **Event:** WeekPatternsAnalyzed [AI-POWERED]

**4. AI System**
- **Command:** GenerateWeeklyReport
- **Event:** WeeklyReportGenerated [AI-POWERED]
- **Example:**
  > "Your week:
  > - #1 completion: 80% (up from 60%)
  > - Best day: Tuesday (all deep work done by noon)
  > - Pattern: Days you start with deep work before meetings have 2x completion rate
  > 
  > Protect those mornings."

**On-Demand Insights**

**5. User**
- **Command:** AskInsightQuestion
- **Event:** InsightQuestionAsked [DETERMINISTIC]

**6. AI System**
- **Command:** AnswerInsightQuestion
- **Event:** InsightQuestionAnswered [AI-POWERED]

---

### Cold Start Handling

| Days | What AI Does |
|------|--------------|
| 1-6 | Educational tips, simple stats |
| 7-13 | Basic trends, first weekly report |
| 14+ | Full correlations, personalized recommendations |

---

### Events Summary

**[DETERMINISTIC] Events:**
- WeeklyInsightsTriggered
- InsightQuestionAsked

**[AI-POWERED] Events:**
- DailyInsightGenerated
- WeekPatternsAnalyzed
- WeeklyReportGenerated
- InsightQuestionAnswered

---

## Event Storm 8: Skipped Day Recovery

### Source
Research: Compassionate recovery, no guilt, habit strength not binary streak

---

### Timeline

**1. System (Timer)**
- **Command:** CheckDailyEngagement
- **Event:** DailyEngagementChecked [DETERMINISTIC]
- **Policy:** End of day, no check-in → MarkDaySkipped

**2. System**
- **Command:** MarkDaySkipped
- **Event:** DaySkipped [DETERMINISTIC]

**3. System**
- **Command:** UpdateHabitStrength
- **Event:** HabitStrengthUpdated [DETERMINISTIC]
- **Note:** Minimal impact for single skip

**4. User (Return)**
- **Command:** ReturnAfterSkip
- **Event:** UserReturnedAfterSkip [DETERMINISTIC]

**5. AI System**
- **Command:** GenerateWelcomeBack
- **Event:** WelcomeBackGenerated [AI-POWERED]
- **Examples:**
  - 1 day: "Hey! Missed you yesterday. No big deal. What's on your mind?"
  - 3+ days: "Good to see you. Life happens. What's one thing you want to focus on?"
  - 7+ days: "Welcome back. Let's just start fresh. What's weighing on you?"

**6. AI System**
- **Command:** OfferSimplifiedProcess
- **Event:** SimplifiedProcessOffered [AI-POWERED]
- **Note:** After extended absence, don't overwhelm
- **Example:**
  > "Let's keep it simple. What's your #1 for today? Just one thing."

---

### Habit Strength Model

| Action | Impact |
|--------|--------|
| Complete check-in | +3 points |
| Skip day | -1 point |
| Return after skip | +2 points |
| Complete full week | +5 bonus |

Visual: Heat map calendar showing density, not perfection.

---

### Events Summary

**[DETERMINISTIC] Events:**
- DailyEngagementChecked
- DaySkipped
- HabitStrengthUpdated
- UserReturnedAfterSkip

**[AI-POWERED] Events:**
- WelcomeBackGenerated
- SimplifiedProcessOffered

---

## Consolidated Events List

### All [DETERMINISTIC] Events

**Onboarding & Account**
- AppLaunched
- ChatInterfaceDisplayed
- InitialDumpReceived
- WeightShared
- MeetingPrepResponseReceived
- HighImpactWorkIdentified
- DayStructureShared
- TimeMatchResponseReceived
- QuickWinAchieved
- SessionEndSignaled
- AccountCreated / AccountCreationDeclined
- CheckInPreferenceSet
- Day1OnboardingCompleted

**Daily Check-In**
- MorningNotificationSent
- AppOpened
- DailyContextLoaded
- DumpReceived
- WeightShared
- PrepCheckResponseReceived
- HighImpactIdentified
- DayStructureShared
- PlanConfirmed
- DailyNoteSaved
- MorningCheckInCompleted

**Evening Check-In**
- EveningNotificationSent
- AppOpenedEvening
- TodayContextLoaded
- DayReviewShared
- WinsShared
- LearningShared
- ReleaseShared
- TomorrowPreviewHandled
- DailyNoteUpdated
- EveningCheckInCompleted

**Brain Dump**
- BrainDumpInitiated
- CaptureInterfaceDisplayed
- InputReceived
- CaptureAcknowledged
- SavedToInbox
- InboxItemsSurfaced

**Challenges**
- ChallengeResponseReceived
- ChallengeActivated
- ChallengeDataCollected
- ChallengeIntegratedIntoProfile

**Parking Lot**
- ParkingConfirmed
- SavedToParkingLot
- WeeklyReviewTriggered
- ParkedItemsReviewed

**Insights**
- WeeklyInsightsTriggered
- InsightQuestionAsked

**Skip Recovery**
- DailyEngagementChecked
- DaySkipped
- HabitStrengthUpdated
- UserReturnedAfterSkip

---

### All [AI-POWERED] Events

**Core Process Events**
- OpeningPromptGenerated
- DumpProcessed / DumpPrompted
- WeightClarificationPrompted / WeightPrompted
- WeightAcknowledged
- WorkTypesClassified
- AdminBatchIdentified
- MeetingPrepChecked / MeetingPrepNeedsIdentified
- ImpactIdentificationPrompted / ImpactPrompted
- ImpactValidated / ImpactChallenged / ImpactValidatedOrChallenged
- BucketsOrganized
- TimeRealityPrompted
- FocusBlocksIdentified
- WorkToTimeMatched
- PlanLockedIn

**Session Management**
- SaveSessionOffered
- DeclineAcknowledged
- CheckInTimeAsked
- Day1SessionClosed
- ContextualOpeningGenerated

**Evening**
- EveningOpeningGenerated
- DaySummaryGenerated
- WinsPrompted
- LearningPrompted
- ReleasePrompted
- TomorrowPreviewOffered
- EveningCloseGenerated

**Brain Dump**
- CaptureProcessed

**Challenges**
- ChallengeTriggerDetected
- ChallengeOfferedNaturally
- ChallengeResultsAnalyzed
- ChallengeInsightDelivered
- ChallengeLearningReferenced

**Parking Lot**
- ParkingSuggested
- ParkedItemsSummarized
- RelevantParkedItemDetected
- ReactivationSuggested

**Insights**
- DailyInsightGenerated
- WeekPatternsAnalyzed
- WeeklyReportGenerated
- InsightQuestionAnswered

**Skip Recovery**
- WelcomeBackGenerated
- SimplifiedProcessOffered

**Fallbacks**
- GentleFollowUpGenerated
- DeepWorkPromptGenerated
- EmotionalAcknowledgmentGenerated
- MotivationalStoryOffered
- RealityAcknowledged
- DeepWorkChallenge
- SurvivalModeAcknowledged
- CarryoverIntervention
- SimplificationOffered

**Guardrails**
- SupportResponseGenerated

---

## Key Policies Summary

| Trigger | Condition | Action |
|---------|-----------|--------|
| InitialDumpReceived | - | ProcessDump |
| DumpProcessed | - | PromptWeightClarification |
| WeightShared | - | ClassifyWorkTypes |
| WorkTypesClassified | HasMeetings | CheckMeetingPrepNeeds |
| WorkTypesClassified | AllAdmin | PromptDeepWork |
| HighImpactIdentified | - | OrganizeIntoBuckets |
| BucketsOrganized | - | PromptTimeReality |
| DayStructureShared | - | IdentifyFocusBlocks |
| FocusBlocksIdentified | NoFocusTime | AcknowledgeSurvivalMode |
| FocusBlocksIdentified | HasFocusTime | MatchWorkToTime |
| SessionEndSignaled | - | OfferToSaveSession |
| MorningCheckInCompleted | - | UpdateHabitStrength |
| SameItemCarriedOver3Days | - | CarryoverIntervention |
| SundayEvening | HasParkedItems | TriggerWeeklyReview |
| Day7+ | SundayEvening | TriggerWeeklyInsights |
| EndOfDay | NoCheckIn | MarkDaySkipped |
| UserMentionsEnergy | BPTNotActive | OfferBPTChallenge |

---

## Anti-Patterns to Avoid

### Process Anti-Patterns
- ❌ Skipping weight clarification (just asking "what do you need to do")
- ❌ Accepting all-admin Top 3 without challenging
- ❌ Ignoring time reality (planning 8 hours of work for 2 hours of focus time)
- ❌ Treating all tasks as equal (not distinguishing deep work from admin)
- ❌ Not flagging meeting prep needs

### Conversation Anti-Patterns
- ❌ Multiple questions in one message
- ❌ Generic responses that could apply to anyone
- ❌ Not referencing accumulated context
- ❌ Being preachy about productivity ("you should...")

### Engagement Anti-Patterns
- ❌ Guilt language for missed days
- ❌ Binary streak reset
- ❌ Making user feel bad about admin work (it's necessary, just batch it)

---

## Future Considerations (Post-MVP)

These are not in scope for MVP but should inform architectural decisions:

### Hotspots (Chris Bailey's 7 Life Areas)

The Productivity Project defines 7 "Hot Spots" — key areas of life that need attention:
- **Mind** — Learning, growth, mental stimulation
- **Body** — Health, fitness, energy, nutrition
- **Emotions** — Mental health, stress, emotional wellbeing
- **Career** — Work, professional development, impact
- **Finances** — Money, security, investments
- **Relationships** — Family, friends, community
- **Fun** — Hobbies, play, recreation

**Future Features:**
- Projects belong to hotspots (e.g., "Weightlifting program" → Body)
- Hotspot health scores calculated from activity in that area
- Balance insights surface when hotspots are neglected ("You haven't touched Relationships in 3 weeks")
- Weekly/monthly hotspot review during reflection

**Architectural Implication:**
- Future "Hotspot Engine" bounded context
- Projects need optional `hotspot_id` field (add in Phase 3 data model, leave unused in MVP)

### Full Challenge Library (22 Challenges)

MVP includes 5 challenges. The full library from The Productivity Project:

| # | Challenge | MVP? |
|---|-----------|------|
| 1 | Values | ✅ |
| 2 | Impact | ✅ |
| 3 | Rule of 3 | ✅ |
| 4 | Prime-Time (BPT) | ✅ |
| 5 | Shrinking Tasks | ❌ |
| 6 | Energy Audit | ❌ |
| 7 | Disconnecting | ❌ |
| 8 | Internet Airplane Mode | ❌ |
| 9 | Smartphone Airplane Mode | ❌ |
| 10 | Single-Tasking | ❌ |
| 11 | Working Memory | ❌ |
| 12 | Maintenance Day | ❌ |
| 13 | Capture | ✅ |
| 14 | Emptying Your Head | ❌ |
| 15 | Weekly Review | ❌ |
| 16 | Procrastination Audit | ❌ |
| 17 | Making Tasks Fun | ❌ |
| 18 | Attention Hijackers | ❌ |
| 19 | Meditation | ❌ |
| 20 | Eating for Energy | ❌ |
| 21 | Exercise | ❌ |
| 22 | Sleep | ❌ |

**Architectural Implication:**
- Challenge Engine must be extensible
- Some challenges may have dependencies (unlock after others)
- Challenge definitions should be data-driven, not hardcoded

### Project Depth

**MVP:** Flat list of projects, user creates and references in check-ins

**Future:**
- Projects have sub-tasks, milestones
- Projects belong to hotspots
- Project templates for common goals ("Get Fit", "Launch Side Project")
- Project health scoring (stale, on-track, blocked)
- Project-level insights ("This project has been blocked for 2 weeks")

### Data Model Implications for Phase 3

Even though these features are post-MVP, consider these in the data model:

```
Project {
  id
  name
  description
  hotspot_id: optional     // ← Add now, use later
  status: active | parked | completed
  created_at
  updated_at
}

Challenge {
  id
  name
  type: one-time | ongoing | tracking
  dependencies: []         // ← Add now, use later
  unlock_criteria: optional
}
```

---

## Next Steps

Event Storming complete. Proceed to:
- **Phase 2B: Context Mapping** → Output: `claru/docs/context-map.md`
- Load `pm-phase-2b-context-mapping.md` template

Key contexts emerging:
1. **Conversation Engine** — Core AI coaching conversation
2. **Work Classification Engine** — Deep work vs admin vs meetings
3. **Time/Calendar Engine** — Focus blocks, time reality
4. **User Context Store** — Profile, patterns, history
5. **Parking Lot** — Deferred items
6. **Insights Engine** — Pattern analysis
7. **Challenge Engine** — Challenge detection and delivery
8. **Engagement Tracker** — Habit strength, skip recovery

---

## Document Outputs for Code Repo

When transferring to code repo, use these paths:

| Phase | Document | Repo Path |
|-------|----------|-----------|
| Phase 1 | PRD | `claru/docs/prd.md` |
| Phase 2A | Event Storming | `claru/docs/event-storming.md` |
| Phase 2B | Context Map | `claru/docs/context-map.md` |
| Phase 2C | Bounded Context Canvases | `claru/docs/contexts/*.md` |
| Phase 3 | Technical Architecture | `claru/docs/technical-architecture.md` |
