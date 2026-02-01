# Bounded Context Canvas: Engagement Tracker

> **Repo Path:** `claru/docs/contexts/engagement-tracker.md`
> **Related Docs:** 
> - `claru/docs/context-map.md` — Context Boundaries & Relationships
> - `claru/docs/contexts/coaching-engine.md` — Consumes engagement status

**Context:** Engagement Tracker
**Type:** Supporting
**Status:** Draft
**Last Updated:** January 2026

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | Engagement Tracker |
| **Type** | Supporting |
| **AI Involvement** | None (metrics calculation) |
| **Owner** | Product team |

**Purpose Statement:**
Tracks user engagement patterns — check-in completions, streaks, skip patterns, and habit strength. Enables compassionate recovery when users miss days by informing Coaching Engine how to greet returning users. Measures habit formation over time without guilt-inducing metrics.

---

## Ubiquitous Language (This Context Only)

| Term | Meaning in THIS Context |
|------|-------------------------|
| **Check-in** | A completed morning or evening session |
| **Streak** | Consecutive days with at least one check-in |
| **Skip** | A day with no check-ins (not necessarily bad) |
| **Habit Strength** | Score (0-100) measuring how ingrained the check-in habit is |
| **Recovery** | Returning after one or more skipped days |
| **Engagement Window** | The 7-day rolling period used for habit calculation |

---

## Responsibilities

**What this context OWNS:**
- Tracking check-in completion (morning/evening)
- Calculating streaks (without making them punitive)
- Calculating habit strength score
- Detecting skip patterns
- Providing engagement status to Coaching Engine
- Tracking days since last check-in

**What this context does NOT own:**
- Storing session content → User Context Store
- Generating recovery messages → Coaching Engine
- Sending notifications → Notifications
- Analyzing productivity patterns → Insights Engine

---

## Key Entities

| Entity | Description | Key Attributes | Identifier |
|--------|-------------|----------------|------------|
| **EngagementRecord** | User's engagement data | userId, lastCheckIn, currentStreak, habitStrength, checkInHistory[] | userId |
| **DailyEngagement** | One day's engagement | userId, date, morningComplete, eveningComplete | date + userId |

---

## Value Objects

| Value Object | Description | Attributes |
|--------------|-------------|------------|
| **HabitStrength** | Calculated score | score (0-100), trend (improving/stable/declining), daysTracked |
| **EngagementStatus** | Current state for Coaching Engine | daysSinceLastCheckIn, habitStrength, isReturning, skipPattern? |
| **SkipPattern** | Detected skip behavior | type (occasional/weekend/random), avgSkipLength |

---

## Aggregates

| Aggregate Root | Contains | Key Invariants |
|----------------|----------|----------------|
| **EngagementRecord** | DailyEngagement[], HabitStrength | One record per user. Habit strength must be 0-100. Cannot have duplicate daily records. |

---

## Domain Events Published

| Event Name | Trigger | Data Included | Consumers |
|------------|---------|---------------|-----------|
| **CheckInRecorded** | User completes check-in | userId, date, type (morning/evening) | Internal |
| **StreakUpdated** | Streak changes | userId, newStreak, previousStreak | UI (optional display) |
| **HabitStrengthUpdated** | Daily recalculation | userId, newScore, trend | Coaching Engine |
| **UserReturned** | Check-in after 2+ day gap | userId, daysAway, previousHabitStrength | Coaching Engine |
| **SkipPatternDetected** | Pattern identified | userId, patternType | Insights Engine |

---

## Commands Accepted

| Command | Actor | Preconditions | Effect | Resulting Event |
|---------|-------|---------------|--------|-----------------|
| **RecordCheckIn** | Coaching Engine | Session completed | Updates engagement | CheckInRecorded |
| **RecalculateHabitStrength** | System (daily) | User has history | Updates habit score | HabitStrengthUpdated |
| **DetectSkipPatterns** | System (weekly) | User has 14+ days history | Analyzes patterns | SkipPatternDetected (if found) |

---

## Queries Answered

| Query | Input | Output | Used By |
|-------|-------|--------|---------|
| **GetEngagementStatus** | userId | Current engagement status | Coaching Engine |
| **GetHabitStrength** | userId | Habit strength with trend | Coaching Engine, UI |
| **GetStreak** | userId | Current streak count | UI |
| **GetEngagementHistory** | userId, days | Daily engagement for N days | Insights Engine |

---

## Interfaces

### NEEDS from Other Contexts

| From Context | What's Needed | Format | Why Needed |
|--------------|---------------|--------|------------|
| **Coaching Engine** | Session completion signal | Event: SessionCompleted | Record check-in |
| **User Identity** | User timezone | Query | Calculate day boundaries correctly |

### EXPOSES to Other Contexts

| To Context | What's Exposed | Format | Contract |
|------------|----------------|--------|----------|
| **Coaching Engine** | Engagement status | Query: GetEngagementStatus | Includes daysSince, habitStrength, isReturning |
| **Insights Engine** | Engagement history | Query: GetEngagementHistory | Daily records for analysis |
| **UI** | Streak and habit strength | Query: GetStreak, GetHabitStrength | Display metrics |

---

## Business Rules

1. **One check-in per type per day:** Maximum one morning and one evening check-in per day.
2. **Streak = consecutive days:** At least one check-in (morning OR evening) counts as active day.
3. **Habit strength range:** Always 0-100, calculated from rolling 7-day window.
4. **Returning threshold:** 2+ days without check-in = "returning user" flag.
5. **No punishment display:** Streak breaks are not emphasized in UI; habit strength is primary metric.
6. **Timezone awareness:** Day boundaries calculated in user's timezone.

---

## Habit Strength Algorithm

```
Input: Last 7 days of check-in data

Base calculation:
- Each day with morning check-in: +10 points
- Each day with evening check-in: +5 points  
- Maximum per day: 15 points
- Maximum possible: 105 (capped at 100)

Adjustments:
- Consistency bonus: +5 if no skips in 7 days
- Weekend adjustment: Weekend skips don't penalize as heavily (-50% penalty)
- Recovery boost: Returning after skip doesn't reset, just resumes

Trend calculation:
- Compare current 7-day to previous 7-day
- Improving: current > previous + 5
- Declining: current < previous - 5
- Stable: within ±5

Output: { score: 0-100, trend: improving|stable|declining }
```

---

## Compassionate Recovery Design

The engagement system is designed to **welcome users back, not punish them**.

| Scenario | System Behavior | Coaching Engine Receives |
|----------|-----------------|-------------------------|
| 1 day skip | No special handling | Normal status |
| 2-3 day skip | Flag as returning | `isReturning: true, daysAway: 2-3` |
| 4-7 day skip | Flag as returning, preserve habit memory | `isReturning: true, previousHabitStrength` |
| 7+ day skip | Fresh start option | `isReturning: true, offerFreshStart: true` |

**Coaching Engine uses this to adjust tone:**
- "Good to see you back" not "You broke your streak"
- "Let's ease back in" not "You missed 5 days"

---

## Policies

| Trigger Event | Action | Conditions |
|---------------|--------|------------|
| SessionCompleted | Record check-in | Always |
| Midnight (user timezone) | Recalculate habit strength | For users with activity |
| Check-in after 2+ day gap | Emit UserReturned event | Always |
| Weekly | Detect skip patterns | For users with 14+ days history |

---

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Streak vs habit strength priority | Habit strength primary | Streaks create guilt; habit strength is more forgiving |
| Returning threshold | 2+ days | 1 day could be normal weekend; 2+ is meaningful gap |
| Habit window | 7 days | Long enough for pattern, short enough to recover quickly |
| Weekend adjustment | 50% penalty reduction | Many users skip weekends intentionally |

## Open Questions

- Should users be able to hide streak display entirely?
- Should we notify users when habit strength is declining?

---

## Completion Checklist

- [x] Purpose statement clear
- [x] Ubiquitous language defined
- [x] Responsibilities explicit
- [x] All entities have identifiers
- [x] All aggregates have invariants
- [x] Domain events include data fields
- [x] Commands include preconditions
- [x] NEEDS/EXPOSES specific
- [x] Business rules explicit
- [x] Policies defined
- [x] Habit strength algorithm documented
- [x] Compassionate recovery design documented
