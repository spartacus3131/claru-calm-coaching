---

## 2026-01-02

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
- Shipped a mode-aware coach flow (Morning/Evening) and made Morning output match the exact Obsidian daily note template (headings + checkboxes + today’s date)
- Set up Supabase project `pmsbuvzlaoweimkogdaf` (migrations + secrets + deploy) and added `daily_notes` + an Impact “Daily Note” panel

**Next session:**
- [ ] Verify the system prompt works end-to-end (Morning vs Evening behavior + Obsidian template output)
- [ ] Ensure everything saves “neatly” for review (daily notes + chat history + parking lot; confirm persistence UX)
- [ ] Validate Challenges flow works (Impact → Challenges list → detail drawer)


