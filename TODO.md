# TODO (Claru Calm Coaching)

Last updated: 2026-01-02

## Immediate Next Steps (Session 2 Handoff)

**Context**: Just completed session 2 ("Mischief Managed") where we:
- Renamed Challenges → Foundations
- Built trial-to-signup migration
- Implemented Daily Note auto-population
- Wired up Start Foundation navigation flow

**Priority Tasks**:

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

- [ ] **UI Polish Cleanup**
  - [ ] Review uncommitted changes (BottomNav.tsx, button.tsx)
  - [ ] Decide: commit as-is or refine further
  - [ ] Test bottom navigation spacing on mobile

---

## Shipping / Preview Deployments (recommended next)

- [ ] Decide preview deployment provider: **Vercel** (recommended) vs **Netlify**
- [ ] Set up **preview deployments per PR/branch**
  - [ ] Connect GitHub repo
  - [ ] Configure build:
    - Build command: `npm run build`
    - Output: `dist`
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

---

## Dependencies / Blockers

**None currently blocking development.**

**External dependencies**:
- Supabase Edge Function deployment (currently working)
- Anthropic Claude API availability (stable)
- Lovable deployment platform (active)

---

## Questions to Answer

1. **Should we allow manual editing of Daily Notes after AI population?**
   - Pro: User control, flexibility
   - Con: Complexity, potential sync issues
   - Recommendation: Start with read-only, add editing later if requested

2. **How should we handle Foundation completion?**
   - When is a Foundation "complete"?
   - Should it loop back to Discover phase?
   - Should we celebrate milestones?

3. **What's the right trial duration?**
   - Currently: unlimited trial with localStorage
   - Consider: time-limited trial (7 days?) or message-limited (20 messages?)
   - Trade-off: conversion rate vs. user experience

---

## Context for Next Session

**Where We Left Off**:
- All core features shipped and deployed to production
- Minor UI polish changes uncommitted (BottomNav, button styling)
- Ready for end-to-end testing of Foundation flow

**Why We Made Key Decisions**:
1. **Challenges → Foundations**: Language matters. "Foundations" feels constructive vs. problem-focused
2. **Trial migration on signup**: Users hate losing data. Seamless migration = higher conversion
3. **AI auto-population**: Reduces friction. Users chat naturally, app handles structure
4. **Direct navigation for Start Foundation**: Creates intentionality. No multi-step flow = faster engagement

**What to Tackle First**:
1. Test the full Foundation flow end-to-end (most critical path)
2. Validate trial migration in production (core conversion feature)
3. Decide on UI polish changes (minor, can be deferred)
4. Consider setting up preview deployments (improves iteration speed)


