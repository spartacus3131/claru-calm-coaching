# Claru

AI coaching app for calm, focused productivity. Next.js + Supabase + Claude AI.

## Current Focus

**Phase**: Testing & Polish (22/31 features complete)

**Next features**:
- F022: Impact Challenge (C2) - Full implementation
- F030: Fallback Responses - Graceful AI unavailable handling
- F031: Chat History Persistence - Save/load conversations

**Feature list**: `Docs/Build/feature_list.json`

---

## Rules

### Code Style
- Use project logger, not `console.log`
- Always use explicit TypeScript types, never `any`
- Use `cn()` helper for conditional Tailwind classes
- Mobile-first: test on mobile before desktop

### Database Changes
- Write migration in `/claru/supabase/migrations/[timestamp]_[name].sql`
- Always add RLS policies scoped by `user_id`
- Run `supabase db reset` locally before deploying

### AI Prompting
- No em-dashes in AI-generated content (use commas/periods)
- Keep responses concise: 2-4 sentences, 12-18 words average
- Ask ONE clarifying question at a time
- Pattern: summarize → suggest → confirm

### UI/UX
- Use shadcn-ui components from `/claru/src/components/ui/`
- Follow Tailwind utility-first approach
- Calm, spacious feel - no visual clutter

### Terminology
- "Foundations" not "Challenges" (growth-focused language)
- Journey phases: Discover → Explore → Practice

---

## Key Files

**Frontend**:
- `claru/src/app/(app)/` - Main app routes
- `claru/src/components/` - Shared components
- `claru/src/hooks/` - React hooks
- `claru/src/modules/coaching/` - AI prompt logic

**Backend**:
- `claru/src/app/api/` - API routes
- `claru/supabase/migrations/` - DB schema
- `claru/supabase/functions/` - Edge Functions

---

## Reference Files (read on-demand)

- `SESSION_HISTORY.md` - Past session summaries
- `DECISIONS.md` - Architecture decisions and patterns
- `Docs/Build/feature_list.json` - Feature status
- `Docs/Architecture/claru-technical-architecture-v2.md` - Full architecture

---

**Last updated**: 2026-02-01 (Session 12)
