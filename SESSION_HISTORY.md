# Claru Session History

Detailed summaries of past development sessions. Read this when you need context on what was built and why.

---

## Session 13 (2026-02-01)
**Focus**: Context-aware chat flow + Daily Note save fix

**What Changed**:
- Built context-aware welcome messages based on time of day and check-in status
  - New `/api/chat-context` endpoint returns context type (morning_checkin, need_help, evening_prompt, all_done)
  - New `useChatContext` hook provides dynamic welcome messages
  - Removed manual morning/evening toggle from chat UI
  - Chat now auto-detects appropriate flow based on user's completion status
- Fixed Daily Note save flow (aligned with technical architecture)
  - Database schema was out of sync (`note_date` vs `date` column)
  - Created migration to add `date`, `state`, `plan`, `reflection` columns
  - API now uses `plan` JSONB field to store Top 3 (per architecture doc)
  - Save confirmation now shows both toast AND inline message from Claru
- Improved confirmation detection
  - Expanded patterns to catch more natural confirmations
  - Increased length threshold from 50 to 80 characters
  - Added patterns: "lock it in", "yes, that sounds perfect", etc.

**Files Created**:
- `claru/src/app/api/chat-context/route.ts`
- `claru/src/hooks/useChatContext.ts`
- `claru/supabase/migrations/20260201_fix_daily_notes_schema.sql`

**Files Modified**:
- `claru/src/app/(app)/chat/ChatInterface.tsx` (removed toggle, added context indicator, inline save msg)
- `claru/src/app/api/daily-notes/route.ts` (aligned with architecture schema)
- `claru/src/modules/coaching/confirmationDetection.ts` (more flexible patterns)

**Key Design Decisions**:
- 5pm threshold for evening prompts (user can self-select via "or something else")
- Welcome messages are context-aware but not pushy
- Save confirmation uses both toast (ephemeral) + inline message (persistent in chat)
- Database schema now matches technical architecture document

**Database Migrations Applied**:
1. Fixed `daily_notes` schema: added `date`, `state`, `plan` columns
2. Made `note_date` nullable (legacy column)
3. Added unique index on `(user_id, date)` for upsert

**Tests**: Build successful, manual E2E testing passed

---

## Session 12 (2026-02-01)
**Focus**: F021 Values Challenge (C1) - Full implementation of Challenge 1

**What Changed**:
- Built F021: Values Challenge (full stack)
  - New `valuesChallenge.ts` module with values-specific logic
  - `ValuesDataSchema` - Zod schema for storing values outcomes
  - `parseValuesData()` - Validates and parses values data from DB
  - `addStepResponse()` - Incremental step response building
  - `extractValuesFromText()` - Extracts values from natural language (45 keywords)
  - `formatValuesForPrompt()` - Formats values for system prompts
  - `isValuesComplete()` / `getNextValuesStep()` - Progress tracking
  - Added `completedValues` to CoachingContext
  - System prompt now includes "User's Core Values" section when Values Foundation is completed
  - Chat API fetches completed Values data and passes to prompt builder

**Files Created**:
- `claru/src/modules/challenges/valuesChallenge.ts`
- `claru/src/modules/challenges/valuesChallenge.test.ts` (41 tests)

**Files Modified**:
- `claru/src/modules/coaching/systemPrompt.ts` (added completedValues support)
- `claru/src/modules/coaching/systemPrompt.test.ts` (+6 tests)
- `claru/src/app/api/chat/route.ts` (fetch completed Values, pass to prompt)
- `claru/src/modules/challenges/index.ts` (export valuesChallenge module)

**Key Design Decisions**:
- Values stored in `user_challenges.data` JSONB field
- Text extraction uses keyword matching + pattern recognition for natural language
- Values capitalized and formatted nicely in prompts
- AI instructed to connect Top 3 to user's values for deeper meaning
- Works alongside active challenge nudges (F020)

**Tests**: 344 passing (+47 new)
**Build**: Successful

---

## Session 11 (2026-02-01)
**Focus**: F020 Challenge Nudges - AI mentions active challenge in check-ins

**What Changed**:
- Built F020: Challenge Nudges (full stack)
  - New `challengeNudges.ts` module with nudge generation functions
  - `formatActiveChallengeForPrompt()` - formats challenge for prompt inclusion
  - `getNudgeForChallenge()` - returns challenge-specific nudges for 10 key challenges
  - `getChallengeNudgeInstructions()` - generates AI instructions for natural integration
  - Added `adhoc` to SessionFlow type with 10 turn limit
  - Updated `CoachingContext` to include `activeChallenge` field
  - Updated `buildSystemPrompt()` to include Active Foundation section
  - Updated chat API to fetch active challenge and pass to prompt builder

**Files Created**:
- `claru/src/modules/coaching/challengeNudges.ts`
- `claru/src/modules/coaching/challengeNudges.test.ts` (14 tests)

**Files Modified**:
- `claru/src/modules/coaching/types.ts` (added adhoc flow)
- `claru/src/modules/coaching/systemPrompt.ts` (added active challenge section)
- `claru/src/modules/coaching/systemPrompt.test.ts` (+5 tests)
- `claru/src/app/api/chat/route.ts` (fetch active challenge, pass to prompt)

**Key Design Decisions**:
- Nudges are NOT forced - AI instructed to weave in naturally (1-2 times/session max)
- Challenge-specific nudges for key challenges (Values, Impact, Prime-Time, Capture, etc.)
- Different nudge styles for morning vs evening flows
- Generic fallback nudges for challenges without specific ones

**Tests**: 297 passing (+19 new)

---

## Session 10 (2026-02-01)
**Focus**: F019 Challenge Introduction Flow - AI-guided foundation onboarding

**What Changed**:
- Built F019: Challenge Introduction Flow (full stack)
  - Challenge intro prompts: `formatChallengeForPrompt()`, `getChallengeIntroGreeting()`, `buildChallengeIntroPrompt()`
  - Added `challenge_intro` to SessionFlow type with 15 turn limit
  - Updated chat API to accept `challengeId` param and use challenge-specific prompts
  - Checks if user's first challenge for personalized welcome
  - Updated ChallengesContent to navigate with `?flow=challenge_intro&challengeId=X`
  - Updated ChatInterface to read URL params and auto-send initial message
  - Added "Foundation Introduction" header in challenge_intro mode
  - Fixed Suspense boundaries for Next.js static generation

**Files Created**:
- `claru/src/modules/coaching/challengeIntroPrompts.ts`
- `claru/src/modules/coaching/challengeIntroPrompts.test.ts` (13 tests)

**Flow Summary**:
1. User taps challenge → drawer opens
2. User taps "Start Foundation" → status updated to active
3. Navigate to `/chat?flow=challenge_intro&challengeId=X&message=...`
4. Chat auto-sends intro message
5. AI (with challenge-specific prompt) guides user step-by-step

**Tests**: 278 passing (+13 new)

---

## Session 9 (2026-02-01)
**Focus**: F018 Challenges Screen - Full stack implementation

**What Changed**:
- Built F018: Challenges Screen (full stack)
  - Database migration: `user_challenges` table with RLS policies
  - State machine: validates challenge status transitions (available → offered → active → completed)
  - API route: `/api/challenges` GET (list with user status) + POST (update status)
  - useChallenges hook: fetch, start, complete, decline challenges (11 tests)
  - ChallengeDetailDrawer component: ported from old src/
  - ChallengesContent page: shows 22 foundations by journey part
  - Added vaul dependency for drawer component

**Files Created**:
- `claru/supabase/migrations/20260201200000_create_user_challenges.sql`
- `claru/src/components/ui/drawer.tsx`
- `claru/src/app/api/challenges/route.ts`
- `claru/src/hooks/useChallenges.ts`
- `claru/src/hooks/useChallenges.test.ts`
- `claru/src/components/challenges/ChallengeDetailDrawer.tsx`

**Tests**: 265 passing

---

## Session 8 (2026-02-01)
**Focus**: F006 Daily Note Panel - Full Obsidian workflow compatibility

**What Changed**:
- Built F006: Daily Note Panel (full stack)
  - Database migration: added morning_prompts, organized_tasks, end_of_day JSONB columns
  - Types + Zod schemas: MorningPrompts, OrganizedTasks, EndOfDay, DailyNoteDraft (11 new tests)
  - API route updates: GET with ?format=draft, PUT for full upsert, PATCH with new fields
  - useDailyNote hook: ported from old src/, adapted for fetch() instead of backend abstraction
  - DailyNotePanel component: ported from old src/, wired to notes page
  - Added date-fns dependency

**Key Discovery**:
The old src/ UI had a richer data model (morning prompts, organized tasks, end of day) than the claru/ Next.js rebuild. This was because claru/ was built from architecture docs, while old src/ was built to match the actual Obsidian workflow. Session 8 aligned the data models.

**Tests**: 254 passing

---

## Session 7 (2026-02-01)
**Focus**: Projects feature and AI context integration

**What Changed**:
- Built F014: Projects CRUD (full stack)
  - Database migration with RLS policies
  - Zod-validated types and converters
  - API routes (GET/POST/PATCH/DELETE)
  - useProjects hook with optimistic updates
  - Projects page with tabs (Active/Parked/Completed)
  - Added missing shadcn components (dialog, dropdown-menu, tabs, textarea, input)
- Built F015: Projects in AI Context
  - Added `activeProjects` to CoachingContext
  - System prompt now includes Active Projects section
  - AI guided to connect tasks to user's projects
- Updated technical architecture doc with projects table schema
- Fixed AI SDK usage property names (inputTokens/outputTokens)

**Tests**: 172 passing

---

## Session 4 (2026-01-03)
**Focus**: Authentication migration from password to passwordless OTP

**What Changed**:
- Removed password-based auth (signUp, signInWithPassword)
- Implemented magic link OTP flow (sendOtp, verifyOtp)
- Added email verification UI with 6-digit code entry
- User stays on page to enter code (no redirect flow)
- Configured Supabase redirect URLs for production/localhost

**Key Commits**:
- `dff3039` auth: switch to magic link (passwordless) flow
- `63ef446` auth: switch to OTP code entry (no redirect)

**Blockers Found**:
- OTP length mismatch: Supabase Email OTP Length set to 8, UI expects 6 digits
- Need to verify Supabase sends code in email body (not just link)

---

## Session 3 (2026-01-03)
**Focus**: Landing page revamp, voice consistency, production deployment setup

**What Changed**:
- Removed em dashes from all AI-generated content
- Deployed coach-reply Edge Function to production
- Connected GitHub repo to Vercel for auto-deployments
- Rewrote landing page hero section with problem-first messaging

**What Worked**:
- Problem-first landing page approach feels more empathetic
- Em dash removal makes voice more conversational
- Vercel auto-deploy simplifies workflow

---

## Session 2 (2026-01-02)
**Focus**: Terminology update, conversation persistence, trial migration, Daily Note auto-population, Foundation flow integration

**What Changed**:
- Renamed "Challenges" → "Foundations" across app
- Verified RLS policies for conversation persistence
- Built trial message migration on signup
- Implemented AI extraction for Daily Note auto-population
- Wired up "Start Foundation" button navigation flow

**Key Commits**:
- `daeb062` Wire up Start Foundation button to navigate to chat
- `9fffbf0` Migrate trial messages to database on signup
- `6e34230` Auto-populate Daily Note from chat conversations
- `3823874` Update terminology from challenges to foundations in prompts

---

## Session 6 Notes (2026-01-11)
**Focus**: Scope refinement

**What Changed**:
- Killed meal tracking and nutrition science from scope
- Refined priorities to three core features:
  1. Projects (user-created, any type they want)
  2. Daily notes (full markdown, editable, one per day)
  3. Morning/evening check-ins (the conversational flow)

**Key Insight**:
The conversational back-and-forth is the core value. Summarize → suggest → clarify → confirm. This makes it a thinking partner, not just a note-taker.

---

## Session 5 Summary (2026-01-04)
**Focus**: Bug fix + initial roadmap

**What Changed**:
- Fixed Vercel deployment bug (env vars needed redeploy)
- Created initial TODO list for Obsidian workflow integration
- Added reference session transcripts
