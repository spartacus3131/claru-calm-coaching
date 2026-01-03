# Claru Calm Coaching

An AI-powered calm coaching app that helps users build sustainable foundations for focus, energy, and meaningful work through daily check-ins and structured conversations.

## Current Status

**Phase**: Testing & Polish
**Last Updated**: 2026-01-03
**Deployment**: Auto-deploying to Vercel from main branch

### What This App Does

Claru Calm Coaching provides:

1. **Morning & Evening Check-ins**: Mode-aware conversational coaching that adapts to the time of day
2. **Daily Note Auto-Population**: AI extracts structured data from natural conversations (brain dump, Top 3, meetings, time blocks) and auto-populates Obsidian-style daily notes
3. **Foundation-Based Growth**: Three-phase journey (Discover → Explore → Practice) for building sustainable habits
4. **Seamless Trial-to-Signup**: Preserves conversation history when users convert from trial mode to full accounts
5. **Voice Interaction**: Transcription-enabled coaching with real-time feedback

### Recent Session Accomplishments (2026-01-03)

**Landing Page Revamp**: Rewrote hero section with problem-first messaging ("Overwhelmed? Scattered? Struggling to focus?") and elevated CTA placement for better conversion.

**Voice Consistency**: Removed em dashes from all AI-generated content across the app (prompts, challenges, tips, Edge Functions) for a more conversational tone.

**Production Deployment**: Connected GitHub repo to Vercel with auto-deploy on push to main branch, eliminating manual deployment steps.

**Edge Function Update**: Deployed updated coach-reply function to Supabase with voice calibration improvements and verified system prompt accuracy.

### Tech Stack

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, RLS, Edge Functions)
- **AI**: Claude (Anthropic) via Edge Functions
- **Deployment**: Vercel (auto-deploy from GitHub main branch)

### Key Decisions Made

1. **Landing Page Messaging**: Problem-first approach with emotional validation before solution framing
2. **Voice Calibration**: Em dash removal for more conversational AI tone
3. **Deployment Workflow**: Vercel auto-deploy on push to main (replaced Lovable)
4. **Database Architecture**: User-scoped chat messages via RLS (no anonymous session handling)
5. **Migration Strategy**: Trial messages transfer on signup to preserve UX continuity
6. **AI Extraction**: Structured prompts in `coach-reply` Edge Function parse conversations into Daily Note fields

### Next Steps

- Monitor landing page performance (conversion rate, time on page)
- A/B test different hook variations if needed
- Test end-to-end Foundation flow (Impact → Chat → Daily Note population)
- Verify trial-to-signup migration in production environment
- Consider adding social proof / testimonials to landing page

---

## Development Setup

```sh
# Clone the repository
git clone https://github.com/spartacus3131/claru-calm-coaching.git

# Navigate to project directory
cd claru-calm-coaching

# Install dependencies
npm i

# Start development server
npm run dev
```

## Project Structure

- `/src/components`: React components (UI, layout, coaching interface)
- `/src/integrations/supabase`: Database client and types
- `/supabase/functions`: Edge Functions (coach-reply, etc.)
- `/supabase/migrations`: Database schema and RLS policies

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `ANTHROPIC_API_KEY`: Claude API key (for Edge Functions)

See `.env.example` for complete list.

---

**Questions or Issues?** Check the session summary (`claru-calm-coaching-session-summary.md`) or TODO list (`TODO.md`) for context and next steps.
