# Claru - Context Mapping

> **Repo Path:** `claru/docs/context-map.md`
> **Related Docs:** 
> - `claru/docs/prd.md` — Product Requirements Document
> - `claru/docs/event-storming.md` — Domain Events & Flows (Phase 2A)
> - `claru/docs/technical-architecture.md` — Tech Stack & Data Model (Phase 3 output)

**Product:** Claru
**Phase:** Domain Architecture - Context Mapping
**Status:** Draft
**Last Updated:** January 2026 — Added architectural guidance (boundaries, verification, decomposition triggers)

---

## Overview

This document groups events from Event Storming into subdomains, classifies them, defines bounded context boundaries, and maps relationships between contexts.

---

## Subdomains

### Subdomain: AI Coaching Conversation

**Events in this subdomain:**
- OpeningPromptGenerated [AI-POWERED]
- DumpProcessed [AI-POWERED]
- WeightClarificationPrompted [AI-POWERED]
- WeightAcknowledged [AI-POWERED]
- ImpactIdentificationPrompted [AI-POWERED]
- ImpactValidated / ImpactChallenged [AI-POWERED]
- PlanLockedIn [AI-POWERED]
- ContextualOpeningGenerated [AI-POWERED]
- EveningOpeningGenerated [AI-POWERED]
- DaySummaryGenerated [AI-POWERED]
- WinsPrompted [AI-POWERED]
- LearningPrompted [AI-POWERED]
- ReleasePrompted [AI-POWERED]
- EveningCloseGenerated [AI-POWERED]
- SaveSessionOffered [AI-POWERED]
- DeclineAcknowledged [AI-POWERED]
- WelcomeBackGenerated [AI-POWERED]
- SimplifiedProcessOffered [AI-POWERED]
- GentleFollowUpGenerated [AI-POWERED]
- DeepWorkPromptGenerated [AI-POWERED]
- EmotionalAcknowledgmentGenerated [AI-POWERED]
- MotivationalStoryOffered [AI-POWERED]
- SimplificationOffered [AI-POWERED]
- SupportResponseGenerated [AI-POWERED] (Guardrail)

**Business description:** The conversational AI coaching experience — the back-and-forth dialogue that helps users dump, clarify, prioritize, and commit. This is the core interaction that transforms chaos into clarity.

**Classification:** **CORE**

**Rationale:** This IS the product. The quality of the AI coaching conversation is why users choose Claru over a task list app or a book. This is where we invest heavily and iterate constantly.

---

### Subdomain: Work Classification

**Events in this subdomain:**
- WorkTypesClassified [AI-POWERED]
- AdminBatchIdentified [AI-POWERED]
- MeetingPrepChecked [AI-POWERED]
- MeetingPrepNeedsIdentified [AI-POWERED]
- BucketsOrganized [AI-POWERED]
- DeepWorkChallenge [AI-POWERED] (Fallback)
- SurvivalModeAcknowledged [AI-POWERED] (Fallback)

**Business description:** Understanding the difference between deep focus work, admin tasks, and meetings. Categorizing what the user shares into work types so we can match work to time appropriately.

**Classification:** **CORE**

**Rationale:** This is a key differentiator. Most productivity apps treat all tasks equally. Our ability to distinguish deep work from admin — and challenge users when they're avoiding deep work — is core to our value proposition.

---

### Subdomain: Time Reality

**Events in this subdomain:**
- TimeRealityPrompted [AI-POWERED]
- FocusBlocksIdentified [AI-POWERED]
- WorkToTimeMatched [AI-POWERED]
- RealityAcknowledged [AI-POWERED] (Fallback - no focus time)
- DayStructureShared [DETERMINISTIC]
- CalendarDataLoaded [DETERMINISTIC] (future - calendar integration)

**Business description:** Understanding the user's actual available time — meetings, appointments, focus blocks, gaps. Matching work types to appropriate time slots. The "holy fuck" moment where users confront reality.

**Classification:** **CORE**

**Rationale:** The time reality check is a key hook. It's the moment users realize "I planned 8 hours of work for 2 hours of time." This confrontation with reality differentiates us from apps that let you add infinite tasks.

---

### Subdomain: User Context & History

**Events in this subdomain:**
- DailyContextLoaded [DETERMINISTIC]
- TodayContextLoaded [DETERMINISTIC]
- DailyNoteSaved [DETERMINISTIC]
- DailyNoteUpdated [DETERMINISTIC]
- InitialDumpReceived [DETERMINISTIC]
- DumpReceived [DETERMINISTIC]
- WeightShared [DETERMINISTIC]
- HighImpactWorkIdentified [DETERMINISTIC]
- HighImpactIdentified [DETERMINISTIC]
- PlanConfirmed [DETERMINISTIC]
- DayReviewShared [DETERMINISTIC]
- WinsShared [DETERMINISTIC]
- LearningShared [DETERMINISTIC]
- ReleaseShared [DETERMINISTIC]

**Business description:** Storing and retrieving user data — daily notes, dumps, plans, reflections, completion history. The accumulated context that makes coaching personalized over time.

**Classification:** **SUPPORTING**

**Rationale:** Essential for personalization, but data storage itself isn't differentiating. The value comes from how the AI Coaching context uses this data, not from the storage itself.

---

### Subdomain: Parking Lot

**Events in this subdomain:**
- ParkingSuggested [AI-POWERED]
- ParkingConfirmed [DETERMINISTIC]
- SavedToParkingLot [DETERMINISTIC]
- WeeklyReviewTriggered [DETERMINISTIC]
- ParkedItemsSummarized [AI-POWERED]
- ParkedItemsReviewed [DETERMINISTIC]
- RelevantParkedItemDetected [AI-POWERED]
- ReactivationSuggested [AI-POWERED]

**Business description:** Managing deferred items — things that are real but not today. Weekly review, AI-triggered resurfacing when context matches.

**Classification:** **SUPPORTING**

**Rationale:** Important for keeping the "today" list clean, but parking lot management is a supporting feature. The core value is the daily coaching, not the someday/maybe list.

---

### Subdomain: Challenges

**Events in this subdomain:**
- ChallengeTriggerDetected [AI-POWERED]
- ChallengeOfferedNaturally [AI-POWERED]
- ChallengeResponseReceived [DETERMINISTIC]
- ChallengeActivated [DETERMINISTIC]
- ChallengeDataCollected [DETERMINISTIC]
- ChallengeResultsAnalyzed [AI-POWERED]
- ChallengeInsightDelivered [AI-POWERED]
- ChallengeIntegratedIntoProfile [DETERMINISTIC]
- ChallengeLearningReferenced [AI-POWERED]

**Business description:** Detecting when to offer Chris Bailey's productivity challenges, tracking progress through them, and integrating learnings (like BPT) into ongoing coaching.

**Classification:** **SUPPORTING**

**Rationale:** Challenges add depth and are based on proven methodology, but they're not the core daily interaction. Users could get value from Claru without ever doing a formal challenge. The challenges enhance the core coaching.

---

### Subdomain: Insights & Patterns

**Events in this subdomain:**
- DailyInsightGenerated [AI-POWERED]
- WeeklyInsightsTriggered [DETERMINISTIC]
- WeekPatternsAnalyzed [AI-POWERED]
- WeeklyReportGenerated [AI-POWERED]
- InsightQuestionAsked [DETERMINISTIC]
- InsightQuestionAnswered [AI-POWERED]
- CarryoverIntervention [AI-POWERED] (chronic carryover detection)

**Business description:** Analyzing user patterns over time — completion rates, energy patterns, what works and what doesn't. Delivering insights that help users understand themselves.

**Classification:** **SUPPORTING**

**Rationale:** Insights are valuable but secondary to the daily coaching. They require accumulated data (cold start problem) and enhance rather than define the core experience.

---

### Subdomain: Engagement & Habit Tracking

**Events in this subdomain:**
- MorningCheckInCompleted [DETERMINISTIC]
- EveningCheckInCompleted [DETERMINISTIC]
- HabitStrengthUpdated [DETERMINISTIC]
- DailyEngagementChecked [DETERMINISTIC]
- DaySkipped [DETERMINISTIC]
- UserReturnedAfterSkip [DETERMINISTIC]
- SkipPatternAnalyzed [DETERMINISTIC]

**Business description:** Tracking whether users are showing up — check-in completion, habit strength, skip patterns. Enabling compassionate recovery when they miss days.

**Classification:** **SUPPORTING**

**Rationale:** Important for retention, but the engagement tracking itself isn't the product. It supports the coaching by helping us understand user behavior and recover gracefully from lapses.

---

### Subdomain: Brain Dump Capture

**Events in this subdomain:**
- BrainDumpInitiated [DETERMINISTIC]
- CaptureInterfaceDisplayed [DETERMINISTIC]
- InputReceived [DETERMINISTIC]
- CaptureAcknowledged [DETERMINISTIC]
- CaptureProcessed [AI-POWERED]
- SavedToInbox [DETERMINISTIC]
- InboxItemsSurfaced [DETERMINISTIC]

**Business description:** Quick capture of thoughts outside of check-ins. Zero-friction voice/text input that gets processed and surfaces in the next morning check-in.

**Classification:** **SUPPORTING**

**Rationale:** Valuable utility feature, but it's a supporting input mechanism for the core coaching conversation. The capture itself isn't differentiating — how it gets processed and surfaced is.

---

### Subdomain: User Identity

**Events in this subdomain:**
- AppLaunched [DETERMINISTIC]
- AppOpened [DETERMINISTIC]
- AppOpenedEvening [DETERMINISTIC]
- ChatInterfaceDisplayed [DETERMINISTIC]
- AccountCreated [DETERMINISTIC]
- AccountCreationDeclined [DETERMINISTIC]
- CheckInPreferenceSet [DETERMINISTIC]
- Day1OnboardingCompleted [DETERMINISTIC]
- SessionEndSignaled [DETERMINISTIC]
- QuickWinAchieved [DETERMINISTIC]

**Business description:** Authentication, account management, user preferences, session management.

**Classification:** **GENERIC**

**Rationale:** Solved problem. Use Supabase Auth or similar. Don't build custom auth.

---

### Subdomain: Notifications

**Events in this subdomain:**
- MorningNotificationSent [DETERMINISTIC]
- EveningNotificationSent [DETERMINISTIC]

**Business description:** Push notifications for morning and evening check-in reminders.

**Classification:** **GENERIC**

**Rationale:** Solved problem. Use existing push notification infrastructure. The timing and content of notifications can be customized, but the delivery mechanism is generic.

---

## Bounded Contexts

| Context Name | Subdomain(s) | Type | Purpose | AI Involvement |
|--------------|--------------|------|---------|----------------|
| **Coaching Engine** | AI Coaching Conversation, Work Classification, Time Reality | **CORE** | Orchestrates the coaching conversation, classifies work, matches to time | Producer |
| **User Context Store** | User Context & History | Supporting | Stores and retrieves user data for personalization | None |
| **Parking Lot Manager** | Parking Lot | Supporting | Manages deferred items, weekly review, resurfacing | Consumer |
| **Challenge Engine** | Challenges | Supporting | Detects, offers, tracks challenges; integrates learnings | Consumer/Producer |
| **Insights Engine** | Insights & Patterns | Supporting | Analyzes patterns, generates insights and reports | Consumer |
| **Engagement Tracker** | Engagement & Habit Tracking | Supporting | Tracks check-ins, habit strength, skip recovery | None |
| **Capture Service** | Brain Dump Capture | Supporting | Quick capture, processing, inbox management | Consumer |
| **User Identity** | User Identity | Generic | Auth, accounts, preferences | None |
| **Notifications** | Notifications | Generic | Push notification delivery | None |

### Why We Combined Subdomains into Coaching Engine

Three subdomains — AI Coaching Conversation, Work Classification, and Time Reality — are combined into a single **Coaching Engine** bounded context because:

1. **They're tightly coupled in the conversation flow.** You can't do work classification without being in a coaching conversation. The time reality check happens as part of the same flow.

2. **They share the same AI context.** The AI needs to hold the full conversation context to classify work, identify impact, and match to time. Splitting them would require passing excessive state between contexts.

3. **They're all CORE.** All three are differentiating. Keeping them together lets us iterate on the full coaching experience as a unit.

4. **Single responsibility at a higher level.** The Coaching Engine's job is: "Turn a messy dump into a clear, time-matched plan through conversation." That's one responsibility, even if it involves multiple steps.

---

## Why These Boundaries

Bounded context boundaries form around three criteria: **evolution velocity**, **context window needs**, and **team ownership**. Here's the explicit reasoning for each boundary decision:

### Boundary Decision Matrix

| Boundary Decision | Evolution Velocity | Context Window Needs | Team Ownership | Decision |
|-------------------|-------------------|---------------------|----------------|----------|
| Conversation + Work Classification + Time Reality | Same — all change when coaching flow changes | Same — all need current session state | Same team | **MERGE** into Coaching Engine |
| Coaching Engine ↔ User Context Store | Different — coaching prompts vs. data model | Different — coaching needs summary, not raw history | Could be different | **SEPARATE** |
| User Context Store ↔ Domain Knowledge | Very different — user data vs. methodology | Very different — user profile vs. framework retrieval | Different expertise | **SEPARATE** (future) |
| Challenge Engine ↔ Coaching Engine | Different — challenge logic vs. conversation flow | Overlapping but separable | Same team for now | **SEPARATE** (allows independent challenge iteration) |
| Insights Engine ↔ User Context Store | Different — analysis logic vs. storage | Different — batch processing vs. real-time | Could be different | **SEPARATE** |

### Key Insight: Context Windows Create Architectural Pressure

Just as traditional bounded contexts prevent a system from becoming a "big ball of mud," focused AI contexts prevent prompts from becoming contradictory instruction layers. When you see these signs, it's time to separate:

- Prompts have many conditional statements creating "archaeological layers"
- Different capabilities need dramatically different context (e.g., real-time conversation vs. historical analysis)
- Token budgets force tradeoffs between capabilities

---

## AI Boundary Constraints

LLM context windows create architectural pressures analogous to those driving traditional bounded contexts.

### Token Budget Awareness

For MVP, assume ~8K tokens available for coaching context:

| Content Type | Token Budget | Strategy |
|-------------|--------------|----------|
| Core identity/role | ~500 | Always in context — stable, essential |
| User profile/preferences | ~1,500 | Always in context — critical for personalization |
| Current session state | ~1,500 | Always in context — required for coherence |
| Yesterday's context/carryover | ~500 | Always in context — enables continuity |
| Coaching frameworks (if needed) | ~1,000 | Retrieved on-demand — not always needed |
| Response generation buffer | ~3,000 | Reserved for AI output |

### Implications for Context Boundaries

1. **Coaching Engine** owns real-time session state — must fit in active context window
2. **User Context Store** owns historical data — summarized/compressed before injection into Coaching Engine
3. **Challenge Engine** owns framework details — retrieved on-demand, not always loaded
4. **Insights Engine** operates on batch data — never competes for real-time context window

This is why User Context Store and Insights Engine are separate from Coaching Engine — they have fundamentally different context window relationships.

---

## Verification Metrics

How do we know each boundary is correct? Each context should be independently testable and evolvable.

### Coaching Engine Boundary Verification

| Metric | Target | How to Test |
|--------|--------|-------------|
| Tone A/B test independence | Can change conversation tone without touching work classification logic | Deploy tone variant, verify classification unchanged |
| Work classification iteration | Can update work type taxonomy without changing time-matching | Add new work type, verify time logic unaffected |
| Time reality updates | Can change time-matching heuristics without affecting conversation flow | Update matching rules, verify conversation structure unchanged |

**Boundary is correct when:** We can A/B test tone, classification, and time-matching independently within the same context, using modular prompt sections.

### User Context Store Boundary Verification

| Metric | Target | How to Test |
|--------|--------|-------------|
| Schema evolution independence | Can add new user data fields without Coaching Engine changes | Add field, verify coaching prompts unchanged |
| Storage swap independence | Can change storage backend without Coaching Engine awareness | Swap Supabase for Postgres, verify coaching unaffected |

**Boundary is correct when:** User data model can evolve without touching coaching prompts.

### Supporting Context Boundary Verification

| Context | Boundary Correct When |
|---------|----------------------|
| Parking Lot Manager | Can change resurfacing logic without affecting daily check-in flow |
| Challenge Engine | Can add new challenges without modifying Coaching Engine prompts |
| Insights Engine | Can change pattern analysis without affecting real-time coaching |
| Engagement Tracker | Can update habit scoring without changing coaching tone logic |

---

## When to Decompose

The current architecture is **monolithic-first** — we've combined tightly coupled capabilities into Coaching Engine. Here are triggers for future decomposition:

### Extract Work Classification When:

- [ ] Classification needs a **different AI model** (e.g., fine-tuned classifier vs. general LLM)
- [ ] Classification needs **different scaling** (e.g., batch processing for analytics)
- [ ] **Different team** owns classification taxonomy vs. conversation design
- [ ] A/B testing classification logic requires **independent deployment**

### Extract Time Reality When:

- [ ] Calendar integration requires **separate service** with different auth/security
- [ ] Time-matching needs **real-time calendar sync** that shouldn't block conversation
- [ ] **Different team** owns time logic vs. coaching conversation

### Extract Coaching Tone When:

- [ ] Tone/persona needs **rapid A/B testing** faster than full coaching deployment
- [ ] **Localization** requires different tone engines per language/culture
- [ ] **Brand variations** require different personas (e.g., Claru vs. white-label)

### General Decomposition Triggers:

| Signal | Action |
|--------|--------|
| Prompts have conflicting conditional layers | Split into specialized prompt modules |
| Different capabilities need different models | Extract to separate context |
| Teams blocked waiting on each other | Split along team boundaries |
| Deployment coupling causes friction | Extract independently deployable contexts |

**Rule of thumb:** Don't decompose until you feel the pain. Premature decomposition adds complexity without benefit.

---

## Context Relationships

| Upstream (Provider) | Downstream (Consumer) | What's Exchanged |
|--------------------|----------------------|------------------|
| User Identity | Coaching Engine | User profile, preferences |
| User Identity | User Context Store | User ID for data association |
| User Identity | All Contexts | Auth tokens, user identification |
| User Context Store | Coaching Engine | Daily context, history, patterns |
| Coaching Engine | User Context Store | Extracted data (dumps, plans, completions) |
| Coaching Engine | Parking Lot Manager | Items to park |
| Coaching Engine | Insights Engine | Session data for pattern analysis |
| Coaching Engine | Engagement Tracker | Check-in completion events |
| Challenge Engine | Coaching Engine | Challenge learnings (BPT, high-impact tasks) |
| Coaching Engine | Challenge Engine | Trigger signals (user mentions energy, etc.) |
| Parking Lot Manager | Coaching Engine | Parked items for resurfacing suggestions |
| Insights Engine | Coaching Engine | Patterns and insights to reference |
| Capture Service | User Context Store | Captured items for inbox |
| User Context Store | Capture Service | Inbox items to surface |
| Engagement Tracker | Coaching Engine | Habit strength, skip history |
| Notifications | User (External) | Push notifications |

---

## Interface Definitions

### Coaching Engine (CORE)

**NEEDS from other contexts:**

| From Context | What's Needed | Why |
|--------------|---------------|-----|
| User Identity | User profile (name, preferences, timezone) | Personalize conversation, schedule correctly |
| User Context Store | Yesterday's plan, completion status, carryover | Reference in contextual opening |
| User Context Store | Recent dumps, weights, patterns | Inform coaching (e.g., "this has carried over 3 days") |
| Challenge Engine | Active challenge status, BPT data | Reference in coaching ("you're in your prime time") |
| Parking Lot Manager | Parked items relevant to current conversation | Suggest reactivation when context matches |
| Insights Engine | User patterns, correlations | Inform challenges and suggestions |
| Engagement Tracker | Habit strength, days since last check-in | Adjust tone for returning users |

**EXPOSES to other contexts:**

| To Context | What's Exposed | Format |
|------------|----------------|--------|
| User Context Store | Processed dump, classified work, final plan | DailyPlanCreated event |
| User Context Store | Evening reflection data | EveningReflectionSaved event |
| Parking Lot Manager | Items to park | ParkItemRequested event |
| Challenge Engine | Potential challenge triggers | ChallengeTriggerDetected event |
| Insights Engine | Session completion data | SessionCompleted event |
| Engagement Tracker | Check-in completed | CheckInCompleted event |

---

### User Context Store (Supporting)

**NEEDS from other contexts:**

| From Context | What's Needed | Why |
|--------------|---------------|-----|
| User Identity | User ID | Associate data with correct user |
| Coaching Engine | Processed dumps, plans, reflections | Store for future reference |
| Capture Service | Captured items | Add to inbox |

**EXPOSES to other contexts:**

| To Context | What's Exposed | Format |
|------------|----------------|--------|
| Coaching Engine | Daily context, history | Query: GetDailyContext |
| Coaching Engine | User patterns | Query: GetUserPatterns |
| Capture Service | Inbox items | Query: GetInboxItems |
| Insights Engine | Historical data for analysis | Query: GetHistoricalData |
| Parking Lot Manager | User's parked items | Query: GetParkedItems |

---

### Parking Lot Manager (Supporting)

**NEEDS from other contexts:**

| From Context | What's Needed | Why |
|--------------|---------------|-----|
| Coaching Engine | Items to park | Add to parking lot |
| User Context Store | User's parked items | Display in weekly review |

**EXPOSES to other contexts:**

| To Context | What's Exposed | Format |
|------------|----------------|--------|
| Coaching Engine | Relevant parked items for current context | Query: GetRelevantParkedItems |
| Coaching Engine | Weekly review summary | WeeklyReviewReady event |

---

### Challenge Engine (Supporting)

**NEEDS from other contexts:**

| From Context | What's Needed | Why |
|--------------|---------------|-----|
| Coaching Engine | Trigger signals (user mentions energy, scattered, etc.) | Detect when to offer challenge |
| User Context Store | Challenge progress, historical data | Track progress, analyze results |

**EXPOSES to other contexts:**

| To Context | What's Exposed | Format |
|------------|----------------|--------|
| Coaching Engine | Active challenge status | Query: GetActiveChallenges |
| Coaching Engine | Challenge learnings (BPT, high-impact tasks) | Query: GetChallengeLearnings |
| User Context Store | Challenge completion, results | ChallengeCompleted event |

---

### Insights Engine (Supporting)

**NEEDS from other contexts:**

| From Context | What's Needed | Why |
|--------------|---------------|-----|
| User Context Store | Historical data (dumps, plans, completions, reflections) | Analyze patterns |
| Engagement Tracker | Check-in history, habit strength | Correlate with outcomes |

**EXPOSES to other contexts:**

| To Context | What's Exposed | Format |
|------------|----------------|--------|
| Coaching Engine | Patterns, correlations, insights | Query: GetUserInsights |
| Coaching Engine | Weekly report | WeeklyReportReady event |

---

### Engagement Tracker (Supporting)

**NEEDS from other contexts:**

| From Context | What's Needed | Why |
|--------------|---------------|-----|
| Coaching Engine | Check-in completion events | Track engagement |
| User Identity | User ID | Associate with correct user |

**EXPOSES to other contexts:**

| To Context | What's Exposed | Format |
|------------|----------------|--------|
| Coaching Engine | Habit strength, skip history | Query: GetEngagementStatus |
| Insights Engine | Engagement data for correlation | Query: GetEngagementHistory |

---

### Capture Service (Supporting)

**NEEDS from other contexts:**

| From Context | What's Needed | Why |
|--------------|---------------|-----|
| User Identity | User ID | Associate capture with user |

**EXPOSES to other contexts:**

| To Context | What's Exposed | Format |
|------------|----------------|--------|
| User Context Store | Processed captures | CaptureProcessed event |

---

### User Identity (Generic)

**NEEDS from other contexts:**

| From Context | What's Needed | Why |
|--------------|---------------|-----|
| (External) | Auth provider | Handle authentication |

**EXPOSES to other contexts:**

| To Context | What's Exposed | Format |
|------------|----------------|--------|
| All Contexts | User ID, profile, preferences | Query: GetUser |
| Coaching Engine | Timezone, notification preferences | Query: GetUserPreferences |

---

### Notifications (Generic)

**NEEDS from other contexts:**

| From Context | What's Needed | Why |
|--------------|---------------|-----|
| User Identity | User preferences (notification times) | Schedule correctly |
| Engagement Tracker | Should we send? (e.g., already checked in today) | Avoid unnecessary notifications |

**EXPOSES to other contexts:**

| To Context | What's Exposed | Format |
|------------|----------------|--------|
| (External - User) | Push notifications | Platform push |

---

## Visual Context Map

### Primary Architecture (with Anti-Corruption Layers)

```
                              ┌─────────────────────┐
                              │   User Identity     │
                              │     (Generic)       │
                              └──────────┬──────────┘
                                         │ 
                                    ┌────┴────┐
                                    │   ACL   │ ← Translates auth tokens to user context
                                    └────┬────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼                                ▼                                ▼
┌───────────────────┐         ┌─────────────────────┐         ┌───────────────────┐
│                   │         │                     │         │                   │
│  COACHING ENGINE  │◄──ACL──►│  User Context Store │◄──ACL───│  Capture Service  │
│      (CORE)       │         │    (Supporting)     │         │   (Supporting)    │
│                   │         │                     │         │                   │
│ ┌───────────────┐ │         │ • Daily notes       │         │ • Quick capture   │
│ │ Conversation  │ │         │ • History           │         │ • Voice/text      │
│ │ Orchestrator  │ │         │ • Memory (tiered)   │         │ • Inbox           │
│ ├───────────────┤ │         │                     │         │                   │
│ │ Work          │ │         └──────────┬──────────┘         └───────────────────┘
│ │ Classifier    │ │                    │
│ ├───────────────┤ │                    │
│ │ Time          │ │         ┌──────────┴──────────┐
│ │ Matcher       │ │         │                     │
│ └───────────────┘ │         ▼                     ▼
│                   │  ┌─────────────────┐  ┌─────────────────┐
└────────┬──────────┘  │ Insights Engine │  │   Engagement    │
         │             │  (Supporting)   │  │    Tracker      │
         │             │                 │  │  (Supporting)   │
    ┌────┴────┐        │ • Patterns      │  │                 │
    │   ACL   │        │ • Weekly report │  │ • Habit strength│
    └────┬────┘        │ • Correlations  │  │ • Skip recovery │
         │             └─────────────────┘  └─────────────────┘
         │
    ┌────┴─────────────────┐
    │                      │
    ▼                      ▼
┌─────────────────┐  ┌─────────────────┐            ┌───────────────────┐
│ Parking Lot     │  │ Challenge       │            │  Notifications    │
│ Manager         │  │ Engine          │            │   (Generic)       │
│ (Supporting)    │  │ (Supporting)    │            │                   │
│                 │  │                 │            │ • Push delivery   │
│ • Deferred items│  │ • BPT tracking  │            │ • Reminders       │
│ • Weekly review │  │ • 22 challenges │            │                   │
│ • Resurfacing   │  │ • Methodology   │            └───────────────────┘
└─────────────────┘  └─────────────────┘
```

### Anti-Corruption Layer Responsibilities

| ACL | Between | Responsibility |
|-----|---------|----------------|
| **Identity ACL** | User Identity → All Contexts | Translates auth tokens to clean user objects; isolates auth provider details |
| **Context ACL** | Coaching Engine ↔ User Context Store | Translates raw history into coaching-relevant summaries; compresses for token budget |
| **Capture ACL** | Capture Service → User Context Store | Validates and normalizes captured input before storage |
| **Coaching ACL** | Coaching Engine → Supporting Contexts | Translates coaching events into context-specific formats |

### Future State: Domain Knowledge Extraction

When we need independent framework evolution (Phase 3+):

```
┌───────────────────┐         ┌─────────────────────┐         ┌───────────────────┐
│  COACHING ENGINE  │◄──ACL──►│  User Context Store │◄──ACL──►│ Domain Knowledge  │
│      (CORE)       │         │    (Supporting)     │         │   (Supporting)    │
│                   │         │                     │         │                   │
│ • Orchestration   │         │ • User profile      │         │ • GTD framework   │
│ • Session state   │         │ • Memory (tiered)   │         │ • Chris Bailey    │
│ • Response gen    │         │ • Goals/constraints │         │ • Coaching prompts│
└───────────────────┘         └─────────────────────┘         └───────────────────┘
```

---

## AI Data Flow

### Inputs to Coaching Engine (CORE)

| From Context | What's Provided | Purpose |
|--------------|-----------------|---------|
| User Context Store | Yesterday's plan, carryover, history | Contextual opening, pattern awareness |
| User Context Store | Past dumps, weights, high-impact items | Reference in conversation |
| Challenge Engine | BPT data, active challenges | "You're in your prime time" |
| Insights Engine | Patterns, correlations | Challenge user choices, suggest improvements |
| Engagement Tracker | Habit strength, skip history | Tone adjustment for returning users |
| Parking Lot Manager | Relevant parked items | Suggest reactivation |

### Outputs from Coaching Engine (CORE)

| To Context | What's Provided | Format |
|------------|-----------------|--------|
| User Context Store | Processed dump, work types, plan | DailyPlanCreated event |
| User Context Store | Evening reflection | EveningReflectionSaved event |
| Parking Lot Manager | Items to defer | ParkItemRequested event |
| Challenge Engine | Trigger signals | ChallengeTriggerDetected event |
| Insights Engine | Session data | SessionCompleted event |
| Engagement Tracker | Completion signal | CheckInCompleted event |

---

## Completion Checklist

- [x] All events grouped into subdomains
- [x] Each subdomain named with a BUSINESS term (not technical)
- [x] Each subdomain classified as Core, Supporting, or Generic
- [x] Classification rationale documented
- [x] Bounded context boundaries defined
- [x] Each context has clear, non-overlapping responsibilities
- [x] Interface definitions complete (NEEDS and EXPOSES)
- [x] Context map drawn showing relationships

**AI-POWERED features:**
- [x] AI experience classified as Core (Coaching Engine)
- [x] AI infrastructure distinguished from AI experience (Generic: notifications, auth)
- [x] AI data flow documented (inputs and outputs)

**Architectural guidance (added based on DDD + AI best practices):**
- [x] "Why These Boundaries" — explicit criteria for merge/separate decisions
- [x] "AI Boundary Constraints" — token budget awareness documented
- [x] "Verification Metrics" — how to validate each boundary is correct
- [x] "When to Decompose" — triggers for future context extraction
- [x] Anti-Corruption Layers shown in visual context map
- [x] Future state (Domain Knowledge extraction) documented

- [x] NO technology decisions made

---

## Next Steps

Context Mapping complete. We have **9 bounded contexts**:
- 1 Core (Coaching Engine)
- 6 Supporting (User Context Store, Parking Lot Manager, Challenge Engine, Insights Engine, Engagement Tracker, Capture Service)
- 2 Generic (User Identity, Notifications)

Next: Define each context in detail using Bounded Context Canvases.
- Load `pm-phase-2c-bounded-context-canvas.md`
- Start with the **Coaching Engine** (Core context) first
- Output: `claru/docs/contexts/coaching-engine.md`

---

## Document Outputs for Code Repo

| Phase | Document | Repo Path |
|-------|----------|-----------|
| Phase 1 | PRD | `claru/docs/prd.md` |
| Phase 2A | Event Storming | `claru/docs/event-storming.md` |
| Phase 2B | Context Map | `claru/docs/context-map.md` |
| Phase 2C | Bounded Context Canvases | `claru/docs/contexts/*.md` |
| Phase 3 | Technical Architecture | `claru/docs/technical-architecture.md` |
