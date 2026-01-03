# TODO (Claru Calm Coaching)

Last updated: 2026-01-03

## Immediate Next Steps (Session 3 Handoff)

**Context**: Just completed session 3 ("Mischief Managed") where we:
- Revamped landing page with problem-first messaging
- Removed em dashes for voice consistency
- Connected Vercel for auto-deployments
- Deployed updated Edge Functions

**Priority Tasks**:

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
- Landing page revamped with problem-first messaging
- Em dashes removed from all AI-generated content
- Vercel auto-deploy configured and working
- Production deployment live and stable

**Why We Made Key Decisions**:
1. **Problem-first landing page**: Emotional validation creates connection before offering solution
2. **Em dash removal**: Conversational tone beats literary formality for AI coaching
3. **Vercel for deployment**: Auto-deploy reduces friction, standard workflow
4. **CTA placement high**: Get users to signup faster, reduce drop-off

**What to Tackle First**:
1. Monitor landing page performance (conversion rate, engagement metrics)
2. Test the full Foundation flow end-to-end (most critical user path)
3. Validate trial migration in production (core conversion feature)
4. Consider A/B testing landing page variations if conversion is low


