---

## 2026-01-02 (Session 1)

**Commits:**
- `78bb0a3` Remove debug stack traces from coach-reply
- `da71343` Force exact daily note date header lines
- `08a4f88` docs: add TODO checklist for deployments and session-closer
- `f16686a` UI: yellow active bottom buttons + stabilize voice overlay
- `5321031` Anchor daily note template date to today
- `17b6362` Fix prompt string escaping in coach-reply
- `ab51173` Fix coach-reply debug flag scoping
- `ba21e3f` Add debug stack traces to coach-reply errors
- `60231e4` Match Obsidian daily note template formatting
- `666eed3` Format morning plan into Obsidian-style headings
- `ef6b236` Tighten morning flow: lock Top 3 + buckets before reflection
- `be67a94` Add Daily Note panel to Impact
- `24692f3` Point app to Claru Supabase project
- `0850a7a` Add daily_notes table migration
- `e2ad978` Show voice errors next to mic button
- `d1f9ca0` Add check-in mode + voice transcription flow
- `1e2ac20` Improve mic permission flow

**Uncommitted:** `.gitignore`, `claru-calm-coaching-session-summary.md`

**Accomplished:**
- Shipped a mode-aware coach flow (Morning/Evening) and made Morning output match the exact Obsidian daily note template (headings + checkboxes + today's date)
- Set up Supabase project `pmsbuvzlaoweimkogdaf` (migrations + secrets + deploy) and added `daily_notes` + an Impact "Daily Note" panel

**Next session:**
- [ ] Verify the system prompt works end-to-end (Morning vs Evening behavior + Obsidian template output)
- [ ] Ensure everything saves "neatly" for review (daily notes + chat history + parking lot; confirm persistence UX)
- [ ] Validate Challenges flow works (Impact → Challenges list → detail drawer)

---

## 2026-01-02 (Session 2 - "Mischief Managed")

**Commits:**
- `daeb062` Wire up Start Foundation button to navigate to chat
- `9fffbf0` Migrate trial messages to database on signup
- `6e34230` Auto-populate Daily Note from chat conversations
- `3823874` Update terminology from challenges to foundations in prompts
- `e4d2a13` Rename Challenges to Foundations with 3-part journey

**Key Accomplishments:**

### 1. Terminology Shift: Challenges → Foundations
- Renamed "Challenges" to "Foundations" throughout the app
- Updated Edge Function prompts and local backup files
- Established 3-part journey framework: Discover → Explore → Practice

### 2. Conversation Persistence Architecture
- Verified RLS policies: chat messages properly scoped to user_id
- Confirmed conversation history persists across sessions
- Users can resume conversations seamlessly after login

### 3. Trial-to-Signup Migration
- Built migration logic to preserve trial mode conversations
- When users sign up after trying the app, their chat history transfers to the database
- Ensures no loss of context during conversion flow

### 4. Daily Note Auto-Population
- Implemented AI extraction of structured data from chat conversations
- Claude automatically extracts:
  - Brain dump content
  - Top 3 priorities
  - Meeting schedules
  - Time blocks
  - Reflection notes
- Data auto-populates the Daily Note in real-time during check-ins

### 5. Foundation Flow Integration
- "Start Foundation" button now navigates to chat
- Auto-sends message to initiate the selected foundation
- Seamless handoff from Impact screen to coaching conversation

**Technical Decisions:**

1. **Database Architecture**: Stuck with user_id scoping for all chat messages (no anonymous session handling)
2. **Migration Strategy**: Trial messages transfer on signup (preserves UX continuity)
3. **AI Extraction**: Used structured prompts in coach-reply Edge Function to parse chat into Daily Note fields
4. **Navigation Pattern**: Direct navigation from Impact → Chat with pre-populated message

**Problems Solved:**

1. How to preserve trial user conversations when they sign up
2. How to structure Daily Notes so they auto-populate from natural conversation
3. How to make "Start Foundation" feel immediate and intentional
4. How to ensure conversation history persists correctly with RLS

**Ideas Explored but Rejected:**

1. Anonymous session handling (decided against complexity)
2. Manual Daily Note entry (chose AI auto-population instead)
3. Multi-step flow for starting foundations (went with direct navigation)

**Outstanding Issues:**

- None blocking. UI polish changes (BottomNav spacing + button styling) uncommitted but minor.

**Next Session:**
- [ ] Test end-to-end Foundation flow (Impact → Chat → Daily Note population)
- [ ] Verify trial-to-signup migration works in production
- [ ] Consider setting up preview deployments (see TODO.md)


