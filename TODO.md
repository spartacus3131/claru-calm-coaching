# TODO (Claru Calm Coaching)

Last updated: 2026-01-03

## Immediate Next Steps (Session 4 Handoff)

**Context**: Just completed session 4 ("Mischief Managed") where we:
- Expanded CORE_PERSONALITY from ~25% to 100% of original Voice Guide (577 lines)
- Added 5 critical voice elements (phrases library, evidence-citing, story structure, quotes, Cheesy vs. Calm table)
- Added 5th voice calibration ratio (75% accessible, 25% sophisticated)
- Deployed enhanced Edge Function to Supabase production
- Synced comprehensive Voice Guide to CLAUDE.md, AGENTS.md, GEMINI.md

**Priority Tasks**:

- [ ] **Test Enhanced Voice Guide in Production**
  - [ ] Run actual coaching conversations with the updated system
  - [ ] Compare AI responses before/after to validate improvement
  - [ ] Check if Claude uses the new phrases ("Here's the thing about...", "But here's the rub:")
  - [ ] Verify exemplary quotes appear naturally in conversations
  - [ ] Monitor for unintended voice changes (too formal? too casual? too robotic?)
  - [ ] Validate Cheesy vs. Calm table is preventing hustle culture language

- [ ] **Monitor Landing Page Performance**
  - [ ] Track conversion rate (visitors → signups)
  - [ ] Measure time on page
  - [ ] Check bounce rate
  - [ ] Gather user feedback on messaging clarity
  - [ ] Consider A/B testing different hooks if conversion is low

- [ ] **Test End-to-End Foundation Flow**
  - [ ] Select a Foundation from Impact screen
  - [ ] Click "Start Foundation"
  - [ ] Verify navigation to Chat
  - [ ] Confirm auto-sent message appears
  - [ ] Complete coaching conversation
  - [ ] Verify Daily Note auto-populates with extracted data

- [ ] **Validate Trial-to-Signup Migration (Production)**
  - [ ] Start trial mode conversation
  - [ ] Add multiple messages
  - [ ] Sign up with new account
  - [ ] Confirm conversation history transfers
  - [ ] Verify localStorage cleared after migration

---

## Shipping / Preview Deployments

**Status**: Production deployment on Vercel DONE. Preview deployments pending.

- [x] Production deployment on Vercel (auto-deploy from main branch)
- [ ] Set up **preview deployments per PR/branch**
  - [ ] Configure Vercel to create preview URLs for each PR
  - [ ] Confirm each PR gets a unique preview URL
- [ ] Configure env vars for **Preview** + **Production** (keep parity)
  - [ ] Supabase URL / anon key
  - [ ] Any edge function / prompt-related config
  - [ ] Validate that preview behaves like prod (UI + "system prompt" sensitivity)
- [ ] Define release workflow:
  - [ ] PR → preview test → merge → production deploy
  - [ ] Add a short test checklist (UI states + prompt/regression checks)

---

## Future Enhancements (Backlog)

### Landing Page Optimization
- [ ] Add social proof / testimonials
- [ ] A/B test different problem statement hooks
- [ ] Consider video explainer or demo
- [ ] Add FAQ section

### Foundation Journey Improvements
- [ ] Add progress tracking for Discover/Explore/Practice phases
- [ ] Build Foundation detail view (show insights, progress, next steps)
- [ ] Create Foundation completion celebrations

### Daily Note Enhancements
- [ ] Allow manual editing of auto-populated fields
- [ ] Add export to Obsidian functionality
- [ ] Create weekly/monthly rollup views

### Coaching Intelligence
- [ ] Improve AI extraction accuracy for edge cases
- [ ] Add contextual prompts based on user patterns
- [ ] Implement "parking lot" for ideas mentioned in chat

### Analytics & Insights
- [ ] Track Foundation completion rates
- [ ] Measure Daily Note consistency
- [ ] Identify most effective coaching patterns
- [ ] Set up analytics for landing page conversion funnel

---

## Dependencies / Blockers

**None currently blocking development.**

**External dependencies**:
- Supabase Edge Function deployment (currently working)
- Anthropic Claude API availability (stable)
- Vercel deployment platform (active, auto-deploying)

---

## Questions to Answer

1. **How do we measure landing page effectiveness?**
   - Set up analytics tracking (conversion rate, bounce rate, time on page)
   - Define success metrics (what conversion rate is good?)
   - Decide when to iterate vs. when to ship more features

2. **Should we allow manual editing of Daily Notes after AI population?**
   - Pro: User control, flexibility
   - Con: Complexity, potential sync issues
   - Recommendation: Start with read-only, add editing later if requested

3. **How should we handle Foundation completion?**
   - When is a Foundation "complete"?
   - Should it loop back to Discover phase?
   - Should we celebrate milestones?

4. **What's the right trial duration?**
   - Currently: unlimited trial with localStorage
   - Consider: time-limited trial (7 days?) or message-limited (20 messages?)
   - Trade-off: conversion rate vs. user experience

---

## Context for Next Session

**Where We Left Off**:
- Voice Guide expanded from ~25% to 100% in CORE_PERSONALITY (coach-reply Edge Function)
- Added 5 critical voice elements: phrases library, evidence-citing patterns, story structure, exemplary quotes, Cheesy vs. Calm table
- Added 5th voice calibration ratio (75% accessible, 25% sophisticated)
- Deployed enhanced Edge Function to Supabase production
- Synced comprehensive Voice Guide to all AI context files (CLAUDE.md, AGENTS.md, GEMINI.md)

**Why We Made Key Decisions**:
1. **Full Voice Guide Integration**: Original guide (577 lines) was only ~25-30% captured in deployed system - needed comprehensive integration for AI coaching fidelity
2. **Concrete Examples Over Abstract Guidelines**: Added exemplary quotes and Cheesy vs. Calm table to give Claude specific voice targets (not just ratios)
3. **Phrases Library**: Claude responds better to concrete phrase examples than abstract tone guidelines
4. **Evidence-Citing Patterns**: Needed to specify conversational (not academic) research references
5. **Em-Dash Consistency**: Maintained Session 3 decision despite original guide preference (conversational beats literary)

**What to Tackle First**:
1. Test the enhanced Voice Guide in production (run actual coaching conversations, compare before/after)
2. Monitor for unintended voice changes (too formal, too casual, too robotic, etc.)
3. Continue landing page performance monitoring (conversion rate, engagement metrics)
4. Test the full Foundation flow end-to-end (most critical user path)
5. Validate trial migration in production (core conversion feature)


