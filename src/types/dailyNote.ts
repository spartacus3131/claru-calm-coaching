export type DailyNoteTop3Item = { text: string; completed: boolean };

export type DailyNoteDraft = {
  noteDate: string; // yyyy-MM-dd
  rawDump: string;
  morningPrompts: {
    weighingOnMe: string;
    avoiding: string;
    meetings: string;
    followUps: string;
    win: string;
  };
  top3: DailyNoteTop3Item[];
  organizedTasks: {
    actionsToday: string[];
    thisWeek: string[];
    decisionsNeeded: string[];
    quickWins: string[];
    notes: string;
  };
  endOfDay: {
    gotDone: string;
    carryingOver: string;
    wins: string;
  };
};

