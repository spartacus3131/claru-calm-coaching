# Bounded Context Canvas: Insights Engine

> **Repo Path:** `claru/docs/contexts/insights-engine.md`
> **Related Docs:** 
> - `claru/docs/context-map.md` — Context Boundaries & Relationships
> - `claru/docs/contexts/user-context-store.md` — Primary data source

**Context:** Insights Engine
**Type:** Supporting
**Status:** Draft
**Last Updated:** January 2026

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | Insights Engine |
| **Type** | Supporting |
| **AI Involvement** | Producer (generates insights from patterns) |
| **Owner** | Product team |

**Purpose Statement:**
Analyzes user patterns over time to generate actionable insights — completion rates, energy correlations, work type trends, and personalized observations. Produces weekly reports and feeds pattern data to Coaching Engine for real-time reference. Helps users understand themselves better.

---

## Ubiquitous Language (This Context Only)

| Term | Meaning in THIS Context |
|------|-------------------------|
| **Insight** | An actionable observation derived from user data patterns |
| **Pattern** | A recurring trend in user behavior (e.g., "low completion on Fridays") |
| **Weekly Report** | Summary of the week's productivity patterns and insights |
| **Correlation** | Relationship between two factors (e.g., energy level → completion rate) |
| **Chronic Carryover** | Items that carry over 3+ days repeatedly |

---

## Responsibilities

**What this context OWNS:**
- Analyzing historical data for patterns
- Generating insights from patterns
- Producing weekly reports
- Detecting chronic carryover situations
- Calculating completion rates and trends
- Correlating energy data with outcomes
- Providing pattern summaries to Coaching Engine

**What this context does NOT own:**
- Storing raw daily notes → User Context Store
- Real-time coaching responses → Coaching Engine
- Challenge-specific analysis (BPT) → Challenge Engine
- Habit strength calculation → Engagement Tracker

---

## Key Entities

| Entity | Description | Key Attributes | Identifier |
|--------|-------------|----------------|------------|
| **UserInsightProfile** | Aggregated insights for a user | userId, patterns[], insights[], lastAnalyzedAt | userId |
| **WeeklyReport** | One report per week | userId, weekStartDate, metrics, insights[], generatedAt | reportId (UUID) |
| **Pattern** | Detected behavioral pattern | userId, patternType, data, confidence, firstDetectedAt | patternId (UUID) |

---

## Value Objects

| Value Object | Description | Attributes |
|--------------|-------------|------------|
| **Insight** | Single insight | type, description, evidence[], actionSuggestion?, confidence |
| **WeekMetrics** | Week's numbers | top3CompletionRate, checkInCount, avgEnergy, workTypeDistribution |
| **Correlation** | Two-factor relationship | factorA, factorB, correlationStrength, sampleSize |
| **CarryoverAlert** | Chronic carryover detection | itemText, dayCount, occurrences |

---

## Aggregates

| Aggregate Root | Contains | Key Invariants |
|----------------|----------|----------------|
| **UserInsightProfile** | Patterns[], recent Insights[] | One profile per user. Patterns require minimum 3 data points. Insights must have evidence. |
| **WeeklyReport** | WeekMetrics, Insights[], Correlations[] | One report per user per week. Cannot generate for incomplete weeks. |

---

## Domain Events Published

| Event Name | Trigger | Data Included | Consumers |
|------------|---------|---------------|-----------|
| **PatternDetected** | Analysis finds new pattern | userId, patternType, data, confidence | Coaching Engine |
| **WeeklyReportReady** | Report generated | userId, reportId, weekStartDate | Notifications, UI |
| **ChronicCarryoverDetected** | Item carries 3+ days, 2+ times | userId, itemPattern, occurrences | Coaching Engine |
| **InsightGenerated** | New actionable insight | userId, insight | Coaching Engine |

---

## Commands Accepted

| Command | Actor | Preconditions | Effect | Resulting Event |
|---------|-------|---------------|--------|-----------------|
| **AnalyzeUserPatterns** | System (scheduled) | User has 7+ days of data | Updates UserInsightProfile | PatternDetected (if new) |
| **GenerateWeeklyReport** | System (Sunday evening) | Week is complete | Creates WeeklyReport | WeeklyReportReady |
| **CheckCarryoverPatterns** | System (daily) | User has plan data | Scans for chronic carryover | ChronicCarryoverDetected (if found) |
| **RequestInsights** | User/Coaching Engine | Profile exists | Returns current insights | (query response) |

---

## Queries Answered

| Query | Input | Output | Used By |
|-------|-------|--------|---------|
| **GetUserInsights** | userId | Current insights and patterns | Coaching Engine |
| **GetWeeklyReport** | userId, weekStartDate | Full weekly report | UI, Coaching Engine |
| **GetCompletionTrend** | userId, days | Completion rate over time | UI |
| **GetWorkTypeDistribution** | userId, days | Deep/Admin/Meeting breakdown | UI |
| **GetCorrelations** | userId | Detected correlations | Coaching Engine |

---

## Interfaces

### NEEDS from Other Contexts

| From Context | What's Needed | Format | Why Needed |
|--------------|---------------|--------|------------|
| **User Context Store** | Historical daily notes | Query: GetHistoricalData | Pattern analysis input |
| **Challenge Engine** | BPT data, energy logs | Query: GetEnergyLogs | Energy correlations |
| **Engagement Tracker** | Check-in history | Query: GetEngagementHistory | Engagement correlations |

### EXPOSES to Other Contexts

| To Context | What's Exposed | Format | Contract |
|------------|----------------|--------|----------|
| **Coaching Engine** | Patterns and insights | Query: GetUserInsights | Returns patterns with confidence > 0.6 |
| **Coaching Engine** | Carryover alerts | Event: ChronicCarryoverDetected | Includes item pattern, count |
| **Notifications** | Weekly report ready | Event: WeeklyReportReady | Triggers notification |
| **UI** | Reports and trends | Query: GetWeeklyReport, GetCompletionTrend | Full data for display |

---

## Business Rules

1. **Minimum data:** Need 7+ days of data before generating patterns.
2. **Pattern confidence:** Only surface patterns with confidence > 0.6.
3. **Insight evidence:** Every insight must cite specific data points as evidence.
4. **Weekly report timing:** Generate Sunday 8pm user timezone.
5. **Chronic carryover:** Flag items that carry over 3+ consecutive days, occurring 2+ times.
6. **Correlation threshold:** Only report correlations with r > 0.5 and n > 10.
7. **Recency weighting:** Last 14 days weighted 2x in pattern detection.

---

## Policies

| Trigger Event | Action | Conditions |
|---------------|--------|------------|
| Sunday 8pm (user timezone) | Generate weekly report | If user has 3+ days this week |
| PlanSaved (from User Context Store) | Check for chronic carryover | If item appeared before |
| Daily 2am | Run pattern analysis | For users with new data |
| User reaches 14 days | Generate first insights | One-time trigger |

---

## Pattern Types

| Pattern Type | Detection Logic | Example Insight |
|--------------|-----------------|-----------------|
| **Day-of-week completion** | Completion rate by weekday | "You complete 40% less on Fridays" |
| **Work type avoidance** | Deep work planned but not done | "Deep work is planned but often pushed" |
| **Morning vs afternoon** | Completion by time of day | "Your morning items get done 80% of the time" |
| **Energy-completion correlation** | Energy level → completion rate | "Days you report 7+ energy, you complete 90%" |
| **Chronic carryover** | Same item carrying repeatedly | "The investor deck has carried over 5 times" |
| **Overplanning** | Top 3 rarely all complete | "You complete 1.8 of your Top 3 on average" |

---

## Weekly Report Structure

```
Weekly Report: [Week of Date]

📊 METRICS
- Top 3 Completion: X% (up/down from last week)
- Check-ins Completed: X of 7 morning, X of 7 evening
- Average Energy: X.X
- Work Type Split: X% deep, X% admin, X% meetings

💡 INSIGHTS
- [Insight 1 with evidence]
- [Insight 2 with evidence]

🎯 SUGGESTION
- [One actionable recommendation]

📈 TREND
- [Comparison to previous 4 weeks]
```

---

## AI Behavior Properties (for Insight Generation)

| Property | Specification | How to Measure |
|----------|---------------|----------------|
| **Evidence-based** | Every insight cites specific data | Human review |
| **Actionable** | Insights include what to do about it | Contains action suggestion |
| **Non-judgmental** | Observations, not criticisms | Tone check |
| **Concise** | One sentence per insight | Length check |

---

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Minimum data for patterns | 7 days | Enough for weekly patterns, not too long to wait |
| Pattern confidence threshold | 0.6 | Balance signal vs noise |
| Weekly report timing | Sunday 8pm | End of week, before planning next week |
| Chronic carryover threshold | 3 days, 2 occurrences | Catch real patterns, not one-offs |

## Open Questions

- Should users be able to dismiss/hide specific insights?
- Should we compare user to anonymized cohort ("You complete 20% more than average")?

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
- [x] Pattern types documented
- [x] Report structure defined
