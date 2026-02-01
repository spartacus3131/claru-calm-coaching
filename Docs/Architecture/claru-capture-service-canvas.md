# Bounded Context Canvas: Capture Service

> **Repo Path:** `claru/docs/contexts/capture-service.md`
> **Related Docs:** 
> - `claru/docs/context-map.md` — Context Boundaries & Relationships
> - `claru/docs/contexts/user-context-store.md` — Receives processed captures

**Context:** Capture Service
**Type:** Supporting
**Status:** Draft
**Last Updated:** January 2026

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | Capture Service |
| **Type** | Supporting |
| **AI Involvement** | Consumer (light processing for voice-to-text) |
| **Owner** | Platform team |

**Purpose Statement:**
Enables quick brain dump capture outside of check-in flows. Users can capture thoughts anytime via voice or text, which get queued in an inbox for processing during the next check-in. Minimizes friction for the core GTD principle: get it out of your head immediately.

---

## Ubiquitous Language (This Context Only)

| Term | Meaning in THIS Context |
|------|-------------------------|
| **Capture** | A quick note taken outside of check-in flow |
| **Inbox** | Queue of unprocessed captures awaiting check-in |
| **Quick Capture** | The fast-entry UI/voice interface |
| **Processing** | Moving a capture into the daily plan or parking lot |

---

## Responsibilities

**What this context OWNS:**
- Providing quick capture interface (text and voice)
- Voice-to-text transcription
- Storing captures in user's inbox
- Surfacing inbox items to Coaching Engine during check-in
- Tracking capture status (unprocessed/processed)

**What this context does NOT own:**
- Processing captures into plans → Coaching Engine
- Storing processed items long-term → User Context Store
- Deciding what to do with captures → Coaching Engine
- Managing deferred items → Parking Lot Manager

---

## Key Entities

| Entity | Description | Key Attributes | Identifier |
|--------|-------------|----------------|------------|
| **CaptureItem** | A single captured thought | userId, text, capturedAt, source (voice/text), processed, processedAt? | captureId (UUID) |

---

## Value Objects

| Value Object | Description | Attributes |
|--------------|-------------|------------|
| **VoiceInput** | Raw voice recording | audioData, duration, transcribedText, confidence |
| **CaptureSource** | How item was captured | type (voice/text/widget), deviceType, timestamp |

---

## Aggregates

| Aggregate Root | Contains | Key Invariants |
|----------------|----------|----------------|
| **CaptureItem** | CaptureSource | Must have non-empty text. CapturedAt must be in past. Cannot process already-processed item. |

### CaptureItem States

```
[Captured] → [Processed]
```

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| **Captured** | In inbox, awaiting processing | → Processed |
| **Processed** | Included in check-in (plan or parked) | (terminal) |

---

## Domain Events Published

| Event Name | Trigger | Data Included | Consumers |
|------------|---------|---------------|-----------|
| **CaptureReceived** | User captures something | userId, captureId, text, source | User Context Store |
| **VoiceTranscribed** | Voice converted to text | captureId, transcribedText, confidence | Internal |
| **CaptureProcessed** | Item included in check-in | captureId, destination (plan/parked/deleted) | User Context Store |

---

## Commands Accepted

| Command | Actor | Preconditions | Effect | Resulting Event |
|---------|-------|---------------|--------|-----------------|
| **CaptureText** | User | User authenticated | Creates capture item | CaptureReceived |
| **CaptureVoice** | User | User authenticated | Transcribes and creates capture | VoiceTranscribed, CaptureReceived |
| **MarkProcessed** | Coaching Engine | Capture exists, unprocessed | Updates status | CaptureProcessed |
| **DeleteCapture** | User | Capture exists | Removes capture | CaptureDeleted |

---

## Queries Answered

| Query | Input | Output | Used By |
|-------|-------|--------|---------|
| **GetInbox** | userId | Unprocessed captures | Coaching Engine |
| **GetInboxCount** | userId | Number of unprocessed items | UI (badge) |
| **GetCapture** | captureId | Single capture item | Internal |

---

## Interfaces

### NEEDS from Other Contexts

| From Context | What's Needed | Format | Why Needed |
|--------------|---------------|--------|------------|
| **User Identity** | User authentication | Token | Verify user |
| **Coaching Engine** | Processing confirmation | Command: MarkProcessed | Update status |

### EXPOSES to Other Contexts

| To Context | What's Exposed | Format | Contract |
|------------|----------------|--------|----------|
| **Coaching Engine** | Inbox items | Query: GetInbox | Returns unprocessed only |
| **User Context Store** | Capture events | Event: CaptureReceived | For history |
| **UI** | Inbox count | Query: GetInboxCount | For badge display |

---

## Business Rules

1. **Non-empty text:** Captures must have at least 1 character of text.
2. **Auto-trim:** Whitespace trimmed from start/end.
3. **Voice fallback:** If transcription fails, save audio reference for manual entry.
4. **Inbox limit:** Maximum 20 unprocessed items. Warn user at 15.
5. **Auto-cleanup:** Unprocessed captures older than 14 days get archived (not deleted).
6. **Idempotent processing:** MarkProcessed is idempotent (safe to call multiple times).

---

## Policies

| Trigger Event | Action | Conditions |
|---------------|--------|------------|
| CaptureReceived | Update inbox count | Always |
| VoiceTranscribed with low confidence | Flag for review | If confidence < 0.7 |
| Daily cleanup | Archive captures > 14 days | Unprocessed only |
| Inbox reaches 15 items | Warn user | Via notification |
| Inbox reaches 20 items | Block new captures until processed | Show message |

---

## Voice Transcription

| Property | Specification |
|----------|---------------|
| **Provider** | Whisper API (or similar) |
| **Max duration** | 60 seconds |
| **Confidence threshold** | 0.7 for auto-accept, below = flag |
| **Fallback** | Store audio, prompt for text entry |
| **Latency target** | < 3 seconds for transcription |

---

## UI Entry Points

| Entry Point | Behavior |
|-------------|----------|
| **Home screen widget** | One-tap voice capture |
| **App quick action** | Long-press app icon → capture |
| **In-app floating button** | Always visible capture button |
| **Share extension** | Share text from other apps → capture |

---

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Inbox limit | 20 items | Prevent hoarding; forces processing |
| Auto-archive threshold | 14 days | If not processed in 2 weeks, probably not important |
| Voice max duration | 60 seconds | Captures should be quick; longer = should use check-in |

## Open Questions

- Should we support image capture (photos of whiteboards, etc.)?
- Should captures have optional tags/categories?

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
- [x] Voice transcription spec documented
