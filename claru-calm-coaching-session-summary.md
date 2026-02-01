---

## 2026-02-01 (Session 20 - UI Porting from Vite App)

**Commits:** None yet (uncommitted changes)

**Key Accomplishments:**

### Ported Full UI from Original Vite App to Next.js

User pointed out that the deployed app had complete UI screens that weren't in the Next.js rebuild. Ported them:

1. **Impact Page** (`claru/src/app/(app)/impact/`)
   - Full Daily Note panel with brain dump, Top 3, organized tasks, end of day
   - Tabs: Overview, Foundations, Patterns
   - Foundation list with numbered circles, detail drawer, "Start Foundation" button

2. **Projects Page** (`claru/src/app/(app)/projects/`)
   - Tabs: Active, Recurring, Done
   - ProjectCard component with expandable details
   - Add/Edit drawer with all fields (goals, blockers, next actions, etc.)

3. **Parking Lot Page** (`claru/src/app/(app)/parking/`)
   - Add new items inline
   - Toggle complete/incomplete
   - Delete items
   - Empty state

4. **Supporting Files Copied:**
   - `claru/src/data/challenges.ts` - All 22 foundations data
   - `claru/src/types/claru.ts` - Type definitions
   - `claru/src/types/projects.ts` - Project types

**Files Created/Modified:**
- `claru/src/app/(app)/impact/page.tsx` - Server component wrapper
- `claru/src/app/(app)/impact/ImpactContent.tsx` - Full client UI
- `claru/src/app/(app)/projects/page.tsx` - Server component wrapper
- `claru/src/app/(app)/projects/ProjectsContent.tsx` - Full client UI
- `claru/src/app/(app)/parking/page.tsx` - Server component wrapper
- `claru/src/app/(app)/parking/ParkingLotContent.tsx` - Full client UI
- `claru/src/data/challenges.ts` - Copied from src/
- `claru/src/types/claru.ts` - Copied from src/
- `claru/src/types/projects.ts` - Copied from src/

**Tests:** 681 passing (no changes to test files)

**Next Session Focus:**
- Test the ported pages with authentication
- Verify hooks work correctly with the new pages
- Consider committing these changes

---

## 2026-02-01 (Session 19 - UI Polish & Brand Consistency)

**Commits:** None yet (uncommitted changes)

**Key Accomplishments:**

### 1. Fixed Bottom Nav Contrast
- Inactive nav items were nearly invisible (opacity-50 + muted-foreground/60)
- Removed opacity-50 from inactive tabs in TryInterface.tsx
- Changed nav button text from `text-muted-foreground/60` to `text-muted-foreground`
- Changed active state background from `bg-accent/20` to `bg-primary/10` for brand consistency

### 2. Fixed Auth Form Brand Consistency
- Auth form was using hardcoded blue colors instead of theme colors
- Updated to use:
  - `bg-primary` for Sign in button (green instead of blue)
  - `text-primary` for "Sign up" link
  - `bg-card` and `border-border` for card styling
  - `focus:ring-primary` for input focus states
- Auth page background updated from `bg-gray-50` to `bg-background`

**Files Modified:**
- `claru/src/components/ui/button.tsx` - Nav variant contrast improvements
- `claru/src/app/try/TryInterface.tsx` - Removed opacity-50 from inactive tabs
- `claru/src/app/auth/AuthForm.tsx` - Theme color consistency
- `claru/src/app/auth/page.tsx` - Background color fix

**Tests:** 681 passing (no changes to test files)

**Visual Improvements:**
- Bottom nav tabs are now clearly visible in both light and dark modes
- Auth page now matches app's green primary color scheme
- Better brand consistency across all screens

**Next Session Focus:**
- Deploy to Vercel for production testing
- Test with real users
- Consider adding more visual polish to placeholder pages (Impact, etc.)

---

## 2026-02-01 (Session 18 - UI Polish & Trial Mode UX)

**Commits:** None (uncommitted changes)

**Key Accomplishments:**

### 1. Fixed Desktop Layout (TryInterface)
- Wrapped `TryInterface` with `AppFrame` component
- Desktop now shows centered app canvas (max-width 640px) with rounded corners and shadow
- Mobile remains full-bleed

### 2. Cleaned Up Bottom Nav
- Smaller icons (`w-5 h-5` instead of `w-7 h-7`)
- More compact (`min-h-[52px]` instead of `60px`)
- Simpler active state - subtle background + slightly larger/bolder text
- Removed heavy border treatment

### 3. Added Dark/Light Mode Toggle
- Installed `next-themes` package
- Created `ThemeProvider` (`claru/src/components/theme-provider.tsx`)
- Created `ThemeToggle` (`claru/src/components/theme-toggle.tsx`)
- Added sun/moon toggle to header

### 4. Fixed Dark Mode Message Bubbles
- Updated `globals.css` to use `.dark .bubble-assistant` pattern
- Bubbles now correctly styled in both light and dark modes

### 5. Morning/Evening Mode Switch Reset
- Switching modes now shows confirmation dialog
- Clears conversation and starts fresh with appropriate welcome message

### 6. Trial Mode Navigation Protection
- Browser warns before closing/refreshing with unsaved messages
- Clicking non-chat nav tabs shows centered modal dialog prompting sign-up

**Files Modified:**
- `claru/src/app/try/TryInterface.tsx` - AppFrame wrapper, dialog, nav handlers
- `claru/src/app/layout.tsx` - ThemeProvider integration
- `claru/src/app/globals.css` - Dark mode bubble fixes
- `claru/src/app/(app)/chat/ChatInterface.tsx` - Mode switch reset, beforeunload
- `claru/src/components/ui/button.tsx` - Nav variant styling
- `claru/src/components/layout/BottomNav.tsx` - Smaller icons

**Files Created:**
- `claru/src/components/theme-provider.tsx`
- `claru/src/components/theme-toggle.tsx`

**Dependencies Added:**
- `next-themes` (for dark/light mode)

**Tests:** 681 passing (no changes to test files)

**Next Session Focus:**
- Continue UI polish based on user testing
- Test auth flow end-to-end
- Consider deploying to Vercel for production testing

---

## 2026-02-01 (Session 17 - F031 Chat History + Local Testing)

**Commits:** None (uncommitted changes in claru/ directory)

**Key Accomplishments:**

### 1. F031: Chat History Persistence (FINAL FEATURE)
Built complete chat history persistence for authenticated users.

**Files Created:**
- `claru/src/hooks/useChatHistory.ts` - Hook for loading/saving messages
- `claru/src/hooks/useChatHistory.test.ts` - Test suite

**Files Modified:**
- `claru/src/app/(app)/chat/ChatInterface.tsx` - Integrated useChatHistory hook
- `claru/src/modules/coaching/fallbacks.ts` - Added missing `adhoc` flow
- `Docs/Build/feature_list.json` - Status updated (31/31 complete!)

**Key Features:**
- `loadChatHistory(userId)` fetches from Supabase
- `saveChatMessage(userId, role, content, metadata)` persists new messages
- `migrateTryModeMessages(userId, messages)` migrates trial to DB
- Real-time streaming support with `updateMessageContent()`

### 2. Local Testing & Bug Fixes
Tested the app locally and fixed 7 issues:

| Issue | Fix |
|---|---|
| Mic button missing | Added `NEXT_PUBLIC_VOICE_ENABLED` and `NEXT_PUBLIC_DEEPGRAM_KEY` to `.env.local` |
| Chat 401 Unauthorized in Try Mode | Updated `/api/chat/route.ts` to allow unauthenticated users |
| AI model 404 Not Found | Changed model to `claude-sonnet-4-20250514` |
| Voice auto-sends too fast | Modified ChatComposer to populate input, not auto-send |
| AI repeating "brain dump" intro | Updated `MORNING_FLOW` prompt to skip intro on subsequent turns |
| Missing bottom nav in Try Mode | Added BottomNav to TryInterface.tsx |
| Voice transcript not clearing | Added `voice.clear()` after transcript transfer in handleVoiceComplete |

**Files Modified for Fixes:**
- `claru/src/app/api/chat/route.ts` - Try Mode support + correct model name
- `claru/src/components/chat/ChatComposer.tsx` - Voice UX improvements
- `claru/src/modules/coaching/prompts.ts` - Prompt fix for repetition
- `claru/src/app/try/TryInterface.tsx` - Added bottom nav
- `claru/.env.local` - Added voice config + Anthropic API key

**ALL 31 FEATURES NOW COMPLETE**

**Tests:** 665+ (useChatHistory tests added)

**Uncommitted Changes:**
- All files in `claru/` directory
- Updated `Docs/Build/feature_list.json`

**Next Session Focus:**
- **UI Polish**: Make sure the interface feels smooth and intuitive
- **Flow Quality**: Ensure the coaching conversation flow works well end-to-end
- Continue iterating based on hands-on testing

---

## 2026-02-01 (Session 16 - F030 Fallback Responses)

**Commits:** None (uncommitted, ready to commit)

**Key Accomplishments:**

### F030: Fallback Responses (Graceful AI Unavailability)
Built complete fallback system for handling AI service failures with retry logic.

**Files Created:**
- `claru/src/modules/coaching/fallbacks.ts` - Phase-aware fallback responses (14 tests)
- `claru/src/modules/coaching/fallbacks.test.ts` - Comprehensive test suite
- `claru/src/modules/coaching/retry.ts` - Exponential backoff with jitter (21 tests)
- `claru/src/modules/coaching/retry.test.ts` - Retry logic tests

**Files Modified:**
- `claru/src/app/api/chat/route.ts` - Integrated fallback + retry modules
- `Docs/Build/feature_list.json` - Status updated (30/31 complete)

**Key Features:**
- Phase-aware fallbacks: `greeting`, `dump`, `priority`, `reflect`, `default`
- Flow-specific messages: morning, evening, challenge_intro
- `getFallbackResponse(flow, phase)` returns context-appropriate message
- `FallbackError` class with embedded fallback response
- `inferPhaseFromContext()` determines phase from message count

**Retry Logic:**
- `withRetry(fn, config)` wraps async functions with retry + exponential backoff
- Default: 3 retries, 1s base delay, 5s max, ±10% jitter
- Auth errors (401/403) NOT retried (per ai-claude.mdc)
- `isRetryableError()` distinguishes transient vs permanent errors
- `onRetry` callback for logging retry attempts

**Technical Decisions:**

1. **Phase Inference**: Fallbacks adapt based on conversation progress
2. **Jitter**: ±10% prevents thundering herd on service recovery
3. **Auth Error Handling**: 401/403 fail fast (no retry)
4. **API Route Integration**: AI call wrapped with 2 retries, 500ms-2s backoff

**Tests:** 665 total (35 new for F030: 14 fallback + 21 retry)

**Features Now Complete:** 30/31

**Remaining Feature:**
- [ ] F031: Chat History Persistence (save and load conversations)

**Next Session Focus:**
Build F031 - the final feature. This completes the MVP.

---

## 2026-02-01 (Session 15 - F029 Try Mode)

**Commits:** None yet (ready to commit)

**Key Accomplishments:**

### F029: Try Mode (Guest Experience Without Auth)
Built complete trial mode with localStorage persistence and migration on signup.

**Files Created:**
- `claru/src/hooks/useTryMode.ts` - Hook for localStorage persistence (14 tests)
- `claru/src/hooks/useTryMode.test.ts` - Comprehensive test suite
- `claru/src/modules/shared/auth/tryModeMigration.ts` - Migration utility (5 tests)
- `claru/src/modules/shared/auth/tryModeMigration.test.ts` - Migration tests
- `claru/src/app/api/chat/migrate/route.ts` - API endpoint for migration
- `claru/supabase/migrations/20260201700000_create_chat_messages.sql` - DB table with RLS

**Files Modified:**
- `claru/src/app/(app)/chat/ChatInterface.tsx` - Added trial mode persistence
- `claru/src/app/auth/AuthForm.tsx` - Added migration on signup
- `claru/src/app/auth/actions.ts` - Return success for client-side migration
- `Docs/Build/feature_list.json` - Status updated (30/31 complete)

**Key Features:**
- Trial messages persist to localStorage under `claru_trial_messages`
- On signup, messages migrate to database via `/api/chat/migrate`
- Seamless continuation: user keeps their conversation after signing up
- localStorage cleared after successful migration
- 19 new tests (14 hook + 5 migration)

**Technical Decisions:**

1. **localStorage Key**: `claru_trial_messages` with ISO timestamp serialization
2. **Migration Timing**: Client-side after auth action returns success (not redirect)
3. **DB Table**: Created `chat_messages` table (also prep for F031 Chat History)
4. **Validation**: Messages validated before migration (id, role, content required)

**Tests:** 630 total (19 new for F029)

**Features Now Complete:** 30/31

**Remaining Features:**
- [ ] F030: Fallback Responses (graceful AI unavailable handling)
- [ ] F031: Chat History Persistence (save and load conversations)

---

## 2026-02-01 (Session 14 - F027 Hot Spots & F028 Streak Tracking)

**Commits:** None (work in progress, not committed yet)

**Key Accomplishments:**

### 1. F027: Hot Spots (Weekly Life Area Ratings)
Weekly check-in for rating 7 life areas (Mind, Body, Emotions, Career, Finances, Relationships, Fun).

**Files Created:**
- `claru/src/components/ui/slider.tsx` - Radix slider component for ratings
- `claru/supabase/migrations/20260201500000_create_hotspots.sql` - DB tables with RLS
- `claru/src/modules/hotspots/types.ts` - Types + Zod schemas
- `claru/src/modules/hotspots/data.ts` - Default areas + utility functions
- `claru/src/modules/hotspots/index.ts` - Module exports
- `claru/src/modules/hotspots/types.test.ts` - Schema tests (15 tests)
- `claru/src/modules/hotspots/data.test.ts` - Utility tests (22 tests)
- `claru/src/app/api/hotspots/route.ts` - API (GET/POST/PUT)
- `claru/src/hooks/useHotSpots.ts` - Client hook with optimistic updates
- `claru/src/app/(app)/hotspots/HotSpotsContent.tsx` - UI component
- `claru/src/app/(app)/hotspots/page.tsx` - Page wrapper

**Key Features:**
- 7 default life areas with customizable names, descriptions, and colors
- 1-10 rating slider with color-coded feedback
- Weekly check-ins tied to week start (Monday)
- AI integration: Summary passed to chat for personalized reflection
- Persistence: Custom areas and ratings stored with RLS

### 2. F028: Streak Tracking (Consecutive Day Check-ins)
Count consecutive days with check-ins to encourage engagement.

**Files Created:**
- `claru/supabase/migrations/20260201600000_create_engagement_records.sql` - DB tables + streak trigger
- `claru/src/modules/engagement/streaks.ts` - Types, schemas, utilities
- `claru/src/modules/engagement/streaks.test.ts` - 39 tests for streak logic
- `claru/src/modules/engagement/index.ts` - Updated exports
- `claru/src/app/api/streaks/route.ts` - API (GET/POST)
- `claru/src/hooks/useStreak.ts` - Client hook
- `claru/src/components/ui/tooltip.tsx` - Tooltip component
- `claru/src/components/engagement/StreakBadge.tsx` - Badge + Card components
- `claru/src/components/engagement/index.ts` - Exports
- `claru/src/components/layout/Header.tsx` - New header with streak badge
- `claru/src/app/(app)/layout.tsx` - Added Header to app layout
- `claru/src/app/(app)/chat/ChatInterface.tsx` - Records morning check-ins
- `claru/src/app/(app)/hotspots/HotSpotsContent.tsx` - Records hot spots check-ins

**Key Features:**
- Automatic streak calculation via database trigger
- Visual streak badge in header with flame icon
- Milestone system (3, 7, 14, 21, 30, 60, 90, 180, 365 days)
- Toast celebrations when hitting milestones
- Streak card for detailed view (current, longest, total)
- Progress bar showing distance to next milestone
- Check-in recording integrated into morning check-in and Hot Spots

**Tests:** 37 new for F027 + 39 new for F028 = 76 new tests

**Dependencies Added:**
- `@radix-ui/react-slider` (for Hot Spots sliders)
- `@radix-ui/react-tooltip` (for streak tooltips)

**Features Now Complete:** 29/31

**Uncommitted Changes:**
- All F027 and F028 files in `claru/` directory
- Updated `Docs/Build/feature_list.json`
- Updated `claru/src/app/(app)/layout.tsx` (added Header)

**Next Session (Remaining Features):**
- [ ] F029: Try Mode (guest experience without auth, migrate on signup)
- [ ] F030: Fallback Responses (graceful AI unavailable handling)
- [ ] F031: Chat History Persistence (save and load conversations)

---

## 2026-02-01 (Session 13 - F025 BPT Analysis & F026 Parking Lot)

**Commits:** None (work in progress, not committed yet)

**Key Accomplishments:**

### 1. F025: BPT Analysis (Biological Prime Time)
Created the Insights Engine module to calculate user's peak energy hours from energy log data.

**Files Created:**
- `claru/src/modules/insights/bptAnalysis.ts` - Core BPT calculation (33 tests)
- `claru/src/modules/insights/index.ts` - Module exports
- `claru/src/app/api/insights/bpt/route.ts` - API endpoint
- `claru/src/hooks/useBPTAnalysis.ts` - React hook
- `claru/src/components/insights/BPTCard.tsx` - UI component

**Key Features:**
- Groups energy logs by hour, calculates averages
- Finds peak hours for morning/afternoon/evening periods
- Readiness check (requires 8+ logs for analysis)
- `formatBPTSummary()` for UI, `formatBPTForPrompt()` for AI context
- Hourly energy bar visualization

### 2. F026: Parking Lot
Built complete Parking Lot Manager for deferring items to later.

**Files Created:**
- `claru/supabase/migrations/20260201400000_create_parked_items.sql` - DB table with RLS
- `claru/src/modules/parking-lot/parkedItems.ts` - Types, schemas, state machine (42 tests)
- `claru/src/modules/parking-lot/index.ts` - Module exports
- `claru/src/app/api/parking/route.ts` - CRUD API (GET/POST/PATCH/DELETE)
- `claru/src/hooks/useParkingLot.ts` - React hook with optimistic updates
- `claru/src/components/parking/ParkingLotItem.tsx` - Item display
- `claru/src/components/parking/AddParkingItem.tsx` - Add input
- `claru/src/app/(app)/parking/page.tsx` - Full page UI

**Key Features:**
- State machine: `parked → under_review → reactivated | parked | deleted`
- 50 item capacity limit (enforced in API)
- 30-day stale threshold with visual warning
- Soft delete (marks as deleted) vs hard delete (permanent)
- Optimistic UI updates

**Tests:** 535 total (75 new for F025 + F026)

**Features Now Complete:** 27/31

**Uncommitted Changes:**
- All F025 and F026 files in `claru/` directory
- Updated `Docs/Build/feature_list.json`

**Next Session:**
- [ ] F027: Hot Spots (weekly ratings for 7 life areas)
- [ ] F028: Streak Tracking
- [ ] F029: Try Mode
- [ ] F030: Fallback Responses
- [ ] F031: Chat History Persistence

---

## 2026-01-31 (Session 7 - Next.js Rebuild Progress)

**Commits:** None (work in progress, not committed yet)

**Key Accomplishments:**

### 1. Fixed State Machine Implementation
- Applied `state-machines.mdc` rules properly
- Added missing `plan_confirmed` state: `created → in_progress → plan_confirmed → completed`
- Added `in_progress → in_progress` transition for additional turns
- Created error classes: `InvalidTransitionError`, `TurnLimitExceeded`
- Created `validateSessionTransition()` function for proper state machine enforcement

### 2. Sessions API Route
- Built `/api/sessions` with GET/POST/PATCH endpoints
- All state transitions validated through state machine (no direct updates)
- Proper Supabase auth and RLS defense-in-depth

### 3. Database Migration
- Added `20260131000003_add_plan_confirmed_state.sql`
- Updates enum and unique constraint for active sessions

**Features Completed (in `claru/` Next.js project):**
- F001: User Authentication (sign up, sign in, sign out, protected routes)
- F002: Bottom Navigation
- F003: Morning Check-In Chat (AI streaming with Claude)
- F004: Plan Extraction
- F005: Daily Notes API (GET/POST/PATCH)
- F006: Daily Note State Machine
- F007: Coaching Session State Machine

**Tests:** 108 passing

**Uncommitted Changes:**
- `claru/` directory (entire Next.js rebuild)
- `Cursor/`, `Docs/` directories
- Modified hooks and screens in original Vite app

**Next Session (2026-02-01):**

**Goal: Finish all MVP features, then test on own check-ins**

Priority TODOs:
- [ ] F008: Evening Reflection Flow
- [ ] F009: Carryover Detection (yesterday's incomplete items)
- [ ] F010: Morning Check-In Integration (connect all pieces)
- [ ] Wire up frontend chat to use sessions API
- [ ] Test end-to-end: Auth → Chat → Plan Extraction → Daily Note save
- [ ] Deploy to Vercel and test

**Ship Criteria:** Use Claru for own daily check-ins for 1 week before public launch

---

## 2026-01-11 (Session 6 - Scope Refinement & Coach-Reply Flow Optimization)

**Commits:**
- `d62ae8e` Add projects feature + refined workflow documentation
- `e2de79b` Simplify morning check-in: less interrogation, more action
- `e78a84c` Improve morning check-in flow: add day planning step

**Key Accomplishments:**

### 1. Extracted Conversation Patterns from Claude Code Sessions
- Analyzed daily check-in transcripts to understand the workflow Claru needs to replicate
- Created `reference/claude-code-workflow-patterns.md` documenting:
  - The 5-step conversation pattern (capture → structure → confirm → plan → commit)
  - Actual examples from user's Claude Code sessions
  - Key insight: Conversational back-and-forth is the magic (not just transcription)

### 2. Refined Project Scope
- Killed: Meal tracking, nutrition science
- Kept: Projects (user-created), Daily Notes (full markdown), Morning/Evening check-ins
- Updated CLAUDE.md Session 6 TODOs with new priorities

### 3. Projects Feature
- Shipped complete projects CRUD with database migration
- Added RLS policy for user_id scoping
- Integrated into navigation as new section

### 4. Coach-Reply Edge Function Rewrite (2x)
- **First iteration**: Simplified from 7-step interrogation to 5-step action pattern
  - Problem: Too terse, didn't actually guide the user
- **Second iteration**: Full conversational flow restored
  - Pattern: Capture → Top 3 → ask about day → time estimates → slot tasks
  - Proper flow that mirrors Claude Code workflow

### 5. Daily Morning Check-in Flow Enhancement
- Added day planning step to ensure tasks are time-blocked
- Fixed markdown formatting issue (removed bold syntax that wasn't rendering)
- Deployed to Supabase

### 6. Pushed All Changes to GitHub/Vercel
- All commits pushed
- Production now reflects improvements

**Technical Decisions:**

1. **Scope Reduction**: Removed meal tracking to focus on core workflow
2. **Projects Table**: Created `projects` table with full CRUD for user-created items
3. **Coach Flow Pattern**: Adopted 5-step conversation pattern from Claude Code analysis
4. **Markdown in Daily Notes**: Ensure full markdown support, not just structured fields

**Problems Solved:**

1. How to understand what makes Claru magical (analyzed actual user workflows)
2. How to implement a conversational flow that guides without being prescriptive
3. How to format markdown output properly in Edge Function responses
4. How to integrate projects into the daily check-in context

**What to Watch:**

User is testing Claru tomorrow and will provide their Claude Code transcript for comparison. Next session will validate whether the flow truly mirrors their actual workflow.

**Next Session:**
- [ ] Review user's actual Claude Code conversation transcript
- [ ] Compare against Claru flow and identify gaps
- [ ] Adjust coach-reply prompts based on real workflow differences
- [ ] Ship evening check-in flow
- [ ] Test carryover functionality (yesterday's incomplete items)

---

## 2026-01-03 (Session 5)

**Commits:**
- `754fde2` ux: fix chat scrolling with min-h-0 + iOS overflow
- `abd449f` ux: lock chat auto-scroll off until true bottom
- `25181b9` ux: stop auto-scroll while user is scrolling
- `2ab470c` ux: don't fight user scroll in chat
- `68018dd` ui: hide chat placeholder during voice waveform
- `8f761e9` ui: tune voice waveform (taller, tighter)
- `0443625` ui: toast mic errors (local debugging)

**Uncommitted:** `.env`

**Accomplished:**
- Rebuilt the mic UI to feel like modern LLM voice input: inline mic, live waveform, Enter-to-stop-and-send, clearer error handling.
- Fixed chat scrolling getting “stuck” with a combination of auto-scroll behavior changes and the core flex/overflow (`min-h-0`) layout fix.

**Next session:**
- [ ] Improve the UI polish for the voice note (waveform and mic controls still feel a bit janky)

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

---

## 2026-01-03 (Session 3 - Landing Page Revamp & Production Setup)

**Key Accomplishments:**

### 1. Em Dash Removal - Voice Consistency
- Removed all em dashes (—) from AI-generated language across the app
- Files updated:
  - `src/data/prompts.ts`
  - `src/data/challenges.ts`
  - `src/data/bonus-tips.ts`
  - `src/data/mockData.ts`
  - `src/components/challenges/ChallengeDetailDrawer.tsx`
  - `src/screens/ChatScreen.tsx`
  - `supabase/functions/coach-reply/index.ts`
- Rationale: Streamline the conversational tone, make AI-generated text feel more natural and less literary

### 2. Edge Function Deployment
- Successfully deployed `coach-reply` function to Supabase project (pmsbuvzlaoweimkogdaf)
- Verified system prompts include updated voice calibration
- Confirmed CORE_PERSONALITY section contains detailed tone-of-voice guidelines

### 3. Vercel Production Setup
- Connected claru-calm-coaching GitHub repo to Vercel
- Configured auto-deployments on push to main branch
- Production URL now auto-deploys on every commit
- Eliminated need for manual Lovable deployments

### 4. Landing Page Revamp (HeroSection.tsx)
- Explored multiple problem statement angles
- Final H1: **"Overwhelmed? Scattered? Struggling to focus?"**
- Subhead: **"In a world of endless distractions, your brain doesn't stand a chance. Unless you have a system."**
- Moved CTA button placement higher (right after the hook)
- Updated three pillars to lead with problem questions:
  - "Too much in your head?" (Mind Clarity)
  - "Can't follow through?" (Intentional Action)
  - "Low energy?" (Sustainable Energy)
- Promise statement: **"Two check-ins a day. 15 minutes total."**

**Creative Strategy Evolution:**

Iterated through several positioning angles:
1. "Your brain is overstimulated" (too clinical)
2. "Distractions everywhere" (problem-focused, lacks agency)
3. **Final: "Overwhelmed? Scattered? Struggling to focus?"** (validates user's feeling, then offers solution)

Key insight: The landing page now leads with emotional validation (overwhelm) before introducing the system-based solution. This creates a "problem-agitate-solve" structure that feels more empathetic than prescriptive.

**Technical Decisions:**

1. **Deployment Platform**: Vercel over Lovable for production
   - Rationale: Auto-deploys, better preview environments, standard workflow
2. **Voice Calibration**: Removed em dashes universally
   - Rationale: Consistency across all AI-generated content (prompts, tips, chat)
3. **Landing Page Structure**: Hook → Promise → CTA → Pillars
   - Rationale: Get users to the action (signup) faster, reduce cognitive load

**Problems Solved:**

1. How to position the app on the landing page (emotional validation first, system second)
2. How to streamline deployment workflow (Vercel auto-deploy)
3. How to ensure consistent voice across all AI touchpoints (em dash removal)

**Ideas Explored but Rejected:**

1. "Your brain is overstimulated" as H1 (too clinical/neuroscience-y)
2. Leading with "Distractions everywhere" (felt victim-y, lacked agency)
3. Putting CTA at the bottom of the hero section (too far down)

**Outstanding Issues:**

None blocking. All changes committed and pushed to GitHub. Vercel auto-deploying.

**Next Session:**
- [ ] Review landing page performance (conversion rate, time on page)
- [ ] A/B test different hook variations if needed
- [ ] Continue Foundation flow end-to-end testing
- [ ] Consider adding social proof / testimonials to landing page

---

## 2026-01-03 (Session 4 - Voice Guide Enhancement & CORE_PERSONALITY Expansion)

**Commits:**
- (Pending commit with enhanced Voice Guide changes)

**Key Accomplishments:**

### 1. Voice Guide Audit & Gap Analysis
- Retrieved original comprehensive Voice Guide markdown file (577 lines)
- Compared against current CORE_PERSONALITY in coach-reply Edge Function
- Identified that only ~25-30% of the original was captured in the deployed system prompt
- Systematic review revealed 5 critical missing elements

### 2. CORE_PERSONALITY Enhancement (coach-reply/index.ts)
Added 5 missing voice elements from the original guide:

**a) Common Phrases Library**
- Opening phrases: "Here's the thing about...", "Consider this:", "What if the problem isn't [assumption]?"
- Transitioning phrases: "But here's the rub:", "This points to something deeper:"
- Acknowledging difficulty: "This is harder than it sounds.", "Most people struggle with this."

**b) Evidence-Citing Patterns**
- Conversational research references (not academic)
- Name researchers like characters: "A Stanford psychologist named BJ Fogg discovered..."
- Use specific numbers: "We check email 88 times per day."
- Acknowledge limits: "Research suggests..." not "Science proves..."

**c) Story Structure for Insights**
- Three-step pattern: Story → Principle → Application
- Open with a specific person in a specific situation
- Extract the universal truth
- Show how user can apply it themselves

**d) 10 Exemplary Quotes**
- "You do not rise to the level of your goals. You fall to the level of your systems."
- "The dread of doing a task uses up more time and energy than doing the task itself."
- "When something isn't working, it's usually a systems problem, not a willpower problem."
- "What would this look like if it were fun?"
- (Plus 6 more)

**e) Cheesy vs. Calm Comparison Table**
- Shows what to avoid vs. what to use instead
- Examples:
  - Avoid: "You've GOT this!" → Use: "This is harder than it sounds. Here's what makes the difference."
  - Avoid: "CRUSH your goals!" → Use: "Small wins compound. The goal isn't to do a lot - it's to become the type of person who shows up."

### 3. Voice Calibration Ratio Addition
- Added missing 5th calibration: "75% accessible, 25% sophisticated (8th-grade reading level with occasional depth)"
- Now all 5 ratios complete:
  1. 60% warm, 40% authoritative
  2. 70% casual, 30% formal
  3. 65% empathetic, 35% direct
  4. 75% accessible, 25% sophisticated
  5. 70% supportive, 30% challenging

### 4. Explicit Em-Dash Rule
- Added "Use em-dashes (use commas or periods instead)" to THINGS YOU NEVER DO list
- Resolves conflict with original guide which liked em-dashes
- Maintains consistency with Session 3 decision to remove em-dashes

### 5. Edge Function Deployment
- Deployed updated coach-reply function to Supabase (project: pmsbuvzlaoweimkogdaf)
- Verified deployment succeeded
- Production system now has full Voice Guide integrated

### 6. AI Context File Updates
- Updated CLAUDE.md with expanded Voice Guide section
- Synced identical updates to AGENTS.md and GEMINI.md
- All AI assistants now have consistent, comprehensive voice guidelines

**Technical Decisions:**

1. **Voice Guide Integration**: Integrated the comprehensive 577-line Voice Guide into the Edge Function's CORE_PERSONALITY section, ensuring the AI coaching tone remains consistent with the original vision

2. **Em-Dash Rule**: Explicitly added "no em-dashes" rule to resolve ambiguity between original guide (liked em-dashes) and Session 3 decision (removed em-dashes)

3. **Exemplary Quotes**: Added 10 specific quotes to give Claude concrete examples of the desired voice (beyond abstract guidelines)

4. **Cheesy vs. Calm Table**: Included comparison table to show concrete contrasts between avoided and preferred language

**Problems Solved:**

1. How to ensure the deployed AI coaching voice matches the original comprehensive Voice Guide
2. How to provide Claude with concrete examples (not just abstract guidelines)
3. How to resolve the em-dash ambiguity between original guide and recent decisions
4. How to make the voice calibration more actionable (phrases, quotes, comparisons vs. just ratios)

**Ideas Explored but Rejected:**

1. Keeping the original guide's em-dash preference (decided to maintain Session 3 consistency)
2. Summarizing the Voice Guide further (chose to include full detail for better AI fidelity)
3. Creating a separate voice prompt file (integrated directly into CORE_PERSONALITY for deployment simplicity)

**Outstanding Issues:**

None blocking. All changes staged and ready to commit.

**Next Session:**
- [ ] Test the enhanced Voice Guide in production (run actual coaching conversations)
- [ ] Compare AI responses before/after to validate improvement
- [ ] Monitor for any unintended voice changes (too formal, too casual, etc.)
- [ ] Continue landing page performance monitoring
- [ ] Continue Foundation flow end-to-end testing


