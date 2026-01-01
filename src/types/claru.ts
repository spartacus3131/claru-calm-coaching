export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  relevantResearch?: string[];
  researchInsight?: string;
  actionableTip?: string;
  citation?: string;
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
