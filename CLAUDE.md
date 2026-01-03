# AI Context: Claru Calm Coaching

Last updated: 2026-01-02

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

**Current Phase**: Testing & Polish (landing page optimized, production deployment active)

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

**Coaching Angle**:
- Warm, supportive tone (not drill sergeant)
- Reflective questions vs. prescriptive advice
- Structured but conversational
- Context-aware (morning vs. evening modes)

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

**Immediate Priority**: Landing page optimization & production validation

**Key Tasks**:
1. Monitor landing page performance (conversion rate, time on page)
2. End-to-end test: Impact → Start Foundation → Chat → Daily Note population
3. Validate trial-to-signup migration in production
4. Consider A/B testing different landing page hooks
5. Minor UI polish (bottom nav, button styling)

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

**Last Session Closed**: 2026-01-03 ("Mischief Managed")
**Next Recommended Action**: Monitor landing page performance, then test end-to-end Foundation flow
