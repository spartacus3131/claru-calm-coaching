/**
 * Daily note extraction instruction - appended to prompts when AI should extract structured data
 */
export const DAILY_NOTE_EXTRACTION_INSTRUCTION = `

---

## DAILY NOTE EXTRACTION (IMPORTANT)

After your conversational response, you MUST include a structured extraction of any relevant daily note data from the conversation so far. This data will be used to auto-populate the user's Daily Note.

Format your response like this:
1. First, write your normal conversational response
2. Then, at the very end, include the extraction block:

<!-- DAILY_NOTE
{
  "rawDump": "user's brain dump text if shared",
  "morningPrompts": {
    "weighingOnMe": "what they said is weighing on them",
    "avoiding": "what they're avoiding/procrastinating",
    "meetings": "their meetings/commitments",
    "followUps": "who they need to follow up with",
    "win": "what would make today a win"
  },
  "top3": [
    {"text": "first priority", "completed": false},
    {"text": "second priority", "completed": false},
    {"text": "third priority", "completed": false}
  ],
  "organizedTasks": {
    "actionsToday": ["task 1", "task 2"],
    "thisWeek": ["task for later this week"],
    "decisionsNeeded": ["decisions to make"],
    "quickWins": ["quick tasks under 5 min"],
    "notes": "any notes or thoughts"
  },
  "endOfDay": {
    "gotDone": "what they accomplished",
    "carryingOver": "what's carrying over",
    "wins": "wins and insights"
  }
}
DAILY_NOTE -->

RULES:
- Only include fields that have actual content from the conversation
- Omit empty fields entirely (don't include empty strings or arrays)
- Use their exact words when possible
- The JSON must be valid
- This block is hidden from the user - they only see your conversational response`;

/**
 * Types for daily note extraction
 */
export interface DailyNoteExtraction {
  rawDump?: string;
  morningPrompts?: {
    weighingOnMe?: string;
    avoiding?: string;
    meetings?: string;
    followUps?: string;
    win?: string;
  };
  top3?: Array<{ text: string; completed: boolean }>;
  organizedTasks?: {
    actionsToday?: string[];
    thisWeek?: string[];
    decisionsNeeded?: string[];
    quickWins?: string[];
    notes?: string;
  };
  endOfDay?: {
    gotDone?: string;
    carryingOver?: string;
    wins?: string;
  };
}

/**
 * Parse daily note extraction from AI response
 * Returns clean reply (without extraction block) and parsed data
 */
export function parseDailyNoteExtraction(reply: string): {
  cleanReply: string;
  dailyNote: DailyNoteExtraction | null;
} {
  const regex = /<!-- DAILY_NOTE\s*([\s\S]*?)\s*DAILY_NOTE -->/;
  const match = reply.match(regex);

  if (!match) {
    return { cleanReply: reply, dailyNote: null };
  }

  const cleanReply = reply.replace(regex, '').trim();

  try {
    const dailyNote = JSON.parse(match[1]) as DailyNoteExtraction;
    return { cleanReply, dailyNote };
  } catch (e) {
    console.error('Failed to parse daily note extraction:', e);
    return { cleanReply, dailyNote: null };
  }
}
