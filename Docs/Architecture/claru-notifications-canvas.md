# Bounded Context Canvas: Notifications

> **Repo Path:** `claru/docs/contexts/notifications.md`
> **Related Docs:** 
> - `claru/docs/context-map.md` — Context Boundaries & Relationships

**Context:** Notifications
**Type:** Generic
**Status:** Draft
**Last Updated:** January 2026

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | Notifications |
| **Type** | Generic |
| **AI Involvement** | None |
| **Owner** | Platform team |

**Purpose Statement:**
Delivers push notifications to users — check-in reminders, BPT energy prompts, weekly review nudges. This is infrastructure, not differentiating. Uses platform push services (APNs, FCM) via existing notification libraries.

---

## Ubiquitous Language (This Context Only)

| Term | Meaning in THIS Context |
|------|-------------------------|
| **Notification** | A push message sent to user's device |
| **Scheduled Notification** | A notification set to deliver at a specific time |
| **Prompt** | A notification requesting user action (e.g., energy log) |
| **Reminder** | A notification about a scheduled event (e.g., check-in time) |

---

## Responsibilities

**What this context OWNS:**
- Scheduling notifications for delivery
- Delivering push notifications via platform services
- Managing notification preferences
- Tracking notification delivery status
- Canceling scheduled notifications

**What this context does NOT own:**
- Notification content/copy → Requesting context
- User preferences storage → User Context Store
- Check-in flow → Coaching Engine
- Energy logging → Challenge Engine

---

## Key Entities

| Entity | Description | Key Attributes | Identifier |
|--------|-------------|----------------|------------|
| **ScheduledNotification** | Notification queued for delivery | userId, type, scheduledFor, content, status | notificationId (UUID) |
| **DeviceToken** | User's push token | userId, token, platform (ios/android), updatedAt | tokenId (UUID) |

---

## Value Objects

| Value Object | Description | Attributes |
|--------------|-------------|------------|
| **NotificationContent** | What to show | title, body, action?, data? |
| **DeliveryStatus** | Notification state | status (pending/sent/delivered/failed), sentAt?, error? |

---

## Domain Events Published

| Event Name | Trigger | Data Included | Consumers |
|------------|---------|---------------|-----------|
| **NotificationScheduled** | Notification queued | notificationId, userId, scheduledFor, type | Internal |
| **NotificationSent** | Notification delivered to platform | notificationId, sentAt | Internal |
| **NotificationFailed** | Delivery failed | notificationId, error | Internal (monitoring) |

---

## Commands Accepted

| Command | Actor | Preconditions | Effect | Resulting Event |
|---------|-------|---------------|--------|-----------------|
| **ScheduleNotification** | Any context | User has device token | Queues notification | NotificationScheduled |
| **CancelNotification** | Any context | Notification exists, pending | Removes from queue | NotificationCanceled |
| **SendImmediate** | Any context | User has device token | Sends now | NotificationSent |
| **RegisterDevice** | User (app) | User authenticated | Stores token | DeviceRegistered |
| **UnregisterDevice** | User (app) | Token exists | Removes token | DeviceUnregistered |

---

## Queries Answered

| Query | Input | Output | Used By |
|-------|-------|--------|---------|
| **GetScheduledNotifications** | userId | Pending notifications | Internal |
| **GetDeviceTokens** | userId | Active device tokens | Internal |
| **HasActiveDevice** | userId | Boolean | Other contexts (check before scheduling) |

---

## Interfaces

### NEEDS from Other Contexts

| From Context | What's Needed | Format | Why Needed |
|--------------|---------------|--------|------------|
| **User Identity** | User timezone | Query | Schedule in correct timezone |
| **User Context Store** | Notification preferences | Query | Respect user settings |
| **Engagement Tracker** | Already checked in today? | Query | Don't send reminder if done |

### EXPOSES to Other Contexts

| To Context | What's Exposed | Format | Contract |
|------------|----------------|--------|----------|
| **Challenge Engine** | Energy prompt delivery | Command: ScheduleNotification | Delivers at specified time |
| **Parking Lot Manager** | Weekly review reminder | Command: ScheduleNotification | Sunday morning |
| **Insights Engine** | Weekly report notification | Command: ScheduleNotification | Sunday evening |
| **Coaching Engine** | Check-in reminders | Command: ScheduleNotification | Morning/evening times |

---

## Notification Types

| Type | Triggered By | Content Example | Timing |
|------|--------------|-----------------|--------|
| **morning_reminder** | Daily schedule | "Ready to plan your day?" | User's morning time |
| **evening_reminder** | Daily schedule | "How did today go?" | User's evening time |
| **energy_prompt** | Challenge Engine | "Quick check: energy 1-10?" | Hourly during BPT challenge |
| **weekly_review** | Parking Lot Manager | "Time to review your parking lot" | Sunday 9am |
| **weekly_report** | Insights Engine | "Your weekly report is ready" | Sunday 8pm |
| **welcome_back** | Engagement Tracker | "We missed you! Ready to check in?" | After 3+ day absence |

---

## Business Rules

1. **Respect preferences:** Don't send if user has notifications disabled.
2. **No duplicates:** Don't send same type twice in 30 minutes.
3. **Quiet hours:** No notifications between 10pm-7am (user timezone) unless urgent.
4. **Already done:** Don't send check-in reminder if user already checked in.
5. **Device required:** Cannot schedule without valid device token.
6. **Retry limit:** Max 3 retries on failed delivery, then mark failed.

---

## Policies

| Trigger Event | Action | Conditions |
|---------------|--------|------------|
| User's morning check-in time | Send morning reminder | If not already checked in |
| User's evening check-in time | Send evening reminder | If has morning plan |
| Hourly during BPT challenge | Send energy prompt | If challenge active |
| Sunday 9am | Send weekly review reminder | If has parked items |
| Sunday 8pm | Send weekly report notification | If report ready |
| 3+ days since check-in | Send welcome back | Once per absence |

---

## Implementation Note

**This is a Generic context — use existing solution.**

- **iOS:** APNs via Firebase Cloud Messaging
- **Android:** FCM directly
- **Scheduling:** Use platform job scheduler or cloud function

**DO NOT build custom push infrastructure.**

---

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Push provider | Firebase Cloud Messaging | Cross-platform, reliable |
| Quiet hours | 10pm-7am default | Respect sleep |
| Retry strategy | 3 attempts | Balance persistence with battery |

## Open Questions

- Should quiet hours be user-configurable?
- Should we support notification grouping/bundling?

---

## Completion Checklist

- [x] Purpose statement clear
- [x] Responsibilities explicit
- [x] Domain events documented
- [x] Commands documented
- [x] Queries documented
- [x] Notification types specified
- [x] Business rules documented
- [x] Generic status acknowledged (use existing solution)
