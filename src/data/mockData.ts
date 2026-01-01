import { Message, Challenge, Reflection, Insight, TodayPriority } from '@/types/claru';

export const mockMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Good morning. Take a breath. What's on your mind today?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    quickReplies: ['Ready for check-in', 'Feeling scattered', 'Need focus help'],
  },
  {
    id: '2',
    role: 'user',
    content: "I've got a lot on my plate today. Feeling a bit overwhelmed.",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
  },
  {
    id: '3',
    role: 'assistant',
    content: "That's okay. Overwhelm often comes from trying to hold everything at once. Let's empty your mind first — write down everything that's floating around up there. No order, no judgment.",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    quickReplies: ['Start brain dump', 'Show me an example'],
  },
];

export const mockPriorities: TodayPriority[] = [
  { id: '1', text: 'Finish project proposal', completed: false },
  { id: '2', text: 'Call with Sarah at 2pm', completed: false },
  { id: '3', text: '30 min deep work on report', completed: true },
];

import { CHALLENGE_RESEARCH } from './challenge-research';

// Challenge titles based on Chris Bailey's "The Productivity Project"
const CHALLENGE_TITLES: Record<number, { title: string; description: string }> = {
  1: { title: 'Values Challenge', description: 'Define what productivity means to you personally' },
  2: { title: 'Impact Challenge', description: 'Identify your highest-impact tasks' },
  3: { title: 'Rule of 3', description: 'Choose only three priorities each day' },
  4: { title: 'Prime-Time Challenge', description: 'Discover your biological peak hours' },
  5: { title: 'Flipping Challenge', description: 'Overcome procrastination with small wins' },
  6: { title: 'Time-Traveling', description: 'Connect with your future self' },
  7: { title: 'Disconnecting', description: 'Go offline for focused work periods' },
  8: { title: 'Shrink Your Work', description: 'Use time constraints strategically' },
  9: { title: 'Working in Prime Time', description: 'Protect your peak energy for important work' },
  10: { title: 'Maintenance Challenge', description: 'Batch low-value tasks efficiently' },
  11: { title: 'Zenning Out', description: 'Find calm in low-impact activities' },
  12: { title: 'Delegation Challenge', description: 'Free time by delegating wisely' },
  13: { title: 'Capture Challenge', description: 'Empty your mind with a brain dump' },
  14: { title: 'Hot Spot Challenge', description: 'Balance attention across life domains' },
  15: { title: 'Wandering Challenge', description: 'Let your mind wander for creativity' },
  16: { title: 'Notification Challenge', description: 'Reclaim attention from interruptions' },
  17: { title: 'Single-Tasking', description: 'Focus on one thing at a time' },
  18: { title: 'Meditation Challenge', description: 'Train your attention muscle' },
  19: { title: 'Lamest Diet Challenge', description: 'Fuel your brain with better food' },
  20: { title: 'Water Challenge', description: 'Stay hydrated for optimal cognition' },
  21: { title: 'Heart Rate Challenge', description: 'Move your body to boost your mind' },
  22: { title: 'Sleeping Challenge', description: 'Protect your sleep for peak performance' },
};

export const mockChallenges: Challenge[] = CHALLENGE_RESEARCH.map((research, index) => {
  const titleData = CHALLENGE_TITLES[research.challengeNumber];
  // All challenges are unlocked - only mark first 3 as completed for demo
  const status: Challenge['status'] = index < 3 ? 'completed' : 'current';
  
  return {
    id: research.challengeNumber,
    title: titleData.title,
    description: titleData.description,
    status,
    relevantResearch: research.relevantResearch,
    researchInsight: research.researchInsight,
    actionableTip: research.actionableTip,
    citation: research.citation,
  };
});

export const mockReflections: Reflection[] = [
  {
    id: '1',
    type: 'morning',
    date: new Date(),
    preview: 'Feeling focused today. Main goal is to finish the proposal...',
    content: 'Feeling focused today. Main goal is to finish the proposal and have that difficult conversation with the team.',
  },
  {
    id: '2',
    type: 'evening',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    preview: 'Got more done than expected. The brain dump really helped...',
    content: 'Got more done than expected. The brain dump really helped clear my head.',
  },
  {
    id: '3',
    type: 'morning',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    preview: 'Woke up anxious about the week. Too many meetings...',
    content: 'Woke up anxious about the week. Too many meetings scheduled.',
  },
  {
    id: '4',
    type: 'evening',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    preview: 'Grateful for the quiet afternoon. Made real progress...',
    content: 'Grateful for the quiet afternoon. Made real progress on the report.',
  },
];

export const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'focus',
    title: 'Your Deep Work Window',
    insight: 'You consistently report higher focus between 9-11am. This is your cognitive prime time.',
    recommendation: 'Block this time for your most challenging work. Protect it from meetings.',
    icon: 'Brain',
  },
  {
    id: '2',
    type: 'energy',
    title: 'The Afternoon Dip',
    insight: 'Your energy drops sharply after lunch, usually between 1-3pm.',
    recommendation: 'Schedule lighter tasks or a short walk during this window.',
    icon: 'Battery',
  },
  {
    id: '3',
    type: 'habit',
    title: 'Brain Dump Consistency',
    insight: 'On days you do a morning brain dump, you complete 40% more priorities.',
    recommendation: 'Make the brain dump non-negotiable. Even 5 minutes helps.',
    icon: 'Lightbulb',
  },
  {
    id: '4',
    type: 'productivity',
    title: 'Three Is Your Number',
    insight: 'You successfully complete your priorities when you set exactly 3. More leads to overwhelm.',
    recommendation: 'Resist the urge to add a 4th priority. Trust the constraint.',
    icon: 'Target',
  },
];
