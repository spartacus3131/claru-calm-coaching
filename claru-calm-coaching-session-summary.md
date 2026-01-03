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


