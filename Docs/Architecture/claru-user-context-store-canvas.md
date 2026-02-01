# Bounded Context Canvas: User Context Store

> **Repo Path:** `claru/docs/contexts/user-context-store.md`
> **Related Docs:** 
> - `claru/docs/context-map.md` — Context Boundaries & Relationships
> - `claru/docs/contexts/coaching-engine.md` — Primary consumer

**Context:** User Context Store
**Type:** Supporting
**Status:** Draft
**Last Updated:** January 2026

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | User Context Store |
| **Type** | Supporting |
| **AI Involvement** | None |
| **Owner** | Product team |

**Purpose Statement:**
Stores and retrieves all user data that enables personalized coaching — daily notes, plans, reflections, history, and patterns. Acts as the memory layer that makes Claru feel like it "knows" you over time. The Coaching Engine reads from here to personalize conversations and writes here to persist what was learned.

---

## Ubiquitous Language (This Context Only)

| Term | Meaning in THIS Context |
|------|-------------------------|
| **Daily Note** | A single document per day containing dump, plan, reflection, and outcomes |
| **User Profile** | Persistent user data: name, preferences, timezone, notification settings |
| **Carryover** | Incomplete Top 3 items from yesterday that should surface today |
| **Pattern** | Aggregated trend derived from historical data (e.g., "low energy on Mondays") |
| **Memory Tier** | Classification of data persistence: Working (session), Short-term (week), Long-term (permanent) |
| **Inbox** | Captured items from quick capture that haven't been processed in a check-in |

---

## Responsibilities

**What this context OWNS:**
- Storing and retrieving daily notes (one per day per user)
- Maintaining user profile and preferences
- Calculating carryover items from incomplete plans
- Aggregating patterns from historical data
- Managing inbox items from Capture Service
- Providing context snapshots to Coaching Engine
- Tracking completion status of Top 3 items

**What this context does NOT own:**
- Generating coaching responses → Coaching Engine
- Deciding what to store → Coaching Engine publishes events
- Managing parked items → Parking Lot Manager
- Tracking challenge progress → Challenge Engine
- Calculating habit strength → Engagement Tracker

---

## Key Entities

| Entity | Description | Key Attributes | Identifier |
|--------|-------------|----------------|------------|
| **User** | The person using Claru | name, email, timezone, preferences, createdAt | userId (UUID) |
| **DailyNote** | One document per day | userId, date, dump, plan, reflection, outcomes | date + userId (composite) |
| **InboxItem** | Captured item awaiting processing | userId, text, source, capturedAt, processed | itemId (UUID) |

---

## Value Objects

| Value Object | Description | Attributes |
|--------------|-------------|------------|
| **Plan** | The day's plan | top3[], adminBatch[], focusBlock, meetingPrep[] |
| **Top3Item** | Single priority item | text, workType, completed, completedAt |
| **Reflection** | Evening reflection data | wins[], learnings[], released[] |
| **Outcome** | What actually happened | top3Completed, notes, energyEnd |
| **Preferences** | User settings | checkInTime, eveningTime, notificationsEnabled, voiceEnabled |
| **ContextSnapshot** | Point-in-time data for Coaching Engine | yesterdayPlan, carryover[], recentPatterns[], habitStrength |

---

## Aggregates

| Aggregate Root | Contains | Key Invariants |
|----------------|----------|----------------|
| **User** | Profile, Preferences | Email must be unique. Timezone must be valid. |
| **DailyNote** | Plan, Reflection, Outcome, Dump | One note per user per date. Cannot have reflection without plan. Date cannot be in future. |

### DailyNote States

```
[Created] → [PlanSet] → [ReflectionAdded] → [Completed]
```

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| **Created** | Note exists but empty | → PlanSet |
| **PlanSet** | Morning check-in completed | → ReflectionAdded |
| **ReflectionAdded** | Evening check-in completed | → Completed |
| **Completed** | Day fully documented | (terminal) |

---

## Domain Events Published

| Event Name | Trigger | Data Included | Consumers |
|------------|---------|---------------|-----------|
| **DailyNoteCreated** | First interaction of the day | userId, date | Internal |
| **PlanSaved** | Morning check-in completes | userId, date, top3[], adminBatch[] | Insights Engine |
| **ReflectionSaved** | Evening check-in completes | userId, date, wins[], learnings[] | Insights Engine |
| **Top3ItemCompleted** | User marks item done | userId, date, itemIndex, completedAt | Engagement Tracker, Insights Engine |
| **InboxItemProcessed** | Captured item included in check-in | itemId, destinationType (plan/parked/deleted) | Internal |

---

## Commands Accepted

| Command | Actor | Preconditions | Effect | Resulting Event |
|---------|-------|---------------|--------|-----------------|
| **CreateUser** | System | Email not already registered | Creates user record | UserCreated |
| **UpdatePreferences** | User | User exists | Updates preferences | PreferencesUpdated |
| **SavePlan** | Coaching Engine | User exists, date valid | Creates/updates daily note with plan | PlanSaved |
| **SaveReflection** | Coaching Engine | Plan exists for date | Adds reflection to daily note | ReflectionSaved |
| **MarkTop3Complete** | User | Plan exists, item exists | Marks item completed | Top3ItemCompleted |
| **AddToInbox** | Capture Service | User exists | Creates inbox item | InboxItemAdded |
| **ProcessInboxItem** | Coaching Engine | Item exists, not processed | Marks item processed | InboxItemProcessed |

---

## Queries Answered

| Query | Input | Output | Used By |
|-------|-------|--------|---------|
| **GetUser** | userId | User profile and preferences | All contexts |
| **GetDailyNote** | userId, date | DailyNote or null | Coaching Engine |
| **GetYesterdayContext** | userId | Yesterday's plan, outcomes, carryover | Coaching Engine |
| **GetCarryover** | userId | Incomplete Top 3 from yesterday | Coaching Engine |
| **GetRecentPatterns** | userId, days (default 14) | Aggregated patterns | Coaching Engine, Insights Engine |
| **GetInboxItems** | userId | Unprocessed inbox items | Coaching Engine |
| **GetHistoricalNotes** | userId, dateRange | Array of DailyNotes | Insights Engine |

---

## Interfaces

### NEEDS from Other Contexts

| From Context | What's Needed | Format | Why Needed |
|--------------|---------------|--------|------------|
| **User Identity** | User ID on creation | Event: UserRegistered | Create user record |
| **Coaching Engine** | Plan data | Event: PlanConfirmed | Store the plan |
| **Coaching Engine** | Reflection data | Event: SessionCompleted (evening) | Store reflection |
| **Coaching Engine** | Processed dump data | Event: DumpProcessed | Store for history |
| **Capture Service** | Captured items | Event: CaptureProcessed | Add to inbox |

### EXPOSES to Other Contexts

| To Context | What's Exposed | Format | Contract |
|------------|----------------|--------|----------|
| **Coaching Engine** | Context snapshot | Query: GetYesterdayContext | Returns within 100ms, includes carryover |
| **Coaching Engine** | Inbox items | Query: GetInboxItems | Returns unprocessed items only |
| **Insights Engine** | Historical data | Query: GetHistoricalNotes | Returns up to 90 days |
| **Parking Lot Manager** | User ID reference | Query: GetUser | Basic user data |

---

## Business Rules

### User Rules

1. **Unique email:** Each email can only be associated with one user.
2. **Valid timezone:** Timezone must be a valid IANA timezone string.
3. **Default preferences:** New users get sensible defaults (9am check-in, 6pm evening, notifications on).

### Daily Note Rules

4. **One per day:** Maximum one DailyNote per user per date.
5. **No future dates:** Cannot create notes for future dates.
6. **Plan before reflection:** Cannot add reflection without existing plan.
7. **Immutable history:** Notes older than 7 days cannot be modified (only read).

### Carryover Rules

8. **Auto-calculate carryover:** Incomplete Top 3 items automatically become carryover.
9. **Carryover expiry:** Items that carry over 3+ days get flagged for Coaching Engine to address.
10. **Carryover limit:** Maximum 5 carryover items surfaced (oldest first).

### Inbox Rules

11. **Inbox expiry:** Unprocessed inbox items older than 7 days get auto-archived.
12. **Inbox limit:** Maximum 20 unprocessed items; oldest archived if exceeded.

---

## Policies

| Trigger Event | Action | Conditions |
|---------------|--------|------------|
| PlanSaved | Calculate tomorrow's potential carryover | Always |
| Day changes (midnight) | Archive unprocessed inbox items > 7 days | Daily job |
| UserRegistered | Create user record with defaults | Always |
| Top3ItemCompleted | Update completion stats | Always |

---

## Memory Tier Management

Data is classified into tiers for retention and retrieval:

| Tier | Data Type | Retention | Retrieval Speed |
|------|-----------|-----------|-----------------|
| **Working** | Current session state | Session only | Immediate (in-memory) |
| **Short-term** | Last 14 days of notes | 90 days full, then summarized | Fast (indexed) |
| **Long-term** | User profile, preferences, aggregated patterns | Permanent | Fast (indexed) |
| **Archive** | Notes older than 90 days | Permanent (compressed) | Slow (on-demand) |

### Forgetting Policy

To prevent "context poisoning" from stale data:

- **Preferences:** Superseded when user explicitly updates (old value not retained)
- **Patterns:** Recalculated weekly from last 90 days (older data ages out)
- **Carryover:** Expires after 3 days of carrying over (flagged, then cleared)
- **Inbox:** Auto-archived after 7 days unprocessed

---

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| How long to retain full daily notes? | 90 days full, then summarized | Balance between personalization and storage cost |
| Carryover limit? | 5 items max, 3 days max | Prevent overwhelm, force decisions |
| Inbox auto-archive? | 7 days | If not processed in a week, probably not important |

## Open Questions

- Should users be able to edit historical notes? (Currently: no, immutable after 7 days)
- Should we store raw voice transcripts or just processed text?

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
- [x] Memory tier management defined
