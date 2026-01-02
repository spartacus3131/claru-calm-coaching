# TODO (Claru Calm Coaching)

Last updated: 2026-01-02

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
  - [ ] Validate that preview behaves like prod (UI + “system prompt” sensitivity)
- [ ] Define release workflow:
  - [ ] PR → preview test → merge → production deploy
  - [ ] Add a short test checklist (UI states + prompt/regression checks)

## UI Polish (already implemented, pending merge to main)

- [ ] Open PR and merge branch `ui/yellow-active-bottom-buttons` into `main`
  - PR link: `https://github.com/spartacus3131/claru-calm-coaching/pull/new/ui/yellow-active-bottom-buttons`
- [ ] Confirm deployment host (Lovable or other) is building from `main` (or enable branch previews)

## “Session Closer” Agent (tracking)

- [ ] Decide: separate repo vs inside this repo (e.g. `apps/session-closer/`)
- [ ] Define success criteria + UI surface (where does it appear in the app?)
- [ ] Decide integration path:
  - [ ] Separate edge function vs reuse `coach-reply`
  - [ ] Any new prompt routing / modes
- [ ] Add minimal end-to-end test path (preview deploy + sample conversation)


