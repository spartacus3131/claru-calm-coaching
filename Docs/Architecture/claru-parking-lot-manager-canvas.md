# Bounded Context Canvas: Parking Lot Manager

> **Repo Path:** `claru/docs/contexts/parking-lot-manager.md`
> **Related Docs:** 
> - `claru/docs/context-map.md` — Context Boundaries & Relationships
> - `claru/docs/contexts/coaching-engine.md` — Sends park requests, receives resurface suggestions

**Context:** Parking Lot Manager
**Type:** Supporting
**Status:** Draft
**Last Updated:** January 2026

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | Parking Lot Manager |
| **Type** | Supporting |
| **AI Involvement** | Consumer (receives items), Producer (resurface suggestions) |
| **Owner** | Product team |

**Purpose Statement:**
Manages deferred items — things that are real but not for today. Handles the "someday/maybe" list so users can get items out of their head without losing them. Triggers weekly reviews and suggests reactivation when context makes an item relevant again.

---

## Ubiquitous Language (This Context Only)

| Term | Meaning in THIS Context |
|------|-------------------------|
| **Parked Item** | A task/idea deferred from daily planning to the parking lot |
| **Parking** | The act of deferring an item (not deleting, not scheduling) |
| **Reactivation** | Moving a parked item back into active planning |
| **Weekly Review** | Scheduled review of all parked items |
| **Resurface** | AI-triggered suggestion to reactivate based on context match |
| **Stale Item** | Parked item not reviewed in 30+ days |

---

## Responsibilities

**What this context OWNS:**
- Storing parked items with metadata (when parked, why, source)
- Triggering weekly review flow
- Detecting when parked items become relevant (resurface logic)
- Tracking item age and staleness
- Providing parked item summaries
- Managing item lifecycle (park → review → reactivate/delete/keep)

**What this context does NOT own:**
- Deciding what to park → User via Coaching Engine
- Generating coaching responses about parking → Coaching Engine
- Storing completed tasks → User Context Store
- Daily task management → User Context Store

---

## Key Entities

| Entity | Description | Key Attributes | Identifier |
|--------|-------------|----------------|------------|
| **ParkedItem** | A deferred task or idea | userId, text, parkedAt, source, reason?, project?, tags[], lastReviewedAt | itemId (UUID) |
| **WeeklyReview** | Record of a review session | userId, reviewDate, itemsReviewed, itemsReactivated, itemsDeleted | reviewId (UUID) |

---

## Value Objects

| Value Object | Description | Attributes |
|--------------|-------------|------------|
| **ParkingContext** | Why item was parked | reason, originalDate, sourceSession |
| **ResurfaceSignal** | Why item might be relevant now | triggerType, matchedContext, confidence |

---

## Aggregates

| Aggregate Root | Contains | Key Invariants |
|----------------|----------|----------------|
| **ParkedItem** | ParkingContext, tags | Item must have text. ParkedAt must be in past. Cannot park same item twice (dedupe by text similarity). |

### ParkedItem States

```
[Parked] → [UnderReview] → [Reactivated] or [Kept] or [Deleted]
                              ↓
                         (exits parking lot)
```

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| **Parked** | Item in parking lot | → UnderReview |
| **UnderReview** | Being reviewed (weekly or resurface) | → Reactivated, Kept, Deleted |
| **Reactivated** | Moved back to active planning | (exits to Coaching Engine) |
| **Kept** | Reviewed but stays parked | → UnderReview (next review) |
| **Deleted** | User decided it's not needed | (terminal) |

---

## Domain Events Published

| Event Name | Trigger | Data Included | Consumers |
|------------|---------|---------------|-----------|
| **ItemParked** | User parks item via Coaching Engine | userId, itemId, text, reason | Internal |
| **WeeklyReviewTriggered** | Sunday arrives (user's timezone) | userId, itemCount | Notifications, Coaching Engine |
| **ItemResurfaceSuggested** | Context match detected | userId, itemId, resurfaceSignal | Coaching Engine |
| **ItemReactivated** | User reactivates item | userId, itemId, destinationDate | User Context Store |
| **ItemDeleted** | User deletes from parking lot | userId, itemId | Internal |
| **WeeklyReviewCompleted** | User finishes review | userId, reviewId, stats | Insights Engine |

---

## Commands Accepted

| Command | Actor | Preconditions | Effect | Resulting Event |
|---------|-------|---------------|--------|-----------------|
| **ParkItem** | Coaching Engine | User exists, item has text | Creates parked item | ItemParked |
| **TriggerWeeklyReview** | System (scheduler) | It's Sunday in user's timezone | Starts review flow | WeeklyReviewTriggered |
| **ReactivateItem** | User via Coaching Engine | Item exists, is parked | Moves item to active | ItemReactivated |
| **KeepParked** | User via Coaching Engine | Item under review | Updates lastReviewedAt | ItemKept |
| **DeleteItem** | User via Coaching Engine | Item exists | Removes item | ItemDeleted |
| **CheckForResurface** | Coaching Engine | Session in progress | Checks for context matches | ItemResurfaceSuggested (if match) |

---

## Queries Answered

| Query | Input | Output | Used By |
|-------|-------|--------|---------|
| **GetParkedItems** | userId | All parked items | Coaching Engine, UI |
| **GetStaleItems** | userId, daysSinceReview | Items not reviewed in N days | Weekly review |
| **GetRelevantParked** | userId, currentContext | Items matching context | Coaching Engine |
| **GetParkingStats** | userId | Count, oldest item, avg age | Insights Engine |

---

## Interfaces

### NEEDS from Other Contexts

| From Context | What's Needed | Format | Why Needed |
|--------------|---------------|--------|------------|
| **Coaching Engine** | Park requests | Event: ParkItemRequested | Know what to park |
| **Coaching Engine** | Current session context | Query param | Resurface matching |
| **User Identity** | User timezone | Query | Schedule weekly review correctly |

### EXPOSES to Other Contexts

| To Context | What's Exposed | Format | Contract |
|------------|----------------|--------|----------|
| **Coaching Engine** | Parked items | Query: GetParkedItems | Returns all with metadata |
| **Coaching Engine** | Resurface suggestions | Event: ItemResurfaceSuggested | Includes confidence score |
| **Notifications** | Weekly review trigger | Event: WeeklyReviewTriggered | Fires Sunday morning |
| **User Context Store** | Reactivated items | Event: ItemReactivated | Item returns to active planning |

---

## Business Rules

1. **No duplicates:** Cannot park item with >90% text similarity to existing parked item.
2. **Weekly review required:** Every parked item must be reviewed at least once per 30 days.
3. **Stale warning:** Items not reviewed in 30+ days get flagged.
4. **Auto-resurface:** If item matches current context with confidence >0.7, suggest reactivation.
5. **Parking lot limit:** Maximum 50 parked items. At limit, force review before new parks.
6. **Soft delete:** Deleted items retained 7 days (can undo), then hard deleted.

---

## Policies

| Trigger Event | Action | Conditions |
|---------------|--------|------------|
| Sunday 9am (user timezone) | Trigger weekly review | If parked items exist |
| Session started | Check for resurface matches | If parked items exist |
| ItemParked | Check for duplicates | Always |
| Parking lot at 50 items | Block new parks, prompt review | Until count reduced |
| Item reaches 30 days unreviewed | Add to "stale" list | On daily check |

---

## Resurface Logic

```
Input: currentContext (from Coaching Engine), parkedItems[]

For each parkedItem:
  1. Text similarity to current dump content
  2. Project match (if item has project, user mentions project)
  3. Keyword match (tags, key terms)
  4. Time relevance (item mentions timeframe that's now relevant)

Calculate confidence score (0-1)
If confidence > 0.7: emit ItemResurfaceSuggested

Example triggers:
- Parked "prepare board deck" + user mentions "board meeting next week" → resurface
- Parked "research competitors" + user working on "Q1 Roadmap" project → resurface
```

---

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Parking lot limit | 50 items | Forces discipline, prevents dumping ground |
| Stale threshold | 30 days | Monthly review cadence |
| Resurface confidence | 0.7 | High enough to be relevant, not annoying |
| Duplicate threshold | 90% similarity | Catch true duplicates, allow variations |

## Open Questions

- Should weekly review be Sunday or user-configurable day?
- Should resurface suggestions interrupt check-in flow or wait until end?

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
- [x] Resurface logic documented
