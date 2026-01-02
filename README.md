# Claru Calm Coaching

An AI-powered calm coaching app that helps users build sustainable foundations for focus, energy, and meaningful work through daily check-ins and structured conversations.

## Current Status

**Phase**: Core Feature Development
**Last Updated**: 2026-01-02

### What This App Does

Claru Calm Coaching provides:

1. **Morning & Evening Check-ins**: Mode-aware conversational coaching that adapts to the time of day
2. **Daily Note Auto-Population**: AI extracts structured data from natural conversations (brain dump, Top 3, meetings, time blocks) and auto-populates Obsidian-style daily notes
3. **Foundation-Based Growth**: Three-phase journey (Discover → Explore → Practice) for building sustainable habits
4. **Seamless Trial-to-Signup**: Preserves conversation history when users convert from trial mode to full accounts
5. **Voice Interaction**: Transcription-enabled coaching with real-time feedback

### Recent Session Accomplishments (2026-01-02)

**Terminology Update**: Renamed "Challenges" to "Foundations" across the entire app, establishing a more supportive, growth-oriented framework.

**Conversation Persistence**: Verified and tested RLS policies ensuring chat messages are properly scoped by user_id, with seamless session continuity.

**Trial Migration**: Built migration logic so trial users don't lose their conversation history when they sign up.

**Daily Note Intelligence**: Implemented AI-powered extraction of check-in data into structured daily note format, matching Obsidian template conventions.

**Foundation Flow**: Wired up "Start Foundation" button to navigate directly to chat with auto-sent initialization message.

### Tech Stack

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, RLS, Edge Functions)
- **AI**: Claude (Anthropic) via Edge Functions
- **Deployment**: Lovable (with plans for Vercel/Netlify preview deployments)

### Key Decisions Made

1. **Database Architecture**: User-scoped chat messages via RLS (no anonymous session handling)
2. **Migration Strategy**: Trial messages transfer on signup to preserve UX continuity
3. **AI Extraction**: Structured prompts in `coach-reply` Edge Function parse conversations into Daily Note fields
4. **Navigation Pattern**: Direct handoff from Impact → Chat for foundation workflows

### Next Steps

- Test end-to-end Foundation flow (Impact → Chat → Daily Note population)
- Verify trial-to-signup migration in production environment
- Set up preview deployments for PR-based testing
- Continue UI polish and coaching prompt refinement

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
