export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}

export type JourneyPart =
  | 'clarity'
  | 'systems'
  | 'capacity';

// Legacy alias for backwards compatibility
export type ChallengePart = JourneyPart;

export interface FoundationStep {
  title?: string;
  content: string;
}

// Legacy alias
export type ChallengeStep = FoundationStep;

export interface Foundation {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current';
  part: JourneyPart;
  partTitle: string;
  time: string;
  energy: number;
  value: number;
  whatYouGet: string;
  steps: FoundationStep[];
  tips?: string[];
  worksheetPrompts?: string[];
  relevantResearch?: string[];
  researchInsight?: string;
  actionableTip?: string;
  citation?: string;
}

// Legacy alias
export type Challenge = Foundation;

export interface BonusTip {
  id: number;
  title: string;
  description: string;
  content: string;
  tip?: string;
}

export interface Reflection {
  id: string;
  type: 'morning' | 'evening';
  date: Date;
  preview: string;
  content: string;
}

export interface Insight {
  id: string;
  type: 'focus' | 'energy' | 'habit' | 'productivity';
  title: string;
  insight: string;
  recommendation: string;
  icon: string;
}

export interface TodayPriority {
  id: string;
  text: string;
  completed: boolean;
}

export type ProjectType = 'active' | 'recurring';
export type ProjectStatus = 'active' | 'blocked' | 'in-progress' | 'completed' | 'paused';

export interface Project {
  id: string;
  userId: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  goals: string[];
  blockers: string[];
  nextActions: string[];
  recentProgress: string | null;
  notes: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
