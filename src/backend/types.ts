import type { Foundation } from '@/types/claru';

export type CheckInMode = 'morning' | 'evening';

export type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type DailyNoteExtraction = Partial<{
  rawDump: string;
  morningPrompts: Partial<{
    weighingOnMe: string;
    avoiding: string;
    meetings: string;
    followUps: string;
    win: string;
  }>;
  top3: Array<{ text: string; completed: boolean }>;
  organizedTasks: Partial<{
    actionsToday: string[];
    thisWeek: string[];
    decisionsNeeded: string[];
    quickWins: string[];
    notes: string;
  }>;
  endOfDay: Partial<{
    gotDone: string;
    carryingOver: string;
    wins: string;
  }>;
}>;

export type CoachReplyInput = {
  message: string;
  conversationHistory: ConversationTurn[];
  mode: CheckInMode;
  foundationDetails?: Pick<
    Foundation,
    | 'id'
    | 'title'
    | 'description'
    | 'time'
    | 'energy'
    | 'value'
    | 'whatYouGet'
    | 'steps'
    | 'tips'
    | 'researchInsight'
    | 'actionableTip'
  >;
};

export type CoachReplyOutput = {
  reply: string;
  dailyNote?: DailyNoteExtraction | null;
  _debug?: unknown;
};

