# Claro Daily Check-in Workflow

> Reference doc for how the daily check-in should work, based on actual Claude Code sessions.

---

## Session Startup

**Trigger:** "Fire up the pod" / "Daily check-in" / "Load up Obsidian vault"

**What happens:**
1. Load today's daily note (create from template if doesn't exist)
2. Show quick status:
   - Git status (if relevant)
   - Task Dashboard highlights (Top 3 projects, overdue items)
   - Today's note status (empty vs partially filled)
3. Prompt: "Ready for the brain dump" or "What's on your mind?"

---

## Brain Dump Phase

**User input style:** Stream of consciousness, voice transcription, messy thoughts

**What Claro does:**
1. Listen and capture everything
2. Parse into structured categories:
   - **Work tasks/projects** (with project tags)
   - **Personal items**
   - **Admin/errands**
   - **Waiting on / blocked items**
   - **Ideas for later**
3. Write to Raw Dump section of daily note
4. Extract actionable items into Organized Tasks section
5. Suggest Top 3 priorities based on what was dumped

**Example exchange:**
```
User: "Yeah so I'm gonna redo this project, want to ship it but need to use it
for a week first. Also the restaurant mapping thing morphed too much, going
back to v1. Working on that until 1pm. Oh and later I want to work on Clay."

Claro captures:
- Clay project: iterate before shipping, use for 1 week, match Obsidian workflow
- Restaurant mapping: back to v1, rebuild from there (NOW - until 1pm)
- Writes to daily note, sets Top 3
```

---

## Meal/Health Tracking

**Trigger:** User mentions food, meals, what they ate

**What Claro does:**
1. Accept input in any format:
   - Text description ("2 eggs, bread, bacon, some cake")
   - Image upload (parse nutrition labels, estimate portions)
   - Links to products
2. Estimate macros (calories, protein, carbs, fat)
3. Reference user's targets from their Muscle Building Program or diet plan
4. Calculate running totals vs daily targets
5. Provide rest-of-day guidance:
   - What's remaining in each macro
   - Specific meal suggestions that fit the gap
   - Flag constraints (e.g., "you're near your fat limit")

**Example exchange:**
```
User: [uploads image of Liv Up meal box]
"Had this for lunch, also had eggs and cake at breakfast"

Claro:
- Parses nutrition label from image (430g, 542 kcal, 35g protein)
- Estimates breakfast (~845 kcal, 30g protein)
- Shows running total vs 2,850 kcal / 154g protein targets
- Suggests: "You need 89g more protein. Options: Shake at 4pm + lean dinner..."
```

---

## Nutrition Science Integration

**When user asks "should I..." questions:**
- Reference stored knowledge (Attia protocols, Huberman, etc.)
- Apply to their specific situation
- Give actionable answer, not just theory

**Example:**
```
User: "Should I stack protein shake now since I only got 35g at lunch?"

Claro: "No - Attia says hit leucine threshold (~40g) then wait 4-5h for mTOR
reset. 35g is close enough. Take shake at 4pm for second MPS spike, dinner
for third. 3 spikes > 2 bigger ones."
```

---

## Project Management

**Stored project context:**
- Each project has its own file with goals, status, blockers
- Projects can be "recurring" (workout, diet) or "active" (shipping Claro)
- Projects integrate into daily check-in prompts

**What Claro tracks per project:**
- Current status / phase
- Blockers
- Next actions
- Recent progress
- How it connects to daily priorities

**Example recurring project integration:**
```
Morning check-in automatically includes:
- "Workout: What's today's session?" (pulls from program)
- "Diet: Log breakfast to start tracking"
- "Claro: Any progress on shipping?"
```

---

## Key Behaviors

### Be Conversational
- Accept messy voice input
- Don't require structured formats
- Parse intent from natural language

### Be Proactive
- Calculate totals automatically
- Flag issues ("you're over on fat")
- Suggest next actions

### Reference Context
- Know the user's programs, targets, projects
- Apply stored frameworks (Attia, etc.) to live questions
- Connect today's tasks to bigger goals

### Update in Real-Time
- Write to daily note as conversation progresses
- Don't wait until end of session
- Keep running totals current

### Stay Practical
- Give specific recommendations, not just information
- "Eat X" not "you need more protein"
- Time-bound suggestions ("shake at 4pm")

---

## Data Structure

### Daily Note
- Brain dump (raw + prompts)
- Top 3 priorities
- Health tracking (weight, meals, workout)
- Organized tasks (actions, waiting, delegate, quick wins)
- Captured for later (projects, someday, notes)
- End of day reflection

### Project Files
- One file per active project
- Contains: goals, current status, blockers, next actions, history

### Reference Files
- Muscle Building Program (targets, meal structure, training)
- Diet protocols
- Weekly review template
- Hotspots (areas of focus)

---

## Session Close

**Trigger:** "Mischief managed" / "Done for now" / natural end

**What Claro does:**
1. Summarize what was captured/updated
2. Show end-of-day status (what got done, what's carrying)
3. Prompt for any final thoughts
4. Save everything to daily note

---

*Last updated: January 4, 2026*
