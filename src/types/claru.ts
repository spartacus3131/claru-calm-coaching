export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}

export type ChallengePart = 
  | 'laying-the-groundwork'
  | 'wasting-time'
  | 'end-of-time-management'
  | 'quiet-your-mind'
  | 'attention-muscle'
  | 'next-level';

export interface ChallengeStep {
  title?: string;
  content: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current';
  part: ChallengePart;
  partTitle: string;
  time: string;
  energy: number;
  value: number;
  whatYouGet: string;
  steps: ChallengeStep[];
  tips?: string[];
  worksheetPrompts?: string[];
  relevantResearch?: string[];
  researchInsight?: string;
  actionableTip?: string;
  citation?: string;
}

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
