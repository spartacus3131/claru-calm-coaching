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

export const mockChallenges: Challenge[] = [
  { id: 1, title: 'The Brain Dump', description: 'Clear your mental cache by writing everything down', status: 'completed' },
  { id: 2, title: 'Three Things', description: 'Choose only three priorities for tomorrow', status: 'completed' },
  { id: 3, title: 'The Two-Minute Rule', description: 'If it takes less than two minutes, do it now', status: 'completed' },
  { id: 4, title: 'Energy Mapping', description: 'Track your energy levels throughout the day', status: 'current' },
  { id: 5, title: 'The Focus Block', description: 'Work for 90 minutes without interruption', status: 'locked' },
  { id: 6, title: 'Digital Sunset', description: 'No screens 1 hour before bed', status: 'locked' },
  { id: 7, title: 'Morning Pages', description: 'Write 3 pages first thing in the morning', status: 'locked' },
  { id: 8, title: 'The Weekly Review', description: 'Reflect on what worked and what didn\'t', status: 'locked' },
  { id: 9, title: 'Batching', description: 'Group similar tasks together', status: 'locked' },
  { id: 10, title: 'The Not-To-Do List', description: 'Identify what to stop doing', status: 'locked' },
  { id: 11, title: 'Environment Design', description: 'Set up your space for focus', status: 'locked' },
  { id: 12, title: 'Eat the Frog', description: 'Do your hardest task first', status: 'locked' },
  { id: 13, title: 'Time Boxing', description: 'Assign fixed time slots to tasks', status: 'locked' },
  { id: 14, title: 'The Shutdown Ritual', description: 'Create a clear end to your workday', status: 'locked' },
  { id: 15, title: 'Single-Tasking', description: 'One thing at a time, fully present', status: 'locked' },
  { id: 16, title: 'The 80/20 Review', description: 'Find the 20% that creates 80% of results', status: 'locked' },
  { id: 17, title: 'Productive Procrastination', description: 'Use avoidance energy wisely', status: 'locked' },
  { id: 18, title: 'The Buffer', description: 'Build slack into your schedule', status: 'locked' },
  { id: 19, title: 'Decision Fatigue Defense', description: 'Pre-make routine decisions', status: 'locked' },
  { id: 20, title: 'The Energy Audit', description: 'Match tasks to your energy', status: 'locked' },
  { id: 21, title: 'Mindful Transitions', description: 'Pause between tasks', status: 'locked' },
  { id: 22, title: 'The Integration', description: 'Build your personal system', status: 'locked' },
];

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
