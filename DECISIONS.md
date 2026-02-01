# Claru Architecture Decisions

Reference document for why things are built the way they are. Read when touching these areas.

---

## Product Decisions

### Core Idea
An AI coaching app that helps users build sustainable foundations for calm, focused work through conversational daily check-ins.

### Target Audience
Knowledge workers, managers, founders who struggle with:
- Scattered focus
- Overwhelm from competing priorities
- Lack of structured reflection
- Difficulty building sustainable habits

### Validation Approach
- Trial mode to lower barrier to entry
- Preserve trial conversations on signup (reduce friction)
- AI auto-populates Daily Notes (reduce manual work)

### Positioning
"Your calm coaching companion for sustainable productivity"

### Terminology
- OLD: "Challenges" (felt too negative/problem-focused)
- NEW: "Foundations" (emphasizes growth, building, sustainability)

### Three-Phase Journey Framework
1. **Discover**: Understand your patterns and blockers
2. **Explore**: Try new approaches and experiments
3. **Practice**: Build sustainable habits over time

---

## Technical Architecture

### Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind, shadcn-ui
- **Backend**: Supabase (PostgreSQL + RLS + Edge Functions)
- **AI**: Claude (Anthropic) via Vercel AI SDK
- **Deployment**: Vercel (auto-deploy from GitHub main)

### Database Schema

**Core tables**:
- `chat_messages`: user_id, role, content, metadata, timestamp
- `daily_notes`: user_id, date, brain_dump, top_3, meetings, time_blocks, morning_prompts, organized_tasks, end_of_day
- `projects`: user_id, title, description, status, blockers, next_actions
- `user_challenges`: user_id, challenge_id, status, started_at, completed_at

**RLS**: All tables scoped by `user_id` with policies for SELECT, INSERT, UPDATE, DELETE.

### Edge Function Architecture
- `coach-reply`: Main AI interaction endpoint
  - Handles system prompts (morning/evening modes)
  - Extracts structured data for Daily Notes
  - Returns conversational responses

---

## Claru Voice Guide

Claru sounds like a thoughtful friend who happens to have read 300 productivity studies - warm but direct, evidence-based but conversational, motivating through insight rather than hype.

### Voice Calibration
- 60% warm, 40% authoritative (friendly expert, not cold professor or cheerleader)
- 70% casual, 30% formal (conversational with intellectual substance)
- 65% empathetic, 35% direct (normalize struggles, then offer solutions)
- 75% accessible, 25% sophisticated (8th-grade reading level with occasional depth)
- 70% supportive, 30% challenging (compassionate accountability, never shame)

### Coaching Style
- Ask ONE question at a time, then listen
- Use their own words back to them
- Keep responses concise: 2-4 sentences, 12-18 words average
- Lead with empathy FIRST, then offer solutions (normalize → reframe → invite action)
- Treat setbacks as data, not character flaws

### Phrases to Use
- Opening: "Here's the thing about...", "Consider this:", "What if the problem isn't [assumption]?"
- Transitioning: "But here's the rub:", "This points to something deeper:"
- Acknowledging difficulty: "This is harder than it sounds.", "Most people struggle with this."

### Exemplary Quotes
- "You do not rise to the level of your goals. You fall to the level of your systems."
- "The dread of doing a task uses up more time and energy than doing the task itself."
- "When something isn't working, it's usually a systems problem, not a willpower problem."
- "What would this look like if it were fun?"

### Never Do
- Use hustle culture language ("crush it," "grind," "beast mode")
- Use empty superlatives ("game-changing," "revolutionary," "epic")
- Use phrases like "Great question!" or "I'm so glad you asked!"
- Use em-dashes (use commas or periods instead)
- Use more than one exclamation point per message
- Use ALL CAPS for emphasis

---

## User Flows

### Trial-to-Signup Migration
- Trial messages stored in localStorage with `trial_` prefix
- On signup: fetch trial messages → insert into DB with user_id → clear localStorage
- Ensures seamless continuation of conversation

### Foundation Flow
1. User selects Foundation from Impact screen
2. "Start Foundation" button navigates to Chat
3. Auto-sends message: "I want to start the [Foundation Name] foundation"
4. Claude begins coaching conversation

### Conversation Flow
- Morning check-ins populate: brain dump, Top 3, meetings, time blocks
- Evening check-ins populate: reflection, wins, learnings
- AI extracts structured data in real-time (no manual entry required)

---

## Common Patterns

### Making Database Changes
1. Write migration in `/claru/supabase/migrations/[timestamp]_[name].sql`
2. Update RLS policies if needed
3. Run `supabase db reset` locally to test
4. Deploy via `supabase db push` (or Supabase dashboard)

### Updating AI Prompts
1. Edit `/claru/src/modules/coaching/systemPrompt.ts`
2. Add tests in `systemPrompt.test.ts`
3. For Edge Functions: edit `/claru/supabase/functions/coach-reply/index.ts`
4. Deploy via `supabase functions deploy coach-reply`

### Adding UI Components
1. Use shadcn-ui conventions (`/claru/src/components/ui/`)
2. Follow Tailwind utility-first approach
3. Use `cn()` helper for conditional classes
4. Test on mobile-first

---

## Known Edge Cases

### Trial Mode
- localStorage has 5MB limit (unlikely to hit, but monitor)
- Trial messages are NOT synced across devices (by design)
- If signup fails mid-migration, messages stay in localStorage (can retry)

### Daily Note Auto-Population
- Extraction is best-effort (Claude may misinterpret)
- User can edit Daily Note manually if needed
- Date headers must match Obsidian format exactly (`# [YYYY-MM-DD]`)

### Foundation Flow
- Navigation clears chat input (by design)
- Auto-sent message appears as user message (intentional)

---

## Deployment

### Vercel
- Production hosting (auto-deploy from GitHub main branch)
- Connected repo: https://github.com/spartacus3131/claru-calm-coaching.git
- Deployment triggers: Every push to main

### Supabase
- Project ID: pmsbuvzlaoweimkogdaf
- Edge Functions deployed separately via CLI

---

## Legacy TODOs (Session 6)

These were scoped out for initial release but documented for later:

### P0 - Core (mostly done)
- [x] Daily notes with rich fields
- [x] Brain dump → structured parsing
- [x] Morning/evening check-in flows
- [x] Projects CRUD

### P2 - Future
- [ ] Historical notes browser (view past days)
- [ ] Weekly review automation
- [ ] Task Dashboard view
- [ ] Historical data import from Obsidian vault

### Reference Files
- `reference/claude-code-workflow-patterns.md` - Conversation patterns
- `reference/Claro-Daily-Checkin-Workflow.md` - Original workflow spec
