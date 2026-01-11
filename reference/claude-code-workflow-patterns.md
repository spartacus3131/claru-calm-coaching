# Claude Code Workflow Patterns for Claru

> Extracted from real daily check-in sessions. This is the "brain" Claru needs to replicate.

---

## Core Value Proposition

**What makes this workflow work:** The conversational back-and-forth. Not just dumping info, but:
1. User shares messy thoughts
2. AI structures and summarizes
3. AI asks clarifying question or suggests prioritization
4. User confirms/adjusts
5. AI commits to daily note and confirms what was captured
6. Repeat until aligned

This iterative dialogue is the magic. The AI is a thinking partner, not just a transcription tool.

---

## Three Core Features

### 1. Projects (User-Created)
Users create their own projects for things they're working on consistently.

**Examples:**
- "Shipping Claru" (active project)
- "Accountally Revenue Push" (active project)
- "Workout Plan" (recurring)
- "Diet Tracking" (recurring)

**Per project, track:**
- Title
- Status (active / paused / completed)
- Current blockers
- Next actions
- Notes/context

**Integration:** Morning check-in shows active projects, prompts for updates on each.

---

### 2. Daily Notes (One Per Day, Stored, Editable)

**Structure:**
```markdown
# YYYY-MM-DD

## Morning Brain Dump
### Raw Dump
[Messy thoughts captured verbatim]

## Today's Top 3 (Highest Impact)
1. [ ]
2. [ ]
3. [ ]

## Organized Tasks
### Actions (Do Today)
### Waiting On / Blocked
### Quick Wins (< 5 min)

## Captured for Later
### Parking Lot
### Notes / Thoughts

## End of Day
### What got done?
### What's carrying over? Why?
### Any wins or insights?
```

**Key behaviors:**
- Note is created automatically for each day
- Updated in real-time during conversation (not just at end)
- User can edit directly (full markdown editor)
- Historical notes are viewable/searchable

---

### 3. Morning & Evening Check-ins

#### Morning Check-in Flow

**Trigger:** "Fire up the pod" / "Daily check-in" / Start Session button

**Step 1 - Status Overview:**
```
**Session fired up!**

**Today's Status (Jan X, 2026):**
- Daily note ready (empty/has carryover)

**Your Active Projects:**
1. [Project] - [Status/Blocker]
2. [Project] - [Status/Blocker]

**Carrying Over from Yesterday:**
- [Incomplete item]

Ready for the brain dump. What's on your mind?
```

**Step 2 - Brain Dump:**
User shares stream of consciousness (voice or text, messy is fine).

**Step 3 - AI Structures & Confirms:**
```
Got it. Let me capture that.

**[Project Name]:**
- [Extracted item 1]
- [Extracted item 2]

**Today's Focus:**
- [Time-bound task] (until X)
- [Later task]

**Suggested Top 3:**
1. [Most important]
2. [Second]
3. [Third]

Does this priority order feel right? Anything I should move around?
```

**Step 4 - Clarification Loop:**
- User adjusts: "Actually, swap 1 and 2"
- AI confirms: "Done. Updated your daily note. Anything else before you dive in?"

**Step 5 - Commit & Go:**
```
Captured in today's note:
- Raw dump saved
- Top 3 set
- Tasks organized

You're all set. Go crush it.
```

#### Evening Check-in Flow

**Trigger:** "End of day" / "Mischief managed" / Evening button

**Step 1 - Review:**
```
**End of Day Check-in**

**Your Top 3 today:**
1. [x] [Completed item]
2. [ ] [Incomplete item]
3. [x] [Completed item]

What got done? What's carrying over?
```

**Step 2 - User reflects** (voice or text)

**Step 3 - AI captures:**
```
Nice work today.

**Wins:**
- [What was accomplished]

**Carrying Over:**
- [Item] - [Why]

**For Tomorrow:**
- [Suggested priority based on carryover]

Updated your daily note. Rest up.
```

---

## The Conversational Pattern (Critical)

**What makes it work:**

1. **Summarize first, then ask ONE question**
   - Don't just process silently
   - Show what you understood
   - Ask one clarifying thing

2. **Offer suggestions, not just transcription**
   - "Suggested Top 3: ..."
   - "Does this priority order feel right?"
   - "Should X wait until tomorrow?"

3. **Confirm what you captured**
   - "Updated your daily note with..."
   - "I've added X to your Top 3"
   - User knows exactly what changed

4. **Be brief but warm**
   - 2-4 sentences max per turn
   - Mirror user's casual tone
   - "You're all set. Go crush it."

**Example exchange:**
```
USER: "Yeah so I'm gonna redo this project, want to ship it but need
to use it for a week first. Also the restaurant mapping thing morphed
too much, going back to v1. Working on that until 1pm."

AI: "Got it. Let me capture that.

**Claru Project (Later Today):**
- Iterate before shipping
- Use it yourself for a week
- Match current Obsidian workflow

**Right Now (until 1pm): Restaurant Mapping**
- Back to v1, rebuild from there

Want me to add these to your daily note and set Restaurant Mapping as your #1?"

USER: "Yeah, capture it. Working on restaurant in different terminal."

AI: "Done. Captured in today's note:
- Raw dump saved
- Top 3: Restaurant Mapping (now), Claru (later)

Go crush that focus block."
```

---

## What Claru Needs to Build

### Database
```
projects:
- id, user_id, title, description
- type (active | recurring)
- status (active | paused | completed)
- blockers, next_actions, notes
- created_at, updated_at

daily_notes:
- id, user_id, date (unique per user-day)
- raw_markdown (full content, editable)
- brain_dump, top_3, tasks, reflection (extracted fields)
- created_at, updated_at
```

### UI
1. **Projects page** - Create/edit/archive projects
2. **Daily Note view** - Full markdown editor, not just fields
3. **Chat** - Morning/Evening modes with status overview
4. **Historical notes** - Browse past days

### AI (coach-reply Edge Function)
System prompt needs:
- "When user does brain dump, summarize and suggest Top 3"
- "Ask ONE clarifying question at a time"
- "Always confirm what you're writing to the daily note"
- "Reference active projects in morning check-in"
- "Keep responses to 2-4 sentences"

---

## Priority for "Use It This Week"

**P0 - Must work:**
1. Daily notes stored as markdown, editable
2. Brain dump → structured parsing → Top 3
3. Conversational back-and-forth (the dialogue pattern)
4. Morning check-in flow

**P1 - Add during week:**
1. Projects CRUD
2. Projects integrated into morning prompt
3. Evening check-in
4. Carryover from yesterday

**P2 - Later:**
1. Historical notes search
2. Weekly review
3. Task Dashboard view

---

*Simplified scope: No meal tracking, no nutrition science. Just projects, daily notes, and the conversational check-in flow.*
