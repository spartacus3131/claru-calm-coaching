# AI Context: Claru Calm Coaching

Last updated: 2026-01-04

---

## Project State

### Current Workflow Phase

- [x] **Phase 1: Idea & Validation**
  - [x] Define core concept (AI calm coaching for sustainable productivity)
  - [x] Identify target audience (knowledge workers seeking focus/calm)
  - [x] Validate approach (conversational coaching + structured daily notes)

- [x] **Phase 2: Research & Technical Setup**
  - [x] Set up Supabase project (pmsbuvzlaoweimkogdaf)
  - [x] Configure database (RLS policies, migrations)
  - [x] Integrate Claude AI via Edge Functions
  - [x] Build foundational UI (React, shadcn-ui, Tailwind)

- [x] **Phase 3: Core Feature Development**
  - [x] Morning/Evening check-in modes
  - [x] Daily Note auto-population from conversations
  - [x] Trial-to-signup migration flow
  - [x] Foundation (previously "Challenges") framework
  - [x] Voice transcription integration
  - [x] Conversation persistence with RLS
  - [x] Start Foundation button navigation flow

- [ ] **Phase 4: Testing & Polish**
  - [x] Landing page messaging optimization
  - [x] Voice consistency (em dash removal)
  - [x] Production deployment setup (Vercel)
  - [ ] End-to-end Foundation flow testing
  - [ ] Trial migration production validation
  - [ ] UI refinement (bottom nav spacing, button styling)

- [ ] **Phase 5: Launch Preparation**
  - [ ] Production deployment strategy
  - [ ] Analytics integration
  - [ ] User feedback loops

**Current Phase**: Testing & Polish (authentication revamped to passwordless OTP flow)

---

## Key Decisions & Context

### Idea & Validation

**Core Idea**: An AI coaching app that helps users build sustainable foundations for calm, focused work through conversational daily check-ins.

**Target Audience**: Knowledge workers, managers, founders who struggle with:
- Scattered focus
- Overwhelm from competing priorities
- Lack of structured reflection
- Difficulty building sustainable habits

**Validation Approach**:
- Trial mode to lower barrier to entry
- Preserve trial conversations on signup (reduce friction)
- AI auto-populates Daily Notes (reduce manual work)

### Research Insights

**Technical Architecture**:
- Supabase for backend (PostgreSQL + RLS + Edge Functions)
- Claude (Anthropic) for conversational AI
- React + TypeScript + Tailwind for frontend
- Lovable for current deployment (considering Vercel/Netlify for previews)

**User Flow Insights**:
1. Users prefer seamless trial → signup (no data loss)
2. Auto-population of Daily Notes feels magical (reduces friction)
3. Direct navigation from "Start Foundation" to chat creates intentionality
4. Voice interaction lowers engagement barrier

**Key Technical Learnings**:
- RLS policies ensure proper data scoping by user_id
- Edge Functions handle AI prompting + structured extraction
- Trial messages stored in localStorage, migrated to DB on signup
- Daily Note format matches Obsidian template conventions

### Creative Strategy

**Positioning**: "Your calm coaching companion for sustainable productivity"

**Key Terminology Shift**:
- OLD: "Challenges" (felt too negative/problem-focused)
- NEW: "Foundations" (emphasizes growth, building, sustainability)

**Three-Phase Journey Framework**:
1. **Discover**: Understand your patterns and blockers
2. **Explore**: Try new approaches and experiments
3. **Practice**: Build sustainable habits over time

**Claru Voice Guide** (Updated 2026-01-03):

Claru sounds like a thoughtful friend who happens to have read 300 productivity studies - warm but direct, evidence-based but conversational, motivating through insight rather than hype.

*Voice Calibration:*
- 60% warm, 40% authoritative (friendly expert, not cold professor or cheerleader)
- 70% casual, 30% formal (conversational with intellectual substance)
- 65% empathetic, 35% direct (normalize struggles, then offer solutions)
- 75% accessible, 25% sophisticated (8th-grade reading level with occasional depth)
- 70% supportive, 30% challenging (compassionate accountability, never shame)

*Coaching Style:*
- Ask ONE question at a time, then listen
- Use their own words back to them
- Keep responses concise: 2-4 sentences, 12-18 words average
- Lead with empathy FIRST, then offer solutions (normalize → reframe → invite action)
- Treat setbacks as data, not character flaws

*Phrases to Use:*
- Opening: "Here's the thing about...", "Consider this:", "What if the problem isn't [assumption]?"
- Transitioning: "But here's the rub:", "This points to something deeper:"
- Acknowledging difficulty: "This is harder than it sounds.", "Most people struggle with this."

*Exemplary Quotes:*
- "You do not rise to the level of your goals. You fall to the level of your systems."
- "The dread of doing a task uses up more time and energy than doing the task itself."
- "When something isn't working, it's usually a systems problem, not a willpower problem."
- "What would this look like if it were fun?"

*Never Do:*
- Use hustle culture language ("crush it," "grind," "beast mode")
- Use empty superlatives ("game-changing," "revolutionary," "epic")
- Use phrases like "Great question!" or "I'm so glad you asked!"
- Use em-dashes (use commas or periods instead)
- Use more than one exclamation point per message
- Use ALL CAPS for emphasis

### Production Decisions

**Deployment Platform**:
- Vercel for production hosting (auto-deploy from GitHub main branch)
- Connected repo: https://github.com/spartacus3131/claru-calm-coaching.git
- Deployment triggers: Every push to main
- Previous platform: Lovable (now deprecated for this project)

**Voice & Tone Calibration**:
- Removed em dashes (—) universally across AI-generated content
- Reasoning: More conversational, less literary/formal
- Applied to: prompts, challenges, bonus tips, mock data, Edge Functions

**Landing Page Messaging** (2026-01-03):
- Problem-first approach: "Overwhelmed? Scattered? Struggling to focus?"
- Solution framing: "Unless you have a system."
- Three pillars lead with questions (emotional validation before feature explanation)
- CTA placement: High (right after hook and promise)
- Promise: "Two check-ins a day. 15 minutes total."

**Database Schema**:
- `chat_messages`: user_id, role, content, metadata, timestamp
- `daily_notes`: user_id, date, brain_dump, top_3, meetings, time_blocks, etc.
- `foundations`: user_id, title, phase, progress

**Conversation Flow**:
- Morning check-ins populate: brain dump, Top 3, meetings, time blocks
- Evening check-ins populate: reflection, wins, learnings
- AI extracts structured data in real-time (no manual entry required)

**Trial-to-Signup Migration**:
- Trial messages stored in localStorage with `trial_` prefix
- On signup: fetch trial messages → insert into DB with user_id → clear localStorage
- Ensures seamless continuation of conversation

**Foundation Flow**:
- User selects Foundation from Impact screen
- "Start Foundation" button navigates to Chat
- Auto-sends message: "I want to start the [Foundation Name] foundation"
- Claude begins coaching conversation

**Edge Function Architecture**:
- `coach-reply`: Main AI interaction endpoint
  - Handles system prompts (morning/evening modes)
  - Extracts structured data for Daily Notes
  - Returns conversational responses
  - Deployed to Supabase Edge Functions

---

## Working Instructions

### Current Focus

**Immediate Priority**: Complete OTP authentication flow and validate end-to-end

**Key Tasks**:
1. Fix OTP length mismatch (Supabase 8 digits vs UI 6 digits)
2. Verify OTP code is sent in email body (not just link)
3. Test OTP flow end-to-end in development
4. Consider custom SMTP setup for branded emails
5. End-to-end test: Auth → Impact → Start Foundation → Chat → Daily Note population

### Relevant Workflow Prompts

When working on this project, use these prompts to maintain consistency:

**For Feature Development**:
- "How does this fit into the Discover/Explore/Practice framework?"
- "Does this reduce friction or add cognitive load?"
- "Is the tone warm and supportive?"

**For Database Changes**:
- "Have I updated RLS policies?"
- "Does this respect user_id scoping?"
- "Have I created a migration file?"

**For AI Prompting**:
- "Is the system prompt clear about mode (morning/evening)?"
- "Does the extraction logic preserve user intent?"
- "Is the output format consistent with Obsidian conventions?"

**For UI/UX**:
- "Does this feel calm and spacious?"
- "Is the user's next action obvious?"
- "Have I tested on mobile (primary use case)?"

---

## Project-Specific Context

### File Structure

Key files to be aware of:

**Frontend**:
- `/src/components/layout/BottomNav.tsx`: Main navigation
- `/src/components/ui/button.tsx`: Button variants (including nav)
- `/src/pages/Impact.tsx`: Foundation selection screen
- `/src/pages/Chat.tsx`: Conversational coaching interface
- `/src/components/DailyNote.tsx`: Auto-populated daily note display

**Backend**:
- `/supabase/functions/coach-reply/index.ts`: Main AI Edge Function
- `/supabase/migrations/`: Database schema and RLS policies

**Configuration**:
- `/.env`: Environment variables (Supabase URL, keys, Anthropic API key)
- `/supabase/config.toml`: Supabase project configuration

### Common Patterns

**Making Database Changes**:
1. Write migration in `/supabase/migrations/[timestamp]_[name].sql`
2. Update RLS policies if needed
3. Run `supabase db reset` locally to test
4. Deploy via `supabase db push` (or Supabase dashboard)

**Updating AI Prompts**:
1. Edit `/supabase/functions/coach-reply/index.ts`
2. Test locally via Supabase CLI
3. Deploy via `supabase functions deploy coach-reply`
4. Keep backup in local file (in case Edge Function gets overwritten)

**Adding UI Components**:
1. Use shadcn-ui conventions (`/src/components/ui/`)
2. Follow Tailwind utility-first approach
3. Use `cn()` helper for conditional classes
4. Test on mobile-first

### Edge Cases & Known Issues

**Trial Mode**:
- localStorage has 5MB limit (unlikely to hit, but monitor)
- Trial messages are NOT synced across devices (by design)
- If signup fails mid-migration, messages stay in localStorage (can retry)

**Daily Note Auto-Population**:
- Extraction is best-effort (Claude may misinterpret)
- User can edit Daily Note manually if needed
- Date headers must match Obsidian format exactly (`# [YYYY-MM-DD]`)

**Foundation Flow**:
- Navigation clears chat input (by design)
- Auto-sent message appears as user message (intentional)

---

## Session History Summary

### Session 4 (2026-01-03)
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

**Files Modified**:
- `src/hooks/useAuth.tsx`: Added sendOtp, verifyOtp functions
- `src/pages/Auth.tsx`: New OTP code entry UI

**What Worked**:
- OTP flow is simpler than password management
- Staying on page instead of redirect feels smoother
- Email-based auth aligns with product simplicity goal

**Blockers Found**:
- OTP length mismatch: Supabase Email OTP Length set to 8, UI expects 6 digits
- Need to verify Supabase sends code in email body (not just link)

**What to Watch**:
- Fix Supabase Email OTP Length setting (dashboard → Auth → Providers → Email OTP)
- Confirm OTP code appears in email before next session
- Test end-to-end flow once OTP mismatch is resolved

### Session 3 (2026-01-03)
**Focus**: Landing page revamp, voice consistency, production deployment setup

**What Changed**:
- Removed em dashes from all AI-generated content
- Deployed coach-reply Edge Function to production
- Connected GitHub repo to Vercel for auto-deployments
- Rewrote landing page hero section with problem-first messaging

**Key Commits**:
- Landing page revamp (HeroSection.tsx)
- Em dash removal across 7+ files
- Edge Function deployment
- Vercel configuration

**What Worked**:
- Problem-first landing page approach feels more empathetic
- Em dash removal makes voice more conversational
- Vercel auto-deploy simplifies workflow

**What to Watch**:
- Landing page conversion rate (A/B test hooks if needed)
- Production deployment stability
- User feedback on messaging clarity

### Session 2 (2026-01-02)
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

**What Worked**:
- Direct navigation from Impact → Chat feels intentional
- Trial migration logic is clean and preserves UX continuity
- AI extraction of structured data works surprisingly well

**What to Watch**:
- Ensure extraction prompts stay robust as conversations get complex
- Monitor trial migration success rate in production
- Test edge cases (long conversations, special characters, etc.)

---

## How to Use This File

This file is designed to give you (Claude, Gemini, or any AI assistant) the full context you need to:

1. Understand the current state of the project
2. Make decisions consistent with past choices
3. Navigate the codebase effectively
4. Avoid re-solving already-solved problems

When resuming work:
1. Read "Current Focus" to understand immediate priorities
2. Check "Session History Summary" for recent context
3. Review "Key Decisions & Context" for strategic background
4. Use "Relevant Workflow Prompts" to maintain consistency

When making changes:
1. Update relevant sections of this file
2. Add new learnings to "Key Decisions & Context"
3. Document architectural changes in "Production Decisions"
4. Append session summary when closing out work

---

**Last Session Closed**: 2026-01-04 ("Mischief Managed")
**Next Recommended Action**: See Session 5 TODOs below - Obsidian workflow integration

---

## Session 6 TODOs (2026-01-11) - Refined Scope

### Goal: Use Claru for daily check-ins next week (replacing Obsidian + Claude Code workflow)

**Ship Criteria**: Use it yourself for 1 week before shipping publicly

**Scope Simplified**: No meal tracking, no nutrition science. Focus on core workflow.

---

### The Core Value (What Makes It Work)

The conversational back-and-forth is the magic:
1. User shares messy thoughts (voice/text brain dump)
2. AI structures and summarizes
3. AI asks ONE clarifying question or suggests prioritization
4. User confirms/adjusts
5. AI commits to daily note and confirms what was captured
6. Repeat until aligned

This iterative dialogue makes it a thinking partner, not just a transcription tool.

---

### P0 - Must Work to Be Usable

#### 1. Daily Notes (Full Markdown, Editable)
**Problem**: Current daily notes are extracted fields only, not full stored documents.

**TODOs**:
- [ ] Add `raw_markdown` column to daily_notes table (or restructure)
- [ ] Daily Note view shows full markdown with editor
- [ ] One note per day per user, auto-created
- [ ] User can edit directly at any time
- [ ] Updated in real-time during conversation

#### 2. Brain Dump → Structured Parsing → Top 3
**Problem**: Need to take messy input and suggest priorities.

**TODOs**:
- [ ] Update coach-reply system prompt for brain dump parsing
- [ ] AI should summarize what it understood
- [ ] AI suggests Top 3 priorities
- [ ] AI asks "Does this priority order feel right?"

#### 3. Conversational Pattern (The Dialogue)
**Problem**: Current AI might just respond without confirming/clarifying.

**TODOs**:
- [ ] Update system prompt: "Ask ONE clarifying question at a time"
- [ ] Update system prompt: "Always confirm what you're writing to the daily note"
- [ ] Update system prompt: "Keep responses to 2-4 sentences"
- [ ] Response pattern: summarize → suggest → confirm

#### 4. Morning Check-in Flow
**Problem**: Need status overview at session start.

**TODOs**:
- [ ] Detect morning check-in (button or phrase like "fire up the pod")
- [ ] Show: today's note status, active projects, carryover from yesterday
- [ ] Prompt for brain dump
- [ ] Flow: dump → structure → clarify → commit

---

### P1 - Add During the Week

#### 5. Projects (User-Created)
**Problem**: No way to track ongoing projects that integrate into check-ins.

**TODOs**:
- [ ] Create `projects` table: id, user_id, title, description, type (active/recurring), status, blockers, next_actions, notes
- [ ] Add RLS policy for user_id scoping
- [ ] `/projects` page with CRUD
- [ ] Integrate active projects into morning check-in prompt
- [ ] Users can create any project type they want (workout, diet, shipping X, etc.)

#### 6. Evening Check-in
**Problem**: No end-of-day reflection flow.

**TODOs**:
- [ ] Detect evening check-in
- [ ] Show Top 3 status (done/not done)
- [ ] Prompt: "What got done? What's carrying over?"
- [ ] Capture wins, carryover items, insights
- [ ] Update daily note with EOD section

#### 7. Carryover from Yesterday
**Problem**: Need continuity between days.

**TODOs**:
- [ ] On morning check-in, load yesterday's incomplete items
- [ ] Show in status overview: "Carrying over: [items]"
- [ ] Suggest as priorities for today

---

### P2 - Later (After Week 1)

- [ ] Historical notes browser (view past days)
- [ ] Weekly review automation
- [ ] Task Dashboard view
- [ ] Historical data import from Obsidian vault

---

### Reference Files

- `reference/claude-code-workflow-patterns.md` - **Main reference** (conversation patterns, examples)
- `reference/Claro-Daily-Checkin-Workflow.md` - Original workflow spec
- `reference/daily-checkin-session-example.jsonl` - Raw session transcript
- `reference/daily-checkin-session-jan5.jsonl` - Second session transcript

---

### Session 5 Summary (2026-01-04)

**Focus**: Bug fix + initial roadmap

**What Changed**:
- Fixed Vercel deployment bug (env vars needed redeploy)
- Created initial TODO list for Obsidian workflow integration
- Added reference session transcripts

---

### Session 6 Notes (2026-01-11)

**Focus**: Scope refinement

**What Changed**:
- Killed meal tracking and nutrition science from scope
- Refined priorities to three core features:
  1. Projects (user-created, any type they want)
  2. Daily notes (full markdown, editable, one per day)
  3. Morning/evening check-ins (the conversational flow)
- Created `claude-code-workflow-patterns.md` with extracted conversation patterns
- Extracted and analyzed actual session transcripts for reference

**Key Insight**:
The conversational back-and-forth is the core value. Summarize → suggest → clarify → confirm. This makes it a thinking partner, not just a note-taker.
