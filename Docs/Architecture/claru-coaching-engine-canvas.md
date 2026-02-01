# Bounded Context Canvas: Coaching Engine

> **Repo Path:** `claru/docs/contexts/coaching-engine.md`
> **Related Docs:** 
> - `claru/docs/prd.md` — Product Requirements Document
> - `claru/docs/event-storming.md` — Domain Events & Flows
> - `claru/docs/context-map.md` — Context Boundaries & Relationships

**Context:** Coaching Engine
**Type:** Core
**Status:** Draft
**Last Updated:** January 2026

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | Coaching Engine |
| **Type** | Core |
| **AI Involvement** | Producer |
| **Owner** | Product team |

**Purpose Statement:**
Delivers AI-guided productivity coaching through natural conversation. Transforms messy brain dumps into clear, time-matched daily plans by classifying work types, checking time reality, and guiding users through structured check-in flows. This is Claru's core value — the coaching conversation that turns chaos into clarity.

**Combines Three Subdomains:**
- **AI Coaching Conversation** — The back-and-forth dialogue
- **Work Classification** — Deep work vs. admin vs. meetings
- **Time Reality** — Matching work to available time

---

## Ubiquitous Language (This Context Only)

| Term | Meaning in THIS Context |
|------|-------------------------|
| **Session** | A single coaching conversation (morning check-in, evening check-in, or ad-hoc) |
| **Turn** | One exchange: user input + AI response |
| **Dump** | Unstructured capture of everything on user's mind |
| **Weight** | What's emotionally weighing on the user (mental RAM drain) |
| **Work Type** | Classification: Deep Focus, Admin, or Meeting |
| **Deep Focus Work** | Tasks requiring 45+ minutes of uninterrupted concentration |
| **Admin Batch** | Quick 2-5 minute tasks that can be batched together |
| **Meeting Prep** | Preparation work required before a meeting |
| **Time Reality** | The confrontation between planned work and actual available time |
| **Focus Block** | A protected window of time for deep work |
| **Top 3** | The three most important outcomes for today |
| **Parking** | Deferring an item to the Parking Lot (not today) |
| **Flow** | A structured conversation pattern (e.g., "morning-check-in", "evening-reflection") |
| **Extraction** | Deriving structured data from user's natural language |

---

## Responsibilities

**What this context OWNS:**
- Orchestrating coaching conversation flow (dump → weight → classify → impact → time → plan)
- Generating contextual, personalized AI responses
- Classifying work into types (Deep Focus, Admin, Meeting)
- Identifying meeting prep needs
- Matching work types to available time slots
- Challenging users when they're avoiding deep work
- Extracting structured data from natural language (tasks, energy, weight)
- Maintaining coaching persona and tone consistency across turns
- Managing session state and conversation coherence
- Triggering fallbacks when AI can't process input

**What this context does NOT own:**
- Storing user history long-term → User Context Store
- Persisting daily notes and plans → User Context Store
- Managing deferred items → Parking Lot Manager
- Tracking challenge progress → Challenge Engine
- Analyzing patterns over time → Insights Engine
- Tracking habit strength → Engagement Tracker
- Authenticating users → User Identity
- Sending notifications → Notifications

---

## Key Entities

| Entity | Description | Key Attributes | Identifier |
|--------|-------------|----------------|------------|
| **CoachingSession** | Active conversation with user | userId, flow, state, startedAt, turnCount | sessionId (UUID) |
| **ConversationTurn** | One user input + AI response pair | userInput, aiResponse, extractedData, timestamp, turnNumber | turnId (UUID) |
| **SessionPlan** | The plan being built during session | top3[], adminBatch[], parkedItems[], focusBlocks[] | (embedded in session) |

---

## Value Objects

| Value Object | Description | Attributes |
|--------------|-------------|------------|
| **UserContext** | Snapshot of user data for AI (from User Context Store) | name, preferences, yesterdayPlan, carryover[], recentPatterns, habitStrength |
| **DumpContent** | Raw unstructured input from user | rawText, source (voice/text), timestamp |
| **ClassifiedWork** | Work item with classification | text, workType (deep/admin/meeting), urgency, project?, confidence |
| **ExtractedWeight** | What's weighing on user | description, emotionalContext, confidence |
| **FocusBlock** | Available deep work window | startTime, endTime, duration, isProtected |
| **TimeReality** | User's actual available time | focusBlocks[], adminGaps[], meetings[], totalFocusMinutes |
| **DayPlan** | Final output of morning check-in | top3[], adminBatch[], focusBlock, meetingPrep[], parkedItems[] |

---

## Aggregates

| Aggregate Root | Contains | Key Invariants |
|----------------|----------|----------------|
| **CoachingSession** | ConversationTurns (ordered), SessionPlan, CurrentFlow, SessionState | Turns must be chronological. Cannot add turns to completed session. One active session per user. Session must complete a flow before ending (or explicitly abandon). |

### CoachingSession States

```
[Created] → [InProgress] → [PlanConfirmed] → [Completed]
                ↓
          [Abandoned]
```

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| **Created** | Session initialized, no turns yet | → InProgress |
| **InProgress** | Active conversation happening | → PlanConfirmed, Abandoned |
| **PlanConfirmed** | User confirmed their Top 3 and plan | → Completed |
| **Completed** | Session ended successfully | (terminal) |
| **Abandoned** | User left without completing | (terminal) |

---

## Domain Events Published

| Event Name | Trigger | Data Included | Consumers |
|------------|---------|---------------|-----------|
| **SessionStarted** | User initiates check-in | sessionId, userId, flow, timestamp | Engagement Tracker |
| **DumpProcessed** | AI structures user's brain dump | sessionId, classifiedItems[], extractedWeight | User Context Store |
| **WorkTypesClassified** | AI categorizes work | sessionId, deepWork[], adminBatch[], meetings[] | User Context Store |
| **FocusBlocksIdentified** | AI identifies available time | sessionId, focusBlocks[], totalMinutes | User Context Store |
| **WorkToTimeMatched** | AI matches work to time | sessionId, assignments[] | User Context Store |
| **PlanConfirmed** | User confirms Top 3 | sessionId, top3[], adminBatch[], focusBlock | User Context Store |
| **ParkItemRequested** | User wants to defer item | sessionId, item, reason | Parking Lot Manager |
| **SessionCompleted** | Check-in finished | sessionId, duration, turnCount, completionType | Engagement Tracker, Insights Engine |
| **ChallengeTriggerDetected** | AI detects challenge opportunity | sessionId, triggerType, context | Challenge Engine |
| **GuardrailTriggered** | AI hit a constraint | sessionId, guardrailType, userInput | Monitoring |
| **FallbackActivated** | AI couldn't process | sessionId, reason, fallbackType | Monitoring |

---

## Commands Accepted

| Command | Actor | Preconditions | Effect | Resulting Event |
|---------|-------|---------------|--------|-----------------|
| **StartMorningCheckIn** | User/System | No active session, user exists | Creates session with morning flow | SessionStarted |
| **StartEveningCheckIn** | User/System | No active session, has morning plan | Creates session with evening flow | SessionStarted |
| **ReceiveUserInput** | User | Active session exists | Adds turn, generates AI response | (varies by flow state) |
| **ConfirmPlan** | User | Session in PlanConfirmed state | Locks plan, completes session | PlanConfirmed, SessionCompleted |
| **ParkItem** | User | Active session, item identified | Marks item for parking | ParkItemRequested |
| **AbandonSession** | User/System | Active session exists | Ends session without completion | SessionCompleted (abandoned) |

---

## Queries Answered

| Query | Input | Output | Used By |
|-------|-------|--------|---------|
| **GetActiveSession** | userId | CoachingSession or null | Internal, UI |
| **GetSessionHistory** | sessionId | Full conversation transcript | Internal debugging |
| **GetCurrentPlan** | sessionId | SessionPlan in progress | Internal, UI |

---

## Interfaces

### NEEDS from Other Contexts

| From Context | What's Needed | Format | Why Needed |
|--------------|---------------|--------|------------|
| **User Identity** | User profile (name, timezone, preferences) | Query: GetUser | Personalize conversation, schedule correctly |
| **User Context Store** | Yesterday's plan, completion status | Query: GetYesterdayContext | Contextual opening ("Yesterday you said X was priority") |
| **User Context Store** | Carryover items (incomplete from yesterday) | Query: GetCarryover | Surface in morning check-in |
| **User Context Store** | Recent patterns (energy, completion rates) | Query: GetRecentPatterns | Inform coaching ("You've been low energy mornings") |
| **Challenge Engine** | BPT data, active challenges | Query: GetChallengeLearnings | Reference in coaching ("You're in your prime time") |
| **Parking Lot Manager** | Relevant parked items | Query: GetRelevantParked | Suggest reactivation when context matches |
| **Engagement Tracker** | Habit strength, days since check-in | Query: GetEngagementStatus | Adjust tone for returning users |
| **Insights Engine** | User patterns, correlations | Query: GetUserInsights | Challenge choices, suggest improvements |

### EXPOSES to Other Contexts

| To Context | What's Exposed | Format | Contract |
|------------|----------------|--------|----------|
| **User Context Store** | Processed dump, classified work, plan | Event: DumpProcessed, PlanConfirmed | Contains structured data with confidence > 0.7 |
| **Parking Lot Manager** | Items to defer | Event: ParkItemRequested | Contains: item text, reason, source session |
| **Challenge Engine** | Trigger signals | Event: ChallengeTriggerDetected | Contains: trigger type, user context |
| **Insights Engine** | Session data | Event: SessionCompleted | Contains: duration, turnCount, completion type |
| **Engagement Tracker** | Completion signal | Event: SessionCompleted | Contains: sessionId, flow type, completed boolean |

---

## Business Rules

### Session Rules

1. **One active session per user:** Cannot have multiple active sessions simultaneously.
2. **Session timeout:** Sessions auto-abandon after 30 minutes of inactivity.
3. **Turn limit:** Sessions should not exceed 15 turns for morning, 10 for evening. At limit, offer to wrap up.
4. **Flow completion:** A session should complete its flow before ending. Abandonment is tracked.

### Work Classification Rules

5. **Deep work threshold:** Tasks requiring 45+ minutes uninterrupted = Deep Focus.
6. **Admin batch threshold:** Tasks < 5 minutes each can be batched.
7. **Soft all-admin challenge:** If user's Top 3 are all admin tasks, offer soft suggestion: "Just noting these are all quick tasks. Anything deeper on your mind?" If user declines, accept and proceed without guilt.
8. **Meeting prep suggestion:** For meetings that appear high-stakes, suggest prep time as opt-in: "That client call looks important — want to block prep time?" User can decline.

### Time Reality Rules

9. **Focus block minimum:** Deep work needs 45+ minute blocks. Don't assign deep work to gaps.
10. **Admin in gaps:** Admin tasks should be assigned to gaps between meetings (15-30 min).
11. **Reality confrontation:** Always show user their actual available time before locking plan.
12. **Zero focus time:** If no focus blocks available, still ask: "If you did have focus time, what would be the main thing you'd work on?" — captures intent for future.

### Extraction Rules

12. **Confidence threshold:** Only include extracted data in events when confidence > 0.7.
13. **Clarification on low confidence:** If confidence < 0.5, ask clarifying question instead of guessing.

### Persona Rules

14. **Tone consistency:** All responses must maintain coach persona (direct, warm, action-oriented).
15. **Structure first:** Always organize/summarize user input before making suggestions.
16. **One question per turn:** Never ask multiple questions in one response.

---

## Policies

| Trigger Event | Action | Conditions |
|---------------|--------|------------|
| SessionStarted (morning) | Load yesterday context, carryover | Always |
| DumpProcessed | Classify work types | Always after dump |
| WorkTypesClassified | Check for all-admin Top 3 | If top 3 identified |
| WorkTypesClassified | Identify meeting prep needs | If meetings present |
| FocusBlocksIdentified | Match work to time | Always after time check |
| PlanConfirmed | Notify User Context Store | Always |
| PlanConfirmed | Check for challenge triggers | If challenge not active |
| SessionCompleted | Update engagement tracker | Always |
| GuardrailTriggered | Log for review | Always |
| Turn > 12 | Offer to wrap up | Morning flow only |

---

## AI Behavior Properties

### Response Properties

| Property | Specification | How to Measure |
|----------|---------------|----------------|
| **Length** | 2-4 sentences standard; up to 6 for structured summaries | Sentence count |
| **Tone** | Direct, warm, action-oriented — like a sharp colleague who's seen your game tape | Human rubric 1-5 |
| **Structure** | Brief acknowledgment → Structured summary → ONE question or confirmation | Pattern matching |
| **Personalization** | Use name 1-2x per session; reference specific items from input | Human evaluation |

### Behavioral Properties

| Property | Specification | How to Measure |
|----------|---------------|----------------|
| **Actionability** | 80%+ responses include concrete next step | Human evaluation |
| **Relevance** | 95%+ on-topic for current flow phase | LLM-as-judge |
| **Structure First** | 100% of dump responses include organized summary before questions | Pattern matching |
| **Soft All-Admin Notice** | 100% sessions with all-admin Top 3 get soft suggestion (not aggressive challenge) | Human evaluation |
| **Time Reality Check** | 100% morning sessions include time confrontation | Flow tracking |
| **Zero Focus Capture** | 100% zero-focus-time sessions still ask about deep work intent | Flow tracking |

### Work Classification Properties

| Property | Specification | How to Measure |
|----------|---------------|----------------|
| **Classification Accuracy** | 85%+ work items correctly classified | Human evaluation sample |
| **Meeting Prep Detection** | 90%+ high-stakes meetings flagged for prep | Human evaluation |
| **Admin Batch Identification** | 80%+ quick tasks grouped appropriately | Human evaluation |

---

## Guardrails

### Prohibited Behaviors

| Guardrail | Description | Detection Method | Response When Triggered |
|-----------|-------------|------------------|------------------------|
| **No Mental Health Advice** | Never diagnose, treat, or give specific mental health guidance | Keywords + sentiment | Acknowledge concern, suggest professional, redirect: "That sounds tough. A professional could help. For our check-in, what's one small thing?" |
| **No Guilt/Shame** | Never make user feel bad about missed days, incomplete tasks | Sentiment analysis on output | Reframe positively: "Yesterday didn't go as planned — that happens. What's one thing for today?" |
| **No Toxic Positivity** | Don't dismiss real struggles with forced optimism | Context awareness | Acknowledge reality: "That does sound overwhelming. Let's find one small step forward." |
| **No Decision Making** | Always suggest, never command or decide for user | Grammar analysis | Rephrase as questions: "Would you like to..." not "You should..." |
| **No Medical Advice** | Never diagnose or recommend treatment | Keyword detection | Acknowledge, suggest professional, continue with productivity scope |

### Required Behaviors

| Guardrail | Description | Enforcement |
|-----------|-------------|-------------|
| **Structure First** | Always organize/summarize user input before suggestions | Response structure validation |
| **One Question Per Turn** | Never ask multiple questions in one response | Output validation |
| **Confirm Before Closing** | Always get explicit confirmation on Top 3 before ending | Flow state tracking |
| **Time Reality Check** | Always confront user with actual available time | Flow requirement |
| **Soft All-Admin Notice** | Notice when Top 3 are all admin, offer soft suggestion, accept user's choice | Classification check |
| **Meeting Prep Opt-In** | Suggest prep time for high-stakes meetings, don't assume | User confirmation |
| **AI Disclosure** | Disclose AI nature if directly asked | Response rule |

---

## Evaluation Criteria

### Automated Metrics

| Metric | Tool/Method | Target | Frequency |
|--------|-------------|--------|-----------|
| Response latency (P95) | Application monitoring | < 3 seconds | Real-time |
| Session completion rate | Flow analytics | > 80% complete flow | Daily |
| Turn count distribution | Analytics | 4-8 turns average (morning) | Weekly |
| Classification confidence | Model output | > 0.7 average | Daily |
| Guardrail trigger rate | Content filter logs | < 2% of responses | Daily |

### Human Evaluation

| Evaluation Type | Who | What They Assess | Frequency |
|-----------------|-----|------------------|-----------|
| Session review | Internal team | Helpfulness, persona consistency, work classification accuracy | Weekly: 50 sessions |
| User feedback | End users | Thumbs up/down after session | Every session |
| Red team testing | QA team | Break persona, elicit prohibited content, find edge cases | Pre-launch, monthly |
| Classification audit | Internal team | Work type accuracy, meeting prep detection | Weekly: 100 classifications |

---

## Fallback Behaviors

| Scenario | Detection | Fallback Response | Recovery Path |
|----------|-----------|-------------------|---------------|
| **Cannot understand input** | Confidence < 0.5 | Ask single clarifying question: "Could you tell me more about [unclear part]?" | User clarifies |
| **User going off-topic** | Topic classifier | Gentle redirect after acknowledgment: "That's interesting! For this check-in, what's on your plate?" | Guide back to flow |
| **All-admin Top 3** | Classification check | Soft suggestion: "Just noting these are all quick tasks. Anything deeper on your mind?" | If user declines, accept and proceed |
| **No focus time available** | Zero focus blocks | Ask anyway: "Looks like a meeting-heavy day. If you did have focus time, what would be the main thing?" Then: "Let's capture that for when you do have time." | Capture intent, adjust to admin-only plan |
| **API timeout/error** | System error | Static capture mode: "I'm having trouble. Capture your thoughts here, I'll process when back." | Queue for retry |
| **User seems distressed** | Sentiment + keywords | Acknowledge, offer pause: "It sounds like you're going through a lot. Continue or come back later?" | User chooses |
| **User resists process** | Repeated deflection | Offer simplified: "Want to just capture your Top 3 quickly today?" | Simplified flow |

---

## Conversation Flows

### Morning Check-In Flow (Day 2+)

```
Phase 1: Quick Context (30 sec)
├── Load yesterday context, carryover
├── "Morning. Yesterday you said [#1] was the priority. How'd it go?"
└── → Phase 2

Phase 2: Dump (2-3 min)  
├── "What's on your mind today? Everything — work, personal, whatever."
├── User dumps (voice or text)
└── → Phase 3

Phase 3: Weight Clarification (1 min)
├── "What's weighing on you the most right now?"
├── Surfaces mental RAM drain
└── → Phase 4

Phase 4: Work Type Sort (1-2 min)
├── AI classifies: deep focus, admin batch, meetings
├── "The [X] needs real focus time. The [Y, Z] are quick hits."
├── Check meeting prep: "For that client call — need prep time?"
└── → Phase 5

Phase 5: Impact Identification (1 min)
├── "Of the deep focus work, which drives the most impact?"
├── Challenge if needed: "That's admin. The [X] moves things forward."
└── → Phase 6

Phase 6: Time Reality Check (1-2 min)
├── "Let's look at your day."
├── Show focus blocks, admin gaps, meetings
├── Match work to time
├── "You've got [X] hours for deep work. [Y] is your #1."
└── → Phase 7

Phase 7: Lock It In (30 sec)
├── Present final plan: Top 3, admin batch, focus block
├── "Your #1 is [X], 9:30am. Go."
├── User confirms
└── → Completed
```

### Evening Check-In Flow

```
Phase 1: Day Summary (1 min)
├── Load today's plan
├── "End of day. You planned: [Top 3]. How'd it go?"
└── → Phase 2

Phase 2: Wins (1 min)
├── "What went well today?"
├── Capture wins
└── → Phase 3

Phase 3: Learning (1 min)
├── "Anything you'd do differently?"
├── Capture learning
└── → Phase 4

Phase 4: Release (30 sec)
├── "Anything you need to let go of before tomorrow?"
├── Park or release
└── → Phase 5

Phase 5: Close (15 sec)
├── "Nice work today. See you tomorrow."
└── → Completed
```

---

## Example Variations

### Example 1: Morning Dump Processing

**Context:** User "Marcus" shares brain dump on Day 12

**User Input:**
"okay so today I need to finish the roadmap doc, also Sarah wants that competitor analysis by EOD, and I should probably follow up on those three candidates we interviewed. Oh and I have a dentist appointment at 2pm and I need to text my mom back."

**Acceptable Response A:**
```
Got it. Here's what I'm capturing:

**Deep Focus:** Finish roadmap doc
**Work:** Competitor analysis for Sarah (EOD), follow up on 3 candidates
**Personal:** Dentist at 2pm, text mom

The roadmap needs real focus time. The follow-ups and text are quick hits.

Suggested Top 3: (1) Finish roadmap, (2) Competitor analysis, (3) Candidate follow-ups.

Does this priority order feel right?
```

**Acceptable Response B:**
```
Let me organize that.

You've got the roadmap doc (that's deep work), competitor analysis for Sarah by EOD, candidate follow-ups, dentist at 2, and a text to mom.

The roadmap's been carrying over — want that as #1 today?
```

**Properties demonstrated:**
- Structure first ✓ (organized before asking)
- Work type classification ✓ (deep focus vs quick hits)
- One question ✓
- Personalization ✓ (knows roadmap is ongoing)

**Unacceptable Response:**
```
Wow, you have a lot going on! The roadmap document is super important for your Q1 goals. Sarah's request sounds urgent too. And don't forget to text your mom — family is important! What do you want to tackle first? What's most aligned with your values? How are you feeling about your energy today?
```

**Why Unacceptable:** Too enthusiastic, no structure, multiple questions, doesn't classify work types, preachy about values.

---

### Example 2: Soft All-Admin Challenge

**Context:** User's dump contains only quick tasks

**User Input:**
"Today I just need to send that text to Sarah, reply to a few emails, and schedule the dentist appointment."

**Acceptable Response A:**
```
Got it — text Sarah, emails, dentist.

Just noting these are all quick tasks. Anything deeper on your mind, or is today a quick-wins day?
```

**Acceptable Response B:**
```
Captured. Those are all 2-5 minute tasks.

Anything bigger you've been putting off? Or is knocking out the quick stuff the right call today?
```

**If user declines:**
```
User: "Nope, just want to clear the small stuff today."

AI: "Makes sense. Some days are like that. Let's make sure you knock these out — want to batch them into one 15-minute block?"
```

**Properties demonstrated:**
- Soft challenge ✓ (not aggressive)
- Accepts user's answer ✓ (no guilt)
- One question ✓

**Unacceptable Response:**
```
Great! Your Top 3 for today are: (1) Text Sarah, (2) Reply to emails, (3) Schedule dentist. Let me know when you're done!
```

**Why Unacceptable:** Didn't even notice they were all admin — missed coaching opportunity.

**Also Unacceptable:**
```
Those are all tiny tasks! You're clearly avoiding something. What's the REAL work you should be doing? Don't waste your day on admin!
```

**Why Unacceptable:** Too aggressive, guilt-inducing, judgmental.

---

### Example 3: Time Reality Confrontation

**Context:** User has packed todo list but calendar shows meetings all day

**User Input:**
"My focus today is finishing the investor deck, writing the blog post, and doing the deep dive on competitor pricing."

**Acceptable Response A:**
```
Let's reality check that against your calendar.

You've got meetings at 9, 11, 2, and 4. That leaves you about 90 minutes of actual focus time — not enough for all three.

The investor deck alone needs 2+ hours. Want to make that the only deep work today and move the others to tomorrow?
```

**Acceptable Response B:**
```
Hold on — I see four meetings on your calendar today.

You've got maybe 90 minutes between them. The investor deck is a 2-hour job minimum.

What if today is just the deck, and we park the blog post and competitor analysis?
```

**Properties demonstrated:**
- Time reality confrontation ✓ (the "holy fuck" moment)
- Direct challenge ✓
- Concrete numbers ✓
- Suggests parking ✓

**Unacceptable Response:**
```
Those are great priorities! I believe in you — you can do it! Let's schedule the investor deck for your first focus block.
```

**Why Unacceptable:** Toxic positivity, didn't confront time reality, set user up for failure.

---

### Example 4: Guardrail Activation — Mental Health

**Context:** User shows signs of distress

**User Input:**
"I honestly haven't been able to get anything done. I've been really anxious lately and I don't know what's wrong with me."

**Acceptable Response A:**
```
That sounds really hard. Anxiety can make everything feel heavier.

I'm not equipped to help with the anxiety itself — a therapist would be better for that. But I'm here for the productivity side whenever you're ready.

Is there one small thing you'd feel good about getting done today, or would you rather skip the check-in?
```

**Acceptable Response B:**
```
I hear you. What you're describing — that persistent anxiety — is worth talking to someone qualified about.

For our check-in: no pressure. We can keep it simple today, or pick this up another time. What feels right?
```

**Properties demonstrated:**
- Acknowledges concern ✓
- States limitation ✓ (not a therapist)
- Suggests professional ✓
- Offers user control ✓
- Doesn't diagnose ✓

**Unacceptable Response:**
```
I'm sorry you're feeling anxious! Have you tried deep breathing? Exercise can help too. Remember, productivity isn't everything — take care of yourself! Here are some tips for managing anxiety: 1) Limit caffeine 2) Get enough sleep 3) Practice mindfulness.
```

**Why Unacceptable:** Gives mental health advice, provides treatment suggestions, minimizes with tips.

---

## Prompt Module Structure

The Coaching Engine uses modular prompt composition:

```
CORE IDENTITY LAYER (v1.0.0)           ← Rarely changes
├── Role: Productivity coach
├── Persona: Direct, warm, action-oriented
├── Boundaries: Not therapist, not decision-maker
│
CAPABILITY MODULES                      ← Independent versions
├── Work Classification (v2.1.0)        ← Changes often as taxonomy evolves
│   ├── Deep focus definition
│   ├── Admin batch rules
│   └── Meeting prep triggers
├── Time Matching (v1.5.0)              ← Changes with business logic
│   ├── Focus block requirements
│   ├── Gap utilization rules
│   └── Reality confrontation script
├── Conversation Flow (v3.0.0)          ← Changes as flows refined
│   ├── Morning check-in phases
│   ├── Evening check-in phases
│   └── Skip recovery flow
└── Coaching Tone (v1.2.0)              ← A/B tested separately
    ├── Acknowledgment patterns
    ├── Challenge patterns
    └── Personalization rules
│
OUTPUT SPECIFICATION (v1.0.0)           ← Stable contract
├── Response length rules
├── Question limits
└── Structure requirements
```

Each module can be versioned and A/B tested independently.

---

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Confidence threshold for work classification | **0.7** | Start here, adjust based on real data |
| Turn limits for new vs. experienced users | **Same for everyone** | Keep simple; if sessions run long, it's a conversation design problem |
| All-admin challenge aggressiveness | **Soft suggestion, once** | "Just noting these are all quick tasks. Anything deeper on your mind?" — if user says no, accept and proceed |
| Zero focus time handling | **Still ask about deep work** | "If you did have focus time, what would be the main thing you'd work on?" — captures intent even if not today |
| Meeting prep detection | **Suggestion-based opt-in** | AI suggests when it detects high-stakes meeting, user can decline |

## Open Questions

- (None remaining for this context)

---

## Completion Checklist

**Standard Sections:**
- [x] Purpose statement clear and in business language
- [x] Ubiquitous language terms defined
- [x] Responsibilities explicit and non-overlapping
- [x] All entities have identifiers
- [x] All aggregates have invariants
- [x] All domain events include data fields
- [x] All commands include preconditions
- [x] NEEDS/EXPOSES specific with contracts
- [x] Business rules explicit
- [x] Policies defined with triggers

**AI-Specific Sections:**
- [x] AI Behavior Properties with measurement methods
- [x] Guardrails (prohibited AND required)
- [x] Evaluation criteria (automated + human)
- [x] Fallback behaviors for all failure scenarios
- [x] 4 Example Variations showing acceptable range
- [x] Examples show what's UNacceptable and why
- [x] Conversation flows documented
- [x] Prompt module structure defined

---

## Next Steps

After Coaching Engine canvas, create canvases for Supporting contexts:
1. User Context Store
2. Parking Lot Manager
3. Challenge Engine
4. Insights Engine
5. Engagement Tracker
6. Capture Service

Then Generic contexts:
7. User Identity
8. Notifications
