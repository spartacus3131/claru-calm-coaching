# Bounded Context Canvas: Challenge Engine

> **Repo Path:** `claru/docs/contexts/challenge-engine.md`
> **Related Docs:** 
> - `claru/docs/context-map.md` — Context Boundaries & Relationships
> - `claru/docs/contexts/coaching-engine.md` — Sends triggers, receives learnings

**Context:** Challenge Engine
**Type:** Supporting
**Status:** Draft
**Last Updated:** January 2026

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | Challenge Engine |
| **Type** | Supporting |
| **AI Involvement** | Consumer (receives triggers), Producer (generates insights) |
| **Owner** | Product team |

**Purpose Statement:**
Manages Chris Bailey's productivity challenges — detecting when to offer them naturally in conversation, tracking progress through active challenges, analyzing results, and integrating learnings (like Biological Prime Time) into the user's profile. Challenges are woven into coaching, not presented as separate exercises.

---

## Ubiquitous Language (This Context Only)

| Term | Meaning in THIS Context |
|------|-------------------------|
| **Challenge** | One of 22 structured productivity exercises from Chris Bailey's framework |
| **Trigger** | A signal from Coaching Engine that a challenge might be relevant |
| **Active Challenge** | A challenge the user has started but not completed |
| **Challenge Learning** | Insight derived from completing a challenge (e.g., BPT hours) |
| **BPT (Biological Prime Time)** | User's peak energy hours, discovered through Prime-Time Challenge |
| **Energy Log** | Single data point: timestamp + energy level (1-10) |
| **Challenge Integration** | How challenge learnings are used in ongoing coaching |

---

## Responsibilities

**What this context OWNS:**
- Storing challenge definitions (the 22 challenges)
- Detecting when to offer challenges based on triggers
- Tracking challenge activation and progress
- Collecting challenge-specific data (e.g., energy logs for BPT)
- Analyzing challenge results
- Generating challenge learnings/insights
- Storing learnings in user's challenge profile
- Providing learnings to Coaching Engine for reference

**What this context does NOT own:**
- Deciding conversation flow → Coaching Engine
- Generating coaching responses → Coaching Engine
- Storing general user history → User Context Store
- Sending notifications → Notifications

---

## Key Entities

| Entity | Description | Key Attributes | Identifier |
|--------|-------------|----------------|------------|
| **Challenge** | Definition of a productivity challenge | name, description, duration, dataRequired, analysisMethod | challengeId (static) |
| **UserChallenge** | User's instance of a challenge | userId, challengeId, status, startedAt, completedAt, data | userChallengeId (UUID) |
| **EnergyLog** | BPT tracking data point | userId, timestamp, energyLevel (1-10), activity? | logId (UUID) |
| **ChallengeLearning** | Insight from completed challenge | userId, challengeId, learningType, value, derivedAt | learningId (UUID) |

---

## Value Objects

| Value Object | Description | Attributes |
|--------------|-------------|------------|
| **BPTResult** | Biological Prime Time analysis | peakHours[], troughHours[], confidence, dataPoints |
| **HighImpactTasks** | From Impact Challenge | tasks[], identifiedAt |
| **UserValues** | From Values Challenge | values[], goalsAligned[] |
| **TriggerContext** | Context when trigger detected | triggerType, userInput, sessionContext |

---

## Aggregates

| Aggregate Root | Contains | Key Invariants |
|----------------|----------|----------------|
| **UserChallenge** | Progress data, collected data points | One active challenge of each type per user. Cannot complete without minimum data. |

### UserChallenge States

```
[Available] → [Offered] → [Active] → [DataCollected] → [Analyzed] → [Completed]
                 ↓
            [Declined]
```

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| **Available** | Challenge not yet offered to user | → Offered |
| **Offered** | Challenge suggested in conversation | → Active, Declined |
| **Declined** | User said no (can re-offer later) | → Offered (after cooldown) |
| **Active** | User accepted, collecting data | → DataCollected |
| **DataCollected** | Minimum data reached | → Analyzed |
| **Analyzed** | Results calculated | → Completed |
| **Completed** | Learning integrated into profile | (terminal for this instance) |

---

## MVP Challenges

| # | Challenge | Trigger | Data Required | Learning Produced |
|---|-----------|---------|---------------|-------------------|
| 1 | **Values Challenge** | Onboarding Day 1 | User answers reflection questions | UserValues |
| 2 | **Impact Challenge** | Onboarding Day 2 | User identifies responsibilities and priorities | HighImpactTasks |
| 3 | **Rule of 3** | Onboarding Day 2+ | (Built into daily flow) | N/A — becomes habit |
| 4 | **Prime-Time Challenge** | Day 3+ or mentions energy | 7+ days of energy logs, 5+ per day | BPTResult |
| 13 | **Capture Challenge** | Week 2 or mentions overwhelm | User completes full brain dump | N/A — skill practice |

---

## Domain Events Published

| Event Name | Trigger | Data Included | Consumers |
|------------|---------|---------------|-----------|
| **ChallengeOffered** | Trigger detected, challenge surfaced | userId, challengeId, triggerContext | Internal |
| **ChallengeActivated** | User accepts challenge | userId, challengeId, startedAt | User Context Store |
| **ChallengeDeclined** | User declines challenge | userId, challengeId, reason? | Internal |
| **EnergyLogRecorded** | User logs energy level | userId, timestamp, level, activity? | Internal |
| **ChallengeDataCollected** | Minimum data threshold reached | userId, challengeId, dataPoints | Internal |
| **ChallengeAnalyzed** | Results calculated | userId, challengeId, results | Internal |
| **LearningIntegrated** | Learning added to profile | userId, learningType, value | Coaching Engine, User Context Store |

---

## Commands Accepted

| Command | Actor | Preconditions | Effect | Resulting Event |
|---------|-------|---------------|--------|-----------------|
| **DetectChallengeTrigger** | Coaching Engine | Trigger context provided | Evaluates if challenge should be offered | ChallengeOffered (if match) |
| **ActivateChallenge** | User (via Coaching Engine) | Challenge offered, not already active | Starts challenge | ChallengeActivated |
| **DeclineChallenge** | User (via Coaching Engine) | Challenge offered | Marks declined, sets cooldown | ChallengeDeclined |
| **LogEnergy** | User/Notification | BPT challenge active | Records energy data point | EnergyLogRecorded |
| **AnalyzeChallenge** | System | Minimum data collected | Calculates results | ChallengeAnalyzed |
| **IntegrateLearning** | System | Challenge analyzed | Adds learning to profile | LearningIntegrated |

---

## Queries Answered

| Query | Input | Output | Used By |
|-------|-------|--------|---------|
| **GetActiveChallenges** | userId | Array of active UserChallenges | Coaching Engine |
| **GetChallengeLearnings** | userId | All learnings (BPT, values, high-impact) | Coaching Engine |
| **GetBPT** | userId | BPTResult or null | Coaching Engine |
| **GetEnergyLogs** | userId, dateRange | Array of EnergyLogs | Internal analysis |
| **GetChallengeStatus** | userId, challengeId | UserChallenge status | Coaching Engine |

---

## Interfaces

### NEEDS from Other Contexts

| From Context | What's Needed | Format | Why Needed |
|--------------|---------------|--------|------------|
| **Coaching Engine** | Trigger signals | Event: ChallengeTriggerDetected | Know when to offer challenges |
| **Coaching Engine** | User acceptance/decline | Command: ActivateChallenge/DeclineChallenge | Track status |
| **Notifications** | Energy prompt delivery | Request: SendEnergyPrompt | BPT data collection |
| **User Context Store** | User profile | Query: GetUser | Associate data with user |

### EXPOSES to Other Contexts

| To Context | What's Exposed | Format | Contract |
|------------|----------------|--------|----------|
| **Coaching Engine** | Challenge learnings | Query: GetChallengeLearnings | Returns all learnings for user |
| **Coaching Engine** | BPT data | Query: GetBPT | Returns peak/trough hours if available |
| **Coaching Engine** | Active challenges | Query: GetActiveChallenges | Returns in-progress challenges |
| **User Context Store** | Learning integration | Event: LearningIntegrated | Permanent storage of learnings |

---

## Business Rules

### Challenge Offering Rules

1. **One active per type:** Cannot have multiple active instances of the same challenge.
2. **Decline cooldown:** After declining, don't re-offer same challenge for 7 days.
3. **Natural integration:** Challenges are offered conversationally, not as pop-ups.
4. **Context relevance:** Only offer challenges when trigger context is strong match.

### BPT Challenge Rules

5. **Minimum data:** Need 7+ days of data with 5+ logs per day to analyze.
6. **Sufficient variance:** Need logs across different times of day.
7. **Recency weight:** Recent data weighted more heavily in analysis.
8. **Confidence threshold:** Only report BPT if confidence > 0.7.

### Learning Integration Rules

9. **Learnings are permanent:** Once integrated, learnings persist (can be updated, not deleted).
10. **Learning reference:** Coaching Engine should reference learnings naturally.
11. **Learning refresh:** BPT can be re-measured if user requests (new challenge instance).

---

## Policies

| Trigger Event | Action | Conditions |
|---------------|--------|------------|
| ChallengeTriggerDetected | Evaluate challenge offering | If no active challenge of that type |
| EnergyLogRecorded | Check if minimum data reached | If BPT challenge active |
| ChallengeDataCollected | Trigger analysis | Always |
| ChallengeAnalyzed | Integrate learning | If confidence > threshold |
| 7 days since decline | Reset decline cooldown | Per challenge type |

---

## Trigger Detection Logic

| Trigger Type | Detection Signal | Challenge to Offer |
|--------------|------------------|-------------------|
| **Onboarding Day 1** | First session ever | Values Challenge |
| **Onboarding Day 2** | Second day, values complete | Impact Challenge |
| **Energy mention** | User says "tired", "exhausted", "low energy", "when should I..." | Prime-Time Challenge |
| **Overwhelm mention** | User says "overwhelmed", "too much", "can't keep track" | Capture Challenge |
| **Scattered mention** | User says "scattered", "all over the place", "can't focus" | Prime-Time or Capture |
| **Week 2 milestone** | 7 days of check-ins completed | Capture Challenge (if not done) |

---

## BPT Analysis Algorithm

```
Input: EnergyLogs[] (7+ days, 5+ per day)

1. Group logs by hour of day
2. Calculate average energy per hour
3. Apply recency weighting (last 3 days = 2x weight)
4. Identify peak hours (top 20% of averages)
5. Identify trough hours (bottom 20% of averages)
6. Calculate confidence based on data consistency
7. Return BPTResult if confidence > 0.7

Output: {
  peakHours: ["9:00-11:00", "14:00-15:00"],
  troughHours: ["13:00-14:00", "16:00-17:00"],
  confidence: 0.82,
  dataPoints: 47
}
```

---

## AI Behavior Properties (for Challenge Insights)

| Property | Specification | How to Measure |
|----------|---------------|----------------|
| **BPT Reference** | Reference user's BPT naturally in coaching when relevant | Human evaluation |
| **Learning Integration** | Weave learnings into advice without being preachy | Human evaluation |
| **Challenge Offering** | Soft suggestion, not pushy | Acceptance rate |

---

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| BPT minimum data | 7 days, 5 logs/day | Balance accuracy with user patience |
| Decline cooldown | 7 days | Long enough to not annoy, short enough to re-engage |
| BPT confidence threshold | 0.7 | High enough to be useful, achievable with good data |

## Open Questions

- Should BPT prompts be push notifications or in-app only?
- How often can a user re-take the BPT challenge? (Currently: anytime on request)

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
- [x] AI Behavior Properties for insight delivery
- [x] Trigger detection logic documented
- [x] BPT analysis algorithm specified
